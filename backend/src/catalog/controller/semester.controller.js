import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Semester from "../model/Semester.js";
import Program from "../model/Program.js";
import { describeSemesterUsage } from "../utils/semesterUsage.js";

export const getAllSemesters = asyncHandler(async (req, res) => {
  const items = await Semester.find().populate("programId", "name code").lean();
  res.status(200).json({ success: true, count: items.length, data: items });
});

export const getSemestersByProgram = asyncHandler(async (req, res) => {
  const items = await Semester.find({ programId: req.params.programId })
    .populate("courses", "code title")
    .sort({ number: 1 })
    .lean();
  res.status(200).json({ success: true, count: items.length, data: items });
});

export const getSemesterById = asyncHandler(async (req, res) => {
  const semester = await Semester.findById(req.params.id)
    .populate("programId", "name code")
    .populate("courses", "code title");
  if (!semester)
    return res
      .status(404)
      .json({ success: false, error: "Semester not found" });
  res.status(200).json({ success: true, data: semester });
});

export const createSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.create(req.body);
  await semester.populate("programId", "name code");
  res
    .status(201)
    .json({ success: true, message: "Semester created", data: semester });
});

export const updateSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  })
    .populate("programId", "name code")
    .populate("courses", "code title");
  if (!semester)
    return res
      .status(404)
      .json({ success: false, error: "Semester not found" });
  res
    .status(200)
    .json({ success: true, message: "Semester updated", data: semester });
});

export const toggleSemesterStatus = asyncHandler(async (req, res) => {
  const semester = await Semester.findById(req.params.id);
  if (!semester)
    return res
      .status(404)
      .json({ success: false, error: "Semester not found" });

  semester.isActive = !semester.isActive;
  await semester.save();
  res
    .status(200)
    .json({
      success: true,
      message: `Semester ${semester.isActive ? "activated" : "deactivated"}`,
      data: semester,
    });
});

// Single source of truth for "can this semester be deleted?" — used both by
// the read-only usage endpoint the modal calls up front and by the delete
// itself, so what the screen says and what the server enforces never differ.
// blockers = plain-English list of what still uses it (current AND former
// students, registrations, results, fees, exams ...).
const checkDeletable = async (semester) => {
  const blockers = await describeSemesterUsage(semester);
  if (blockers.length > 0) {
    return {
      canDelete: false,
      blockers,
      reason: `${semester.name} can't be deleted because it is still used by: ${blockers.join(", ")}.`,
    };
  }

  // Semesters form a numbered sequence (promotion goes N -> N+1), so a
  // middle one can't be removed without leaving a hole. Only the last
  // semester, or a duplicate copy of a number, can go.
  const [isDuplicate, hasLater] = await Promise.all([
    Semester.exists({
      programId: semester.programId,
      number: semester.number,
      _id: { $ne: semester._id },
    }),
    Semester.exists({
      programId: semester.programId,
      number: { $gt: semester.number },
    }),
  ]);
  if (!isDuplicate && hasLater) {
    return {
      canDelete: false,
      blockers: [],
      reason: `${semester.name} can't be deleted while later semesters exist. Delete from the last semester backwards, or reduce the program's number of semesters.`,
    };
  }
  return { canDelete: true, blockers: [], reason: "" };
};

export const getSemesterUsage = asyncHandler(async (req, res) => {
  const semester = await Semester.findById(req.params.id);
  if (!semester)
    return res
      .status(404)
      .json({ success: false, error: "Semester not found" });
  res.status(200).json({ success: true, data: await checkDeletable(semester) });
});

export const deleteSemester = asyncHandler(async (req, res) => {
  const semester = await Semester.findById(req.params.id);
  if (!semester)
    return res
      .status(404)
      .json({ success: false, error: "Semester not found" });

  const check = await checkDeletable(semester);
  if (!check.canDelete) {
    return res.status(409).json({
      success: false,
      error: check.reason,
      blockers: check.blockers,
    });
  }

  await Semester.deleteOne({ _id: semester._id });

  // Keep the program's stored duration in step with what really exists.
  const last = await Semester.findOne({ programId: semester.programId })
    .sort({ number: -1 })
    .select("number")
    .lean();
  await Program.updateOne(
    { _id: semester.programId },
    { $set: { durationStages: last?.number || 0 } },
  );

  res.status(200).json({ success: true, message: `${semester.name} deleted` });
});
