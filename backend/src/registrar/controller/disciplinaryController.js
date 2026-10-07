import { asyncHandler } from "../../core/utils/asyncHandler.js";
import DisciplinaryFile from "../models/DisciplinaryFile.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StaffProfile from "../../staff/models/StaffProfile.js";

export const createDisciplinaryFile = asyncHandler(async (req, res) => {
  const { studentId, incident, incidentDate, reportedBy, severity } = req.body;
  if (!studentId || !incident || !incidentDate || !reportedBy || !severity) {
    return res.status(400).json({
      success: false,
      message: "studentId, incident, incidentDate, reportedBy and severity are required.",
    });
  }

  const student = await StudentProfile.findById(studentId).select("termId").lean();
  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();

  const file = await DisciplinaryFile.create({
    studentId,
    termId: student.termId,
    incident,
    incidentDate,
    reportedBy,
    severity,
    createdBy: staffProfile?._id,
  });

  res.status(201).json({ success: true, message: "Disciplinary file created.", data: file });
});

export const getDisciplinaryFiles = asyncHandler(async (req, res) => {
  const files = await DisciplinaryFile.find()
    .populate({
      path: "studentId",
      select: "studentId personalInfo programId",
      populate: [
        { path: "personalInfo", select: "fullName" },
        { path: "programId", select: "name" },
      ],
    })
    .populate("termId", "name")
    .sort({ incidentDate: -1 })
    .lean();

  res.status(200).json({ success: true, data: files });
});

export const updateDisciplinaryFile = asyncHandler(async (req, res) => {
  const { status, action } = req.body;
  const file = await DisciplinaryFile.findById(req.params.id);
  if (!file) {
    return res.status(404).json({ success: false, message: "Disciplinary file not found." });
  }

  if (status) file.status = status;
  if (action !== undefined) file.action = action;
  await file.save();

  res.status(200).json({ success: true, message: "Disciplinary file updated.", data: file });
});
