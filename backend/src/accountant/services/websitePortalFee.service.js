import mongoose from "mongoose";
import StudentChallan from "../model/StudentChallan.js";
import { AppError } from "../middleware/errorHandler.js";

// Helper to escape regex characters and prevent ReDoS attacks
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// ✅ Target Department ID provided by you
const TARGET_DEPARTMENT_ID = "696892f46a084f9d22907877";

export class WebsitePortalFeeService {
  // =========================================================
  // 1. STUDENT PORTAL: Get logged-in student's challans
  // =========================================================
  static async getStudentPortalChallans(studentProfileId) {
    if (!studentProfileId) {
      throw new AppError("Student Profile ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(studentProfileId)) {
      throw new AppError("Invalid Student Profile ID format", 400);
    }

    const StudentFeeStructure = mongoose.model("StudentFeeStructure");
    const activeFeeStructures = await StudentFeeStructure.find({
      studentId: studentProfileId,
      isActive: true,
    }).lean();

    const totalAssignedFee = activeFeeStructures.reduce(
      (sum, structure) => sum + (structure.totalAmount || 0),
      0,
    );

    const allChallans = await StudentChallan.find({
      studentId: studentProfileId,
      isDeleted: false,
      status: { $ne: "cancelled" },
    })
      .populate("termId", "name")
      .populate("programId", "name")
      .populate("semesterId", "number")
      .sort({ createdAt: -1 })
      .lean();

    if (allChallans.length === 0) return [];

    let targetChallan = null;
    const unpaidChallans = allChallans.filter((c) => c.status !== "paid");

    const unpaidAdmission = unpaidChallans.find(
      (c) => c.challanType && c.challanType.toLowerCase().includes("admission"),
    );

    if (unpaidAdmission) {
      targetChallan = unpaidAdmission;
    } else if (unpaidChallans.length > 0) {
      targetChallan = unpaidChallans[unpaidChallans.length - 1];
    } else {
      targetChallan = allChallans[0];
    }

    return [
      {
        _id: targetChallan._id,
        challanId: targetChallan._id,
        challanNo: targetChallan.challanNo,
        challanType: targetChallan.challanType,
        type:
          targetChallan.challanType?.replace(/_/g, " ").toUpperCase() || "FEE",
        program: targetChallan.programId?.name || "N/A",
        session: targetChallan.termId?.name || "N/A",
        semester: targetChallan.semesterId?.number
          ? `Part ${targetChallan.semesterId.number}`
          : "N/A",

        totalAssignedFee: totalAssignedFee,
        feeDetails: targetChallan.feeDetails || {},
        originalTotal: targetChallan.originalTotal || 0,
        arrears: targetChallan.arrears || 0,
        discountReason: targetChallan.discountReason || "",

        issueDate: targetChallan.createdAt,
        dueDate: targetChallan.dueDate,
        baseAmount: targetChallan.originalTotal || 0,
        fineAmount: targetChallan.fineAmount || 0,
        scholarshipAmount: targetChallan.scholarshipAmount || 0,
        discountAmount: targetChallan.discountAmount || 0,
        netAmount: targetChallan.netAmount || 0,
        paidAmount: targetChallan.paidAmount || 0,
        balance: targetChallan.remainingAmount || 0,
        paymentReference:targetChallan.paymentReference || null,
        status: targetChallan.status?.toUpperCase() || "PENDING",
      },
    ];
  }

  // =========================================================
  // 2. ADMIN PORTAL: View All Students Fee Status (FILTERED BY DEPT)
  // =========================================================
  static async getAdminStudentsFeeOverview(query = {}) {
    const { search, page = 1, limit = 50 } = query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 1000); // Increased max limit for full dashboard view
    const skip = (pageNum - 1) * limitNum;

    // Convert TARGET_DEPARTMENT_ID safely
    const targetDeptId = new mongoose.Types.ObjectId(TARGET_DEPARTMENT_ID);

    const pipeline = [
      // 1. Get all valid challans
      { $match: { isDeleted: false, status: { $ne: "cancelled" } } },

      // Sort by creation date so $last grabs the most recent challan's data
      { $sort: { createdAt: 1 } },

      // 2. Group by student
      {
        $group: {
          _id: "$studentId",
          totalInvoiced: { $sum: "$netAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalPending: { $sum: "$remainingAmount" },
          latestChallanDate: { $last: "$createdAt" },
          latestDueDate: { $last: "$dueDate" }, // ✅ Added latest due date for filtering
          challanCount: { $sum: 1 },
        },
      },

      // 3. Ensure _id is treated as an ObjectId
      {
        $addFields: {
          studentObjId: { $toObjectId: "$_id" },
        },
      },

      // 4. Lookup Student Profile
      {
        $lookup: {
          from: "studentprofiles",
          localField: "studentObjId",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

      // ✅ 5. MATCH ONLY THE SPECIFIC DEPARTMENT
      {
        $match: {
          "profile.departmentId": targetDeptId,
        },
      },

      // ✅ 6. Lookup Program Name
      {
        $lookup: {
          from: "programs",
          localField: "profile.programId",
          foreignField: "_id",
          as: "programObj",
        },
      },
      { $unwind: { path: "$programObj", preserveNullAndEmptyArrays: true } },

      // ✅ 7. Lookup Session/Term Name
      {
        $lookup: {
          from: "terms",
          localField: "profile.termId",
          foreignField: "_id",
          as: "termObj",
        },
      },
      { $unwind: { path: "$termObj", preserveNullAndEmptyArrays: true } },

      // 8. Lookup Personal Info
      {
        $lookup: {
          from: "personalinfos",
          localField: "studentObjId",
          foreignField: "studentId",
          as: "personalInfo",
        },
      },
      { $unwind: { path: "$personalInfo", preserveNullAndEmptyArrays: true } },

      // 9. Format Output
      {
        $project: {
          studentProfileId: "$_id",
          rollNo: "$profile.studentId",
          status: "$profile.status",
          fullName: "$personalInfo.fullName",
          cnic: "$personalInfo.cnic",
          phone: "$personalInfo.phone",
          program: "$programObj.name", // ✅ Export Program Name
          session: "$termObj.name", // ✅ Export Session Name
          totalInvoiced: 1,
          totalPaid: 1,
          totalPending: 1,
          challanCount: 1,
          latestChallanDate: 1,
          latestDueDate: 1, // ✅ Export Due Date
        },
      },
      { $sort: { latestChallanDate: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ];

    if (search) {
      const safeSearch = escapeRegex(search);
      const searchRegex = new RegExp(safeSearch, "i");
      pipeline.push({
        $match: {
          $or: [
            { fullName: searchRegex },
            { rollNo: searchRegex },
            { cnic: searchRegex },
          ],
        },
      });
    }

    return await StudentChallan.aggregate(pipeline);
  }

  // =========================================================
  // 3. ADMIN PORTAL: Single Student Detail (FILTERED BY DEPT)
  // =========================================================
  static async getAdminSingleStudentFeeDetail(studentProfileId) {
    if (!mongoose.Types.ObjectId.isValid(studentProfileId)) {
      throw new AppError("Invalid Student Profile ID format", 400);
    }

    // ✅ 2. SECURITY CHECK: Verify the student belongs to the required department
    const StudentProfile = mongoose.model("StudentProfile");
    const profile = await StudentProfile.findById(studentProfileId).lean();

    if (!profile || profile.departmentId?.toString() !== TARGET_DEPARTMENT_ID) {
      throw new AppError(
        "Student not found or does not belong to the College of Intermediate Studies.",
        404,
      );
    }

    const StudentFeeStructure = mongoose.model("StudentFeeStructure");
    const activeFeeStructures = await StudentFeeStructure.find({
      studentId: studentProfileId,
      isActive: true,
    }).lean();

    const totalAssignedFee = activeFeeStructures.reduce(
      (sum, structure) => sum + (structure.totalAmount || 0),
      0,
    );

    const challans = await StudentChallan.find({
      studentId: studentProfileId,
      isDeleted: false,
      status: { $ne: "cancelled" },
    })
      .populate("termId", "name")
      .populate("programId", "name")
      .populate("semesterId", "number")
      .sort({ createdAt: -1 })
      .lean();

    const formattedChallans = challans.map((c) => ({
      _id: c._id,
      challanId: c._id,
      challanNo: c.challanNo,
      challanType: c.challanType,
      type: c.challanType?.replace(/_/g, " ").toUpperCase() || "FEE",
      program: c.programId?.name || "N/A",
      session: c.termId?.name || "N/A",
      semester: c.semesterId?.number ? `Part ${c.semesterId.number}` : "N/A",

      feeDetails: c.feeDetails || {},
      originalTotal: c.originalTotal || 0,
      arrears: c.arrears || 0,
      discountReason: c.discountReason || "",

      issueDate: c.createdAt,
      dueDate: c.dueDate,
      baseAmount: c.originalTotal || 0,
      fineAmount: c.fineAmount || 0,
      scholarshipAmount: c.scholarshipAmount || 0,
      discountAmount: c.discountAmount || 0,
      netAmount: c.netAmount || 0,
      paidAmount: c.paidAmount || 0,
      balance: c.remainingAmount || 0,
      status: c.status?.toUpperCase() || "PENDING",
    }));

    const summary = formattedChallans.reduce(
      (acc, c) => {
        acc.totalInvoiced += c.netAmount;
        acc.totalPaid += c.paidAmount;
        acc.totalPending += c.balance;
        return acc;
      },
      { totalInvoiced: 0, totalPaid: 0, totalPending: 0 },
    );

    summary.totalAssignedFee = totalAssignedFee;

    return { summary, challans: formattedChallans };
  }
}
