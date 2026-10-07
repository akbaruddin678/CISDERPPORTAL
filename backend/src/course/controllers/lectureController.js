import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";
import Lecture from "../models/Lecture.js";
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

// Buckets an uploaded file into the broad category the UI displays an icon
// for — based on MIME type first, falling back to file extension.
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
      const url = await uploadToR2(
        file,
        `lectures/${courseAssignmentId}`,
      );
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
// GET LECTURES FOR A COURSE OFFERING
// ============================================================================
export const getLectures = asyncHandler(async (req, res) => {
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

  const lectures = await Lecture.find(query).sort({ date: -1, createdAt: -1 });
  res.status(200).json({ success: true, data: lectures });
});

// ============================================================================
// GET A SINGLE LECTURE
// ============================================================================
export const getLectureById = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id).populate({
    path: "courseAssignmentId",
    select: "courseId section",
    populate: { path: "courseId", select: "title code" },
  });
  if (!lecture) {
    return res.status(404).json({ success: false, message: "Lecture not found." });
  }

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId || String(lecture.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to view this lecture." });
    }
  }

  res.status(200).json({ success: true, data: lecture });
});

// ============================================================================
// CREATE LECTURE (multipart/form-data: fields + files[])
// ============================================================================
export const createLecture = asyncHandler(async (req, res) => {
  const { courseAssignmentId, week, topic, description, notes, date } = req.body;

  if (!courseAssignmentId || !week || !topic) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId, week, and topic are required.",
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

  const lecture = await Lecture.create({
    courseAssignmentId,
    teacherId,
    week,
    topic,
    description: description || "",
    notes: notes || "",
    date: date || new Date(),
    attachments,
  });

  res.status(201).json({ success: true, message: "Lecture created.", data: lecture });
});

// ============================================================================
// UPDATE LECTURE (multipart/form-data: fields + optional new files[] +
// removeAttachmentIds — a JSON-stringified array of attachment ids to drop)
// ============================================================================
export const updateLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) {
    return res.status(404).json({ success: false, message: "Lecture not found." });
  }

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId || String(lecture.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to update this lecture." });
    }
  }

  const { week, topic, description, notes, date, removeAttachmentIds } = req.body;

  if (week !== undefined) lecture.week = week;
  if (topic !== undefined) lecture.topic = topic;
  if (description !== undefined) lecture.description = description;
  if (notes !== undefined) lecture.notes = notes;
  if (date !== undefined) lecture.date = date;

  if (removeAttachmentIds) {
    let idsToRemove = [];
    try {
      idsToRemove = JSON.parse(removeAttachmentIds);
    } catch {
      idsToRemove = [];
    }
    if (Array.isArray(idsToRemove) && idsToRemove.length > 0) {
      lecture.attachments = lecture.attachments.filter(
        (a) => !idsToRemove.includes(String(a._id)),
      );
    }
  }

  const newAttachments = await uploadAttachments(
    req.files,
    lecture.courseAssignmentId,
  );
  if (newAttachments.length > 0) {
    lecture.attachments.push(...newAttachments);
  }

  await lecture.save();
  res.status(200).json({ success: true, message: "Lecture updated.", data: lecture });
});

// ============================================================================
// DELETE LECTURE
// ============================================================================
export const deleteLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) {
    return res.status(404).json({ success: false, message: "Lecture not found." });
  }

  if (!isAdmin(req)) {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId || String(lecture.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized to delete this lecture." });
    }
  }

  await Lecture.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Lecture deleted." });
});
