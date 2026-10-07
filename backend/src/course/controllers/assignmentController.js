import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";
import Assignment from "../models/Assignment.js";
import CourseAssignment from "../models/CourseAssignment.js";
import StaffProfile from "../../staff/models/StaffProfile.js";

const resolveTeacherId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();
  return staffProfile?._id || null;
};

const isAdmin = (req) => req.user?.roles?.includes("admin");

const assertOwnsAssignment = async (req, courseAssignmentId, teacherId) => {
  const assignment = await CourseAssignment.findById(courseAssignmentId)
    .select("instructorId")
    .lean();
  if (!assignment) return false;
  if (isAdmin(req)) return true;
  return String(assignment.instructorId) === String(teacherId);
};

const classifyFileType = (mimetype = "", filename = "") => {
  const ext = (filename.split(".").pop() || "").toLowerCase();

  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype === "application/pdf" || ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["ppt", "pptx"].includes(ext)) return "powerpoint";
  return "other";
};

const uploadAttachments = async (files, courseAssignmentId) => {
  if (!files?.length) return [];
  const uploaded = await Promise.all(
    files.map(async (file) => {
      const url = await uploadToR2(file, `assignments/${courseAssignmentId}`);
      return {
        name: file.originalname,
        url,
        fileType: classifyFileType(file.mimetype, file.originalname),
        mimeType: file.mimetype,
        size: file.size,
      };
    }),
  );
  return uploaded;
};

// ============================================================================
// GET ASSIGNMENTS FOR A COURSE OFFERING
// ============================================================================
export const getAssignments = asyncHandler(async (req, res) => {
  const { courseAssignmentId } = req.query;
  if (!courseAssignmentId) {
    return res
      .status(400)
      .json({ success: false, message: "courseAssignmentId is required." });
  }

  const query = { courseAssignmentId };

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a staff profile.",
      });
    }
    if (!(await assertOwnsAssignment(req, courseAssignmentId, teacherId))) {
      return res
        .status(403)
        .json({ success: false, message: "You are not assigned to this course." });
    }
    query.teacherId = teacherId;
  }

  const assignments = await Assignment.find(query).sort({ dueDate: 1, createdAt: -1 });
  res.status(200).json({ success: true, data: assignments });
});

// ============================================================================
// GET A SINGLE ASSIGNMENT
// ============================================================================
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate({
    path: "courseAssignmentId",
    select: "courseId section",
    populate: { path: "courseId", select: "title code" },
  });
  if (!assignment) {
    return res.status(404).json({ success: false, message: "Assignment not found." });
  }

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId || String(assignment.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to view this assignment." });
    }
  }

  res.status(200).json({ success: true, data: assignment });
});

// ============================================================================
// CREATE ASSIGNMENT (multipart/form-data: fields + files[])
// ============================================================================
export const createAssignment = asyncHandler(async (req, res) => {
  const {
    courseAssignmentId,
    title,
    instructions,
    totalMarks,
    dueDate,
    allowLateSubmission,
    status,
  } = req.body;

  if (!courseAssignmentId || !title || !dueDate) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId, title, and dueDate are required.",
    });
  }

  const teacherId = await resolveTeacherId(req);
  if (!teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }
  if (!(await assertOwnsAssignment(req, courseAssignmentId, teacherId))) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const attachments = await uploadAttachments(req.files, courseAssignmentId);

  const assignment = await Assignment.create({
    courseAssignmentId,
    teacherId,
    title,
    instructions: instructions || "",
    totalMarks: totalMarks !== undefined && totalMarks !== "" ? Number(totalMarks) : null,
    dueDate,
    originalDueDate: dueDate,
    allowLateSubmission: allowLateSubmission === "true" || allowLateSubmission === true,
    status: status === "Draft" ? "Draft" : "Published",
    attachments,
  });

  res.status(201).json({ success: true, message: "Assignment created.", data: assignment });
});

// ============================================================================
// UPDATE ASSIGNMENT (multipart/form-data: fields + optional new files[] +
// removeAttachmentIds — a JSON-stringified array of attachment ids to drop)
// ============================================================================
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: "Assignment not found." });
  }

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId || String(assignment.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to update this assignment." });
    }
  }

  const {
    title,
    instructions,
    totalMarks,
    dueDate,
    allowLateSubmission,
    status,
    removeAttachmentIds,
  } = req.body;

  if (title !== undefined) assignment.title = title;
  if (instructions !== undefined) assignment.instructions = instructions;
  if (totalMarks !== undefined) {
    assignment.totalMarks = totalMarks !== "" ? Number(totalMarks) : null;
  }
  if (dueDate !== undefined) assignment.dueDate = dueDate;
  if (allowLateSubmission !== undefined) {
    assignment.allowLateSubmission = allowLateSubmission === "true" || allowLateSubmission === true;
  }
  if (status !== undefined && ["Draft", "Published"].includes(status)) {
    assignment.status = status;
  }

  if (removeAttachmentIds) {
    let idsToRemove = [];
    try {
      idsToRemove = JSON.parse(removeAttachmentIds);
    } catch {
      idsToRemove = [];
    }
    if (Array.isArray(idsToRemove) && idsToRemove.length > 0) {
      assignment.attachments = assignment.attachments.filter(
        (a) => !idsToRemove.includes(String(a._id)),
      );
    }
  }

  const newAttachments = await uploadAttachments(req.files, assignment.courseAssignmentId);
  if (newAttachments.length > 0) {
    assignment.attachments.push(...newAttachments);
  }

  await assignment.save();
  res.status(200).json({ success: true, message: "Assignment updated.", data: assignment });
});

// ============================================================================
// EXTEND DUE DATE — dedicated endpoint so every extension is logged with a
// reason and the original due date is always preserved for reference.
// ============================================================================
export const extendDueDate = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: "Assignment not found." });
  }

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId || String(assignment.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to extend this assignment." });
    }
  }

  const { newDueDate, reason } = req.body;
  if (!newDueDate) {
    return res.status(400).json({ success: false, message: "newDueDate is required." });
  }
  if (new Date(newDueDate) <= assignment.dueDate) {
    return res.status(400).json({
      success: false,
      message: "The new due date must be later than the current due date.",
    });
  }

  assignment.dueDateExtensions.push({
    previousDueDate: assignment.dueDate,
    newDueDate,
    reason: reason || "",
  });
  assignment.dueDate = newDueDate;

  await assignment.save();
  res.status(200).json({ success: true, message: "Due date extended.", data: assignment });
});

// ============================================================================
// DELETE ASSIGNMENT
// ============================================================================
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ success: false, message: "Assignment not found." });
  }

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId || String(assignment.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to delete this assignment." });
    }
  }

  await Assignment.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Assignment deleted." });
});
