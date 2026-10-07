import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../models/StudentProfile.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";
import PromotionOverride from "../models/PromotionRequest.js"; // Use the NEW Model

// ==========================================
// 1. GET DEFAULTERS LIST
// ==========================================
export const getSemesterDefaulters = asyncHandler(async (req, res) => {
  const { programId, semesterId } = req.query;

  if (!programId || !semesterId) {
    return res.status(400).json({ success: false, error: "Filters required" });
  }

  // 1. Get Active Students
  const students = await StudentProfile.find({
    programId,
    semesterId,
    status: "active",
  })
    .select("studentId personalInfo")
    .populate("personalInfo", "fullName");

  // 2. Fetch ALL overrides for this semester at once (Optimization)
  const overrides = await PromotionOverride.find({
    semesterId: semesterId,
    studentId: { $in: students.map((s) => s._id) },
  });

  // Create a Map for instant lookup
  // Key: StudentID -> Value: Override Doc
  const overrideMap = new Map();
  overrides.forEach((doc) => overrideMap.set(doc.studentId.toString(), doc));

  const defaulterList = [];

  // 3. Process Logic
  for (const student of students) {
    // Check Dues
    const challan = await StudentChallan.findOne({
      studentId: student._id,
      semesterId: semesterId,
      challanType: { $regex: "tuition|semester", $options: "i" },
      isDeleted: false,
      status: { $ne: "paid" },
    }).select("netAmount status challanNo");

    // If Student has unpaid dues
    if (challan) {
      // Check if we have an override record in our Map
      const overrideDoc = overrideMap.get(student._id.toString());

      const isAllowed = overrideDoc?.accounts?.isCleared || false;
      const remark = overrideDoc?.accounts?.remarks || "";

      defaulterList.push({
        studentId: student._id,
        regNo: student.studentId,
        name: student.personalInfo?.fullName || "N/A",
        challanNo: challan.challanNo,
        amount: challan.netAmount,
        status: challan.status,

        // UI Fields
        isAllowed: isAllowed,
        remark: remark,
      });
    }
  }

  res.status(200).json({ success: true, data: defaulterList });
});

// ==========================================
// 2. TOGGLE ALLOWANCE (The Fix for Duplicates)
// ==========================================
export const toggleStudentExemption = asyncHandler(async (req, res) => {
  const { studentId, semesterId, isAllowed, remark } = req.body;
  const accountantId = req.user._id;

  // ✅ UPSERT LOGIC:
  // - If record exists: UPDATE it.
  // - If record does not exist: CREATE it.
  // - NO Arrays. NO Duplicates.

  const updateData = {
    "accounts.isCleared": isAllowed,
    "accounts.remarks": remark || "",
    "accounts.actionBy": accountantId,
    "accounts.actionDate": new Date(),
  };

  const override = await PromotionOverride.findOneAndUpdate(
    { studentId, semesterId }, // Search condition
    { $set: updateData }, // Data to set
    { upsert: true, new: true, setDefaultsOnInsert: true } // Create if missing
  );

  res.status(200).json({
    success: true,
    message: isAllowed ? "Exemption Granted" : "Exemption Revoked",
    data: override,
  });
});

// ==========================================
// 3. (Optional) Legacy Support
// ==========================================
export const updateRequestStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, message: "Use toggle-exemption instead" });
});
