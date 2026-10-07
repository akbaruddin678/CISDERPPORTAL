import HostelAllocation from "../models/HostelAllocation.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import { AppError } from "../../accountant/middleware/errorHandler.js";
import mongoose from "mongoose";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";

// 🛡️ Helper to cleanly ignore stringified "undefined" from Redux
const safeString = (str) => {
  if (!str || str === "undefined" || str === "null") return null;
  return String(str).trim();
};

export class HostelAllocationService {
  // --- 1. ASSIGN & REGISTER ---
  static async assignHostel(data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        studentId,
        hostelName,
        roomNumber,
        monthlyRent,
        admissionFee,
        securityDeposit,
        admissionDate,
        targetMonth,
        dueDate,
      } = data;

      const student = await StudentProfile.findById(studentId).session(session);
      if (!student) throw new AppError("Student not found", 404);

      const existing = await HostelAllocation.findOne({
        studentId,
        status: "ALLOCATED",
      }).session(session);

      if (existing) {
        throw new AppError(
          `Student already allocated to ${existing.hostelName}`,
          400,
        );
      }

      const allocation = await HostelAllocation.create(
        [
          {
            studentId,
            hostelName,
            roomNumber,
            monthlyRent: Number(monthlyRent),
            admissionFee: Number(admissionFee),
            securityDeposit: Number(securityDeposit),
            allocationDate: admissionDate || new Date(),
            status: "ALLOCATED",
          },
        ],
        { session },
      );

      const hasPaidAdmission = await StudentChallan.findOne({
        studentId,
        challanType: "hostel_admission",
        isDeleted: false,
      }).session(session);

      let totalAmount = Number(monthlyRent);
      const feeDetails = { hostelMonthlyRent: Number(monthlyRent) };
      let challanType = "hostel_monthly";

      if (!hasPaidAdmission) {
        totalAmount += Number(admissionFee) + Number(securityDeposit);
        feeDetails.admissionFee = Number(admissionFee);
        feeDetails.securityDeposit = Number(securityDeposit);
        challanType = "hostel_admission";
      }

      let finalDueDate = new Date();
      if (dueDate) {
        finalDueDate = new Date(dueDate);
      } else {
        finalDueDate.setDate(finalDueDate.getDate() + 10);
      }

      const challanNo = await StudentChallanService.generateChallanNo();

      const newChallan = await StudentChallan.create(
        [
          {
            studentId,
            programId: student.programId,
            departmentId: student.departmentId,
            termId: student.termId,
            semesterId: student.semesterId,
            challanNo: challanNo,
            paymentReference: challanNo,
            dueDate: finalDueDate,
            issueDate: new Date(),
            challanType,
            feeDetails,
            remarks: `Hostel Fee for ${targetMonth}`,
            originalTotal: totalAmount,
            netAmount: totalAmount,
            remainingAmount: totalAmount,
            status: "issued",
            isDeleted: false,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return {
        allocation: allocation[0],
        challan: newChallan[0],
      };
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000)
        throw new AppError("Student already allocated", 400);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --- 2. BULK CHALLAN ---
  static async generateBulkChallan(data) {
    const { studentIds, month, dueDate } = data;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const results = [];
      for (const studentId of studentIds) {
        const allocation = await HostelAllocation.findOne({
          studentId,
          status: "ALLOCATED",
        }).session(session);

        if (!allocation) continue;

        const exists = await StudentChallan.findOne({
          studentId,
          challanType: "hostel_monthly",
          remarks: { $regex: month, $options: "i" },
          isDeleted: false,
        }).session(session);

        if (exists) continue;

        const student =
          await StudentProfile.findById(studentId).session(session);

        let finalDueDate = new Date();
        if (dueDate) {
          finalDueDate = new Date(dueDate);
        } else {
          finalDueDate.setDate(finalDueDate.getDate() + 10);
        }

        const challanNo = await StudentChallanService.generateChallanNo();

        const newChallan = await StudentChallan.create(
          [
            {
              studentId,
              programId: student.programId,
              departmentId: student.departmentId,
              termId: student.termId,
              semesterId: student.semesterId,
              challanNo: challanNo,
              paymentReference: challanNo,
              dueDate: finalDueDate,
              issueDate: new Date(),
              challanType: "hostel_monthly",
              feeDetails: { hostelMonthlyRent: allocation.monthlyRent },
              remarks: `Hostel Fee for ${month}`,
              originalTotal: allocation.monthlyRent,
              netAmount: allocation.monthlyRent,
              remainingAmount: allocation.monthlyRent,
              status: "issued",
              isDeleted: false,
            },
          ],
          { session },
        );
        results.push(newChallan[0]);
      }

      await session.commitTransaction();
      return results;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // --- 3. GET STATS ---
  static async getStats() {
    const allocationStats = await HostelAllocation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalMonthlyPotential: { $sum: "$monthlyRent" },
        },
      },
    ]);

    const financialStats = await StudentChallan.aggregate([
      {
        $match: {
          challanType: { $in: ["hostel_admission", "hostel_monthly"] },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$netAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      admitted: 0,
      vacated: 0,
      totalRoomsOccupied: 0,
      totalMonthlyPotential: 0,
      totalGenerated: 0,
      collected: 0,
      pending: 0,
    };

    allocationStats.forEach((s) => {
      if (s._id === "ALLOCATED") {
        stats.admitted = s.count;
        stats.totalRoomsOccupied = s.count;
        stats.totalMonthlyPotential = s.totalMonthlyPotential;
      } else if (s._id === "VACATED") {
        stats.vacated = s.count;
      }
    });

    financialStats.forEach((s) => {
      stats.totalGenerated += s.totalAmount;
      if (s._id === "paid") {
        stats.collected += s.totalAmount;
      } else if (["issued", "pending", "overdue"].includes(s._id)) {
        stats.pending += s.totalAmount;
      }
    });

    return stats;
  }

  // --- 4. DATA FETCHERS (WITH FILTERS) ---
  static async getHostelChallans(query = {}) {
    try {
      const month = safeString(query.month);
      const search = safeString(query.search);

      const dbQuery = {
        challanType: { $in: ["hostel_admission", "hostel_monthly"] },
        isDeleted: false,
      };

      if (month) {
        const [yearStr, monthStr] = month.split("-");
        if (yearStr && monthStr) {
          const y = parseInt(yearStr, 10);
          const m = parseInt(monthStr, 10);
          if (!isNaN(y) && !isNaN(m)) {
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 1);

            dbQuery.$or = [
              { issueDate: { $gte: start, $lt: end } },
              {
                createdAt: { $gte: start, $lt: end },
                issueDate: { $exists: false },
              },
            ];
          }
        }
      }

      if (search) {
        const regex = new RegExp(search, "i");
        const matchedInfos = await PersonalInfo.find({ fullName: regex })
          .select("studentId")
          .lean();
        const studentProfiles = await StudentProfile.find({
          $or: [
            { studentId: regex },
            { _id: { $in: matchedInfos.map((i) => i.studentId) } },
          ],
        }).select("_id");

        if (dbQuery.$or) {
          dbQuery.$and = [
            { $or: dbQuery.$or },
            {
              $or: [
                { challanNo: regex },
                { studentId: { $in: studentProfiles.map((sp) => sp._id) } },
              ],
            },
          ];
          delete dbQuery.$or;
        } else {
          dbQuery.$or = [
            { challanNo: regex },
            { studentId: { $in: studentProfiles.map((sp) => sp._id) } },
          ];
        }
      }

      return await StudentChallan.find(dbQuery)
        .populate({
          path: "studentId",
          // 🔥 REMOVED familyInfo to prevent StrictPopulateError
          select: "studentId personalInfo programId semesterId",
          populate: [{ path: "personalInfo", select: "fullName fatherName" }],
        })
        .populate("programId", "name")
        .populate("semesterId", "name number")
        .populate("termId", "name")
        .sort({ issueDate: -1 });
    } catch (error) {
      console.error("🔥 CRITICAL DB ERROR in getHostelChallans: ", error);
      throw error;
    }
  }

  static async getAllocations(query = {}) {
    try {
      const search = safeString(query.search);
      const dbQuery = { status: "ALLOCATED" };

      if (search) {
        const regex = new RegExp(search, "i");
        const matchedInfos = await PersonalInfo.find({ fullName: regex })
          .select("studentId")
          .lean();
        const studentProfiles = await StudentProfile.find({
          $or: [
            { studentId: regex },
            { _id: { $in: matchedInfos.map((i) => i.studentId) } },
          ],
        }).select("_id");

        dbQuery.studentId = { $in: studentProfiles.map((sp) => sp._id) };
      }

      return await HostelAllocation.find(dbQuery)
        .populate({
          path: "studentId",
          // 🔥 REMOVED familyInfo to prevent StrictPopulateError
          select: "studentId personalInfo programId semesterId termId",
          populate: [
            { path: "personalInfo", select: "fullName cnic phone fatherName" },
            { path: "programId", select: "name" },
            { path: "semesterId", select: "name number" },
            { path: "termId", select: "name" },
          ],
        })
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error("🔥 CRITICAL DB ERROR in getAllocations: ", error);
      throw error;
    }
  }

  // --- 5. UPDATES & DELETES ---
  static async updateAllocation(id, data) {
    const allocation = await HostelAllocation.findById(id);
    if (!allocation) throw new AppError("Allocation not found", 404);

    if (data.monthlyRent !== undefined) {
      allocation.monthlyRent = Number(data.monthlyRent);
    }
    if (data.roomNumber) {
      allocation.roomNumber = data.roomNumber.trim().toUpperCase();
    }
    if (data.hostelName) {
      allocation.hostelName = data.hostelName;
    }

    await allocation.save();
    return allocation;
  }

  static async vacateHostel(id) {
    return await HostelAllocation.findByIdAndUpdate(
      id,
      { status: "VACATED", vacatedDate: new Date() },
      { new: true },
    );
  }
}
