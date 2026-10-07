import { asyncHandler } from "../../core/utils/asyncHandler.js";
import AlumniProfile from "../models/AlumniProfile.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StaffProfile from "../../staff/models/StaffProfile.js";

export const createAlumniProfile = asyncHandler(async (req, res) => {
  const { studentId, graduationYear, employer, designation, contactEmail, contactPhone, status } = req.body;
  if (!studentId || !graduationYear) {
    return res.status(400).json({
      success: false,
      message: "studentId and graduationYear are required.",
    });
  }

  const student = await StudentProfile.findById(studentId).select("status").lean();
  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }
  if (student.status !== "graduated") {
    return res.status(400).json({
      success: false,
      message: "Only students marked as graduated can be added to the alumni database.",
    });
  }

  const existing = await AlumniProfile.findOne({ studentId }).lean();
  if (existing) {
    return res.status(409).json({ success: false, message: "This student already has an alumni record." });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();

  const profile = await AlumniProfile.create({
    studentId,
    graduationYear,
    employer,
    designation,
    contactEmail,
    contactPhone,
    status: status || "Seeking",
    createdBy: staffProfile?._id,
  });

  res.status(201).json({ success: true, message: "Alumni record created.", data: profile });
});

export const getAlumniProfiles = asyncHandler(async (req, res) => {
  const profiles = await AlumniProfile.find()
    .populate({
      path: "studentId",
      select: "studentId personalInfo programId",
      populate: [
        { path: "personalInfo", select: "fullName" },
        { path: "programId", select: "name" },
      ],
    })
    .sort({ graduationYear: -1, createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: profiles });
});

export const updateAlumniProfile = asyncHandler(async (req, res) => {
  const { employer, designation, contactEmail, contactPhone, status } = req.body;
  const profile = await AlumniProfile.findById(req.params.id);
  if (!profile) {
    return res.status(404).json({ success: false, message: "Alumni record not found." });
  }

  if (employer !== undefined) profile.employer = employer;
  if (designation !== undefined) profile.designation = designation;
  if (contactEmail !== undefined) profile.contactEmail = contactEmail;
  if (contactPhone !== undefined) profile.contactPhone = contactPhone;
  if (status) profile.status = status;
  await profile.save();

  res.status(200).json({ success: true, message: "Alumni record updated.", data: profile });
});
