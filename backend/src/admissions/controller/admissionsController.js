import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Admission from "../model/Admission.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";
import Challan from "../model/Challan.js"; // Ensure Challan is imported for delete operations
import User from "../../user/model/User.js";

// --- HELPER: Fixes "Cast to ObjectId failed" (500 Error) ---
// Converts empty strings from the frontend into null so Mongoose doesn't crash
const sanitizeId = (id) => {
  if (!id) return null;
  return mongoose.isValidObjectId(id) ? id : null;
};

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

// --- 1. GET MY ADMISSION ---
export const getMyAdmission = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const admission = await Admission.findOne({ userId })
    .populate("academicDepartment")
    .populate("applyingForProgram")
    .populate("applyingSession");

  if (!admission) return res.json({ data: null });
  res.json({ data: admission });
});

// --- 2. SAVE DRAFT (Blocks editing if submitted) ---
export const saveDraftStep = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { step, data } = req.body;

  let admission = await Admission.findOne({ userId });

  // SECURITY: Prevent editing if already submitted
  if (admission && admission.status !== "draft") {
    return res
      .status(400)
      .json({ error: "Application is submitted and cannot be edited." });
  }

  if (!admission) admission = new Admission({ userId, status: "draft" });

  admission.currentStep = step;

  // Merge Data based on Step
  if (step === 1) {
    // FIX: Use sanitizeId to prevent crashing on empty strings
    admission.academicDepartment = sanitizeId(data.applyingForDepartment);
    admission.applyingForProgram = sanitizeId(data.applyingForProgram);
    admission.applyingSession = sanitizeId(data.applyingSession);

    // Update simple fields
    admission.fullName = data.fullName;
    admission.fatherName = data.fatherName;
    admission.phone = data.phone;
    admission.cnic = data.cnic;
    admission.dob = data.dob;
    admission.gender = data.gender;

    // Addresses
    admission.currentAddress = data.currentAddress;
    admission.currentDistrict = data.currentDistrict;
    admission.currentProvince = data.currentProvince;
    admission.currentCountry = data.currentCountry;
    admission.permanentAddress = data.permanentAddress;
    admission.permanentDistrict = data.permanentDistrict;
    admission.permanentProvince = data.permanentProvince;
    admission.permanentCountry = data.permanentCountry;

    // Family
    admission.fathernic = data.fatherCnic;
    admission.motherName = data.motherName;
    admission.motherCnic = data.motherCnic;
    admission.guardianStatus = data.fatherStatus;
    admission.guardianPhone = data.guardianPhone;
    admission.fathersProfession = data.fathersProfession;
    admission.guardianDesignation = data.guardianDesignation;
    admission.incomeBracket = data.familyIncome;
  } else if (step === 2) {
    admission.educationDetails = data.educationDetails;
  } else if (step === 3) {
    // Only update if value is provided to avoid overwriting with null
    if (data.profilePhoto) admission.profilePhoto = data.profilePhoto;
    if (data.cnicDoc_front) admission.cnicDoc_front = data.cnicDoc_front;
    if (data.cnicDoc_back) admission.cnicDoc_back = data.cnicDoc_back;
    if (data.domicileDoc) admission.domicileDoc = data.domicileDoc;
    if (data.matricCertificate)
      admission.matricCertificate = data.matricCertificate;
    if (data.fscCertificate) admission.fscCertificate = data.fscCertificate;
  } else if (step === 4) {
    admission.agreeDeclaration = data.agreeDeclaration === "yes";
  }

  await admission.save();
  res.json({ success: true, step: admission.currentStep });
});

// --- 3. UPLOAD DOCUMENT ---
export const uploadAdmissionDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const url = await uploadToR2(req.file, "admissions/documents");
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

// --- 4. FINAL SUBMIT ---
export const finalSubmitAdmission = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const admission = await Admission.findOne({ userId });

  if (!admission || admission.status !== "draft") {
    // Return error if not found or already submitted
    return res
      .status(400)
      .json({ error: "Invalid submission request or already submitted." });
  }

  if (!admission.agreeDeclaration)
    return res.status(400).json({ error: "Declaration required." });

  // Update Status to Submitted (Locks editing)
  admission.status = "submitted";
  await admission.save();

  res.json({ success: true, admission });
});

// ==========================================
// ADMIN CONTROLLERS (Management)
// ==========================================

// --- GET ADMISSION LIST ---
export const getAdmissionList = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status = "" } = req.query;
  const skip = (page - 1) * parseInt(limit);

  const filter = { isTrashed: { $ne: true } };

  if (search) {
    // Registration number lives on the linked User account (assigned once
    // one exists), not on the Admission document itself — matched
    // separately here and folded into the same $or so a student who
    // already has one can be found by it, alongside name/father name/CNIC.
    const matchingUsers = await User.find({
      registrationNumber: { $regex: search, $options: "i" },
    })
      .select("_id")
      .lean();
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { fatherName: { $regex: search, $options: "i" } },
      { cnic: { $regex: search, $options: "i" } },
      { userId: { $in: matchingUsers.map((u) => u._id) } },
    ];
  }

  // Keep the status summary independent of the selected status tab while
  // still respecting the current search. This lets executive dashboards
  // show an accurate, useful stage breakdown without loading every record.
  const statsFilter = { ...filter };

  if (status && status !== "All Status") {
    filter.status = status.toLowerCase();
  }

  try {
    const [admissions, total, statusRows] = await Promise.all([
      Admission.find(filter)
        .select(
          "fullName fatherName cnic phone guardianPhone status applyingForProgram academicDepartment applyingSession createdAt gender profilePhoto userId currentStep remark"
        )
        .populate("userId", "email registrationNumber")
        .populate("academicDepartment", "name")
        .populate("applyingForProgram", "name")
        .populate("applyingSession", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admission.countDocuments(filter),
      Admission.aggregate([
        { $match: statsFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = statusRows.reduce((acc, row) => {
      acc[row._id || "draft"] = row.count;
      return acc;
    }, {});
    const statsTotal = statusRows.reduce((sum, row) => sum + row.count, 0);

    const transformedData = admissions.map((admission) => ({
      id: admission._id,
      name: admission.fullName,
      email: admission.userId?.email || "N/A",
      registrationNumber: admission.userId?.registrationNumber || "N/A",
      avatar: admission.profilePhoto || null,
      gender: admission.gender || "N/A",
      fatherName: admission.fatherName,
      cnic: admission.cnic,
      phone: admission.phone,
      guardianPhone: admission.guardianPhone || "N/A",
      program: admission.applyingForProgram?.name || "N/A",
      department: admission.academicDepartment?.name || "N/A",
      session: admission.applyingSession?.name || "N/A",
      status: admission.status,
      currentStep: admission.currentStep,
      appliedDate: admission.createdAt,
      remark: admission.remark || "",
    }));

    res.json({
      data: transformedData,
      total,
      hasMore: skip + admissions.length < total,
      page: parseInt(page),
      limit: parseInt(limit),
      stats: {
        total: statsTotal,
        draft: statusCounts.draft || 0,
        submitted: statusCounts.submitted || 0,
        under_review: statusCounts.under_review || 0,
        accepted: statusCounts.accepted || 0,
        rejected: statusCounts.rejected || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching admission list:", error);
    res.status(500).json({ error: "Failed to fetch admission list" });
  }
});

// --- GET ADMISSION DETAILS ---
export const getAdmissionDetails = asyncHandler(async (req, res) => {
  const { admissionId } = req.params;

  if (!mongoose.isValidObjectId(admissionId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const admission = await Admission.findById(admissionId)
    .populate("userId", "fullName email phone registrationNumber")
    .populate("academicDepartment", "name code")
    .populate({
      path: "applyingForProgram",
      populate: { path: "departmentId", select: "name code" },
    })
    .populate("applyingSession", "name code startDate endDate")
    .lean();

  if (!admission) {
    return res.status(404).json({ error: "Admission not found" });
  }

  const detailedData = {
    id: admission._id,
    student: {
      id: admission.userId?._id,
      name: admission.fullName,
      email: admission.userId?.email || "N/A",
      phone: admission.phone,
      cnic: admission.cnic,
      registrationNumber: admission.userId?.registrationNumber || "N/A",
      fatherName: admission.fatherName,
      gender: admission.gender,
      dob: admission.dob,
    },
    address: {
      current: {
        address: admission.currentAddress,
        district: admission.currentDistrict,
        province: admission.currentProvince,
        country: admission.currentCountry,
      },
      permanent: {
        address: admission.permanentAddress,
        district: admission.permanentDistrict,
        province: admission.permanentProvince,
        country: admission.permanentCountry,
      },
    },
    family: {
      fatherName: admission.fatherName,
      fatherCnic: admission.fathernic,
      motherName: admission.motherName,
      motherCnic: admission.motherCnic,
      guardianStatus: admission.guardianStatus,
      guardianPhone: admission.guardianPhone,
      fathersProfession: admission.fathersProfession,
      guardianDesignation: admission.guardianDesignation,
      incomeBracket: admission.incomeBracket,
    },
    academic: {
      department: {
        id: admission.academicDepartment?._id,
        name: admission.academicDepartment?.name || "N/A",
      },
      program: {
        id: admission.applyingForProgram?._id,
        name: admission.applyingForProgram?.name || "N/A",
      },
      session: {
        id: admission.applyingSession?._id,
        name: admission.applyingSession?.name || "N/A",
      },
    },
    education: admission.educationDetails || [],
    application: {
      status: admission.status,
      step: admission.currentStep,
      appliedDate: admission.createdAt,
      agreeDeclaration: admission.agreeDeclaration,
    },
    documents: {
      profilePhoto: admission.profilePhoto,
      cnicDoc_front: admission.cnicDoc_front,
      cnicDoc_back: admission.cnicDoc_back,
      domicileDoc: admission.domicileDoc,
      matricCertificate: admission.matricCertificate,
      fscCertificate: admission.fscCertificate,
    },
  };

  res.json({ success: true, data: detailedData });
});

// --- UPDATE ADMISSION REMARK --- staff note, editable at any stage
// (Incomplete/Complete tabs), independent from the one-time trashRemark.
export const updateAdmissionRemark = asyncHandler(async (req, res) => {
  const { admissionId } = req.params;
  const { remark } = req.body;

  if (!mongoose.isValidObjectId(admissionId)) {
    return res.status(400).json({ success: false, error: "Invalid admission ID" });
  }

  const admission = await Admission.findByIdAndUpdate(
    admissionId,
    { remark: remark || "" },
    { new: true },
  ).select("remark");

  if (!admission) {
    return res.status(404).json({ success: false, error: "Admission not found" });
  }

  res.status(200).json({
    success: true,
    data: { id: admission._id, remark: admission.remark },
  });
});

// --- DELETE ADMISSION ---
export const deleteAdmission = asyncHandler(async (req, res) => {
  const { admissionId } = req.params;

  if (!mongoose.isValidObjectId(admissionId)) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid admission ID" });
  }

  const admission = await Admission.findById(admissionId);
  if (!admission) {
    return res
      .status(404)
      .json({ success: false, error: "Admission not found" });
  }

  try {
    // Ensure Challan model is imported or available if using this line
    await Challan.deleteMany({ admissionId });
    await Admission.findByIdAndDelete(admissionId);

    res.status(200).json({
      success: true,
      message: "Admission deleted successfully",
      deletedId: admissionId,
    });
  } catch (error) {
    console.error("Error deleting admission:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete admission: " + error.message,
    });
  }
});

// --- DELETE SESSION ADMISSIONS ---
export const deleteSessionAdmissions = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.isValidObjectId(sessionId)) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid session ID" });
  }

  try {
    const session = await mongoose.model("Term").findById(sessionId);
    const sessionName = session?.name || sessionId;

    const admissions = await Admission.find({ applyingSession: sessionId });
    const admissionIds = admissions.map((adm) => adm._id);

    await Challan.deleteMany({ admissionId: { $in: admissionIds } });
    const result = await Admission.deleteMany({ applyingSession: sessionId });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} admissions for session ${sessionName}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting session admissions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete session admissions: " + error.message,
    });
  }
});
