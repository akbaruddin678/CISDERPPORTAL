import mongoose from "mongoose";
import StudentProfile from "../../student/models/StudentProfile.js";
import StudentChallan from "../model/StudentChallan.js";
import Enrollment from "../../student/models/Enrollment.js";
import { AppError } from "../middleware/errorHandler.js";

export class StudentLeftService {
  // =========================================================
  // 1. MARK STUDENT AS LEFT & CANCEL UNPAID CHALLANS
  // =========================================================
  static async processStudentLeft(studentId, reason, adminId, proofUrl) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Update Student Profile Status AND save the Reason & Proof
      const profile = await StudentProfile.findByIdAndUpdate(
        studentId,
        {
          status: "withdrawn",
          remark: reason,
          ...(proofUrl && { proofDocument: proofUrl }),
        },
        // ✅ FIX: Added strict: false to forcefully save the file URL
        { new: true, session, strict: false },
      );

      if (!profile) throw new AppError("Student Profile not found", 404);

      // 2. Update Enrollment Status
      await Enrollment.updateMany(
        { studentId: studentId, status: "enrolled" },
        { status: "withdrawn" },
        { session },
      );

      // 3. Find unpaid challans
      const challansToCancel = await StudentChallan.find({
        studentId: studentId,
        status: { $in: ["draft", "issued", "overdue"] },
        isDeleted: false,
      }).session(session);

      let totalCancelledAmount = 0;
      let cancelledCount = 0;

      // 4. Cancel them and log the reason
      for (const challan of challansToCancel) {
        challan.status = "cancelled";
        challan.remarks = `Cancelled due to student leaving. Reason: ${reason}`;
        challan.deletedBy = adminId;
        totalCancelledAmount += challan.remainingAmount;
        cancelledCount++;
        await challan.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return {
        profile,
        financialImpact: {
          cancelledChallansCount: cancelledCount,
          totalAmountWrittenOff: totalCancelledAmount,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // =========================================================
  // 2. GET LIST OF LEFT STUDENTS
  // =========================================================
  static async getLeftStudentsList(query = {}) {
    const { search, page = 1, limit = 50, departmentId } = query;
    const skip = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);

    const baseMatch = { status: "withdrawn" };
    // Scopes the archive to one department (e.g. COIS/College) — the same
    // department-based scoping every other COIS screen already relies on,
    // rather than introducing a separate program-level concept here.
    if (departmentId)
      baseMatch.departmentId = new mongoose.Types.ObjectId(departmentId);

    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "personalinfos",
          localField: "_id",
          foreignField: "studentId",
          as: "personalInfo",
        },
      },
      { $unwind: { path: "$personalInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentId: 1,
          status: 1,
          updatedAt: 1,
          remark: 1,
          proofDocument: 1,
          fullName: "$personalInfo.fullName",
          cnic: "$personalInfo.cnic",
          phone: "$personalInfo.phone",
        },
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    if (search) {
      const safeSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      pipeline.push({
        $match: {
          $or: [
            { fullName: new RegExp(safeSearch, "i") },
            { studentId: new RegExp(safeSearch, "i") },
          ],
        },
      });
    }

    return await StudentProfile.aggregate(pipeline);
  }

  // =========================================================
  // 3. GET STATS FOR LEFT STUDENTS
  // =========================================================
  static async getLeftStudentsStats(departmentId) {
    const profileMatch = { status: "withdrawn" };
    const challanMatch = {
      status: "cancelled",
      remarks: { $regex: /Cancelled due to student leaving/i },
    };
    if (departmentId) {
      const deptObjectId = new mongoose.Types.ObjectId(departmentId);
      profileMatch.departmentId = deptObjectId;
      challanMatch.departmentId = deptObjectId;
    }

    const totalLeftStudents = await StudentProfile.countDocuments(profileMatch);

    const financialStats = await StudentChallan.aggregate([
      { $match: challanMatch },
      {
        $group: {
          _id: null,
          totalLostRevenue: { $sum: "$originalTotal" },
          totalCancelledChallans: { $sum: 1 },
        },
      },
    ]);

    return {
      totalLeftStudents,
      totalLostRevenue: financialStats[0]?.totalLostRevenue || 0,
      totalCancelledChallans: financialStats[0]?.totalCancelledChallans || 0,
    };
  }
}
