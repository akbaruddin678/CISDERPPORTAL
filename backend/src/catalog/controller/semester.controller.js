import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Semester from "../model/Semester.js";
import Program from "../model/Program.js";
import Department from "../model/Department.js";
import { describeSemesterUsage } from "../utils/semesterUsage.js";

const DEFAULT_PROGRAM_PREFIX = "CLS-";

// Schools/colleges have Class -> Section only. Sections still hang off a
// Program in the data model, so each class gets one hidden default program.
const ensureDefaultProgram = async (department) => {
  const existing = await Program.findOne({ departmentId: department._id }).sort({ createdAt: 1 });
  if (existing) return existing;
  return Program.create({
    code: `${DEFAULT_PROGRAM_PREFIX}${department.code}`.toUpperCase(),
    name: department.name,
    level: "UG",
    durationStages: 1,
    departmentId: department._id,
  });
};

export const createSectionForClass = asyncHandler(async (req, res) => {
  const { departmentId, name, programId } = req.body;
  if (!departmentId || !name?.trim()) {
    return res.status(400).json({ success: false, error: "Class and section name are required." });
  }
  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(404).json({ success: false, error: "Class not found" });
  }
  // A section goes into a chosen program of the class; with no program given
  // (older callers) it falls back to the class's first program.
  let program;
  if (programId) {
    program = await Program.findById(programId);
    if (!program || String(program.departmentId) !== String(department._id)) {
      return res.status(400).json({ success: false, error: "That program does not belong to this class." });
    }
  } else {
    program = await ensureDefaultProgram(department);
  }
  const wanted = name.trim().toLowerCase();
  const siblings = await Semester.find({ programId: program._id }).select("name").lean();
  const dup = siblings.some((x) => String(x.name).trim().toLowerCase() === wanted);
  if (dup) {
    return res.status(409).json({ success: false, error: `Section "${name.trim()}" already exists in this class.` });
  }
  const last = await Semester.findOne({ programId: program._id }).sort({ number: -1 }).select("number").lean();
  const section = await Semester.create({
    programId: program._id,
    name: name.trim(),
    number: (last?.number || 0) + 1,
  });
  await Program.updateOne({ _id: program._id }, { $set: { durationStages: section.number } });
  res.status(201).json({ success: true, message: "Section created", data: section });
});

export const getAllSemesters = asyncHandler(async (req, res) => {
  const items = await Semester.find().populate("programId", "name code departmentId").lean();
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
  // Only auto-numbered stages ("Semester 3", "Part 2") form a sequence.
  // Named sections (A, B, Blue...) are independent, so any of them can go.
  const isSequenceStage = /^(semester|part)\s*\d+$/i.test(String(semester.name || "").trim());
  if (isSequenceStage && !isDuplicate && hasLater) {
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
