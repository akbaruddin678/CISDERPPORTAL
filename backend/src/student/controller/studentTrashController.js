import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { comparePassword } from "../../core/utils/password.js";
import User from "../../user/model/User.js";
import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import EducationHistory from "../models/EducationHistory.js";
import StudentDocuments from "../models/StudentDocuments.js";
import Enrollment from "../models/Enrollment.js";
import StudentAuth from "../models/StudentAuth.js";
import StudentTrashRecord from "../models/StudentTrashRecord.js";

// A trashed student is auto-purged (permanently deleted) after this many
// days if nobody restores or manually purges them first — the "1-2 month"
// retention window the user asked for.
const RETENTION_DAYS = 60;

const verifyPassword = async (req, password) => {
  if (!password) {
    return { ok: false, message: "Password is required to confirm this action." };
  }
  const user = await User.findById(req.user._id).select("passwordHash").lean();
  if (!user) return { ok: false, message: "Unable to verify your account." };
  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) return { ok: false, message: "Incorrect password." };
  return { ok: true };
};

const buildStudentSnapshot = async (studentProfile) => {
  const [personalInfo, familyInfo, educationHistory, studentDocuments, enrollment, studentAuth] =
    await Promise.all([
      PersonalInfo.findOne({ studentId: studentProfile._id }).lean(),
      FamilyInfo.findOne({ studentId: studentProfile._id }).lean(),
      EducationHistory.find({ studentId: studentProfile._id }).lean(),
      StudentDocuments.findOne({ studentId: studentProfile._id }).lean(),
      Enrollment.findOne({ studentId: studentProfile._id }).lean(),
      StudentAuth.findOne({ studentProfileId: studentProfile._id }).select("-password").lean(),
    ]);

  return {
    studentProfile,
    personalInfo,
    familyInfo,
    educationHistory,
    studentDocuments,
    enrollment,
    studentAuth,
    snapshotTakenAt: new Date(),
  };
};

// Moves ONE student to trash inside an already-open transaction — shared
// by both the single and bulk endpoints so they can never drift apart.
const trashOneStudent = async ({ studentId, remark, userId, session }) => {
  const studentProfile = await StudentProfile.findById(studentId).session(session).lean();
  if (!studentProfile) {
    return { studentId, ok: false, message: "Student not found." };
  }
  if (studentProfile.isTrashed) {
    return { studentId, ok: false, message: "Student is already in the trash." };
  }

  const snapshot = await buildStudentSnapshot(studentProfile);
  const now = new Date();

  await StudentProfile.updateOne(
    { _id: studentId },
    { $set: { isTrashed: true, trashedAt: now, trashedBy: userId } },
    { session },
  );

  const [record] = await StudentTrashRecord.create(
    [
      {
        studentProfileId: studentId,
        snapshot,
        status: "trashed",
        trashedBy: userId,
        trashedAt: now,
        trashRemark: remark,
      },
    ],
    { session },
  );

  return { studentId, ok: true, trashId: record._id, snapshot };
};

// --- SINGLE DELETE (move to trash) --- requires both a remark and the
// acting staff member's own account password.
export const trashStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { remark, password } = req.body;

  if (!mongoose.isValidObjectId(studentId)) {
    return res.status(400).json({ success: false, message: "Invalid student ID." });
  }
  if (!remark || !remark.trim()) {
    return res.status(400).json({ success: false, message: "A remark is required to delete this record." });
  }

  const passwordCheck = await verifyPassword(req, password);
  if (!passwordCheck.ok) {
    return res.status(401).json({ success: false, message: passwordCheck.message });
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await trashOneStudent({
        studentId,
        remark: remark.trim(),
        userId: req.user._id,
        session,
      });
    });

    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({
      success: true,
      message: "Student moved to trash. The full record has been saved.",
      data: { snapshot: result.snapshot, trashId: result.trashId },
    });
  } finally {
    await session.endSession();
  }
});

// --- BULK DELETE (move many to trash) --- same password + remark gate,
// applied once for the whole selection.
export const bulkTrashStudents = asyncHandler(async (req, res) => {
  const { studentIds, remark, password } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ success: false, message: "Select at least one student." });
  }
  if (studentIds.some((id) => !mongoose.isValidObjectId(id))) {
    return res.status(400).json({ success: false, message: "Invalid student ID in selection." });
  }
  if (!remark || !remark.trim()) {
    return res.status(400).json({ success: false, message: "A remark is required to delete these records." });
  }

  const passwordCheck = await verifyPassword(req, password);
  if (!passwordCheck.ok) {
    return res.status(401).json({ success: false, message: passwordCheck.message });
  }

  const session = await mongoose.startSession();
  try {
    const results = [];
    await session.withTransaction(async () => {
      for (const studentId of studentIds) {
        // Sequential on purpose — each iteration reads-then-writes the
        // same StudentProfile it's about to trash, inside one shared
        // transaction, so this can't safely run in parallel.
        // eslint-disable-next-line no-await-in-loop
        const result = await trashOneStudent({
          studentId,
          remark: remark.trim(),
          userId: req.user._id,
          session,
        });
        results.push(result);
      }
    });

    const succeeded = results.filter((r) => r.ok).length;
    res.status(200).json({
      success: true,
      message: `${succeeded} of ${studentIds.length} student(s) moved to trash.`,
      data: { results },
    });
  } finally {
    await session.endSession();
  }
});

export const getStudentTrashList = asyncHandler(async (req, res) => {
  const records = await StudentTrashRecord.find({ status: "trashed" })
    .sort({ trashedAt: -1 })
    .populate("trashedBy", "email")
    .lean();

  const now = Date.now();
  const data = records.map((r) => {
    const purgeAt = new Date(new Date(r.trashedAt).getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(0, Math.ceil((purgeAt.getTime() - now) / (24 * 60 * 60 * 1000)));
    return { ...r, purgeAt, daysRemaining, retentionDays: RETENTION_DAYS };
  });

  res.status(200).json({ success: true, data });
});

export const restoreStudent = asyncHandler(async (req, res) => {
  const record = await StudentTrashRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Trash record not found." });
  }
  if (record.status !== "trashed") {
    return res.status(400).json({ success: false, message: "This record cannot be restored." });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await StudentProfile.updateOne(
        { _id: record.studentProfileId },
        { $set: { isTrashed: false }, $unset: { trashedAt: "", trashedBy: "" } },
        { session },
      );
      record.status = "restored";
      record.restoredBy = req.user._id;
      record.restoredAt = new Date();
      await record.save({ session });
    });

    res.status(200).json({ success: true, message: "Student restored successfully." });
  } finally {
    await session.endSession();
  }
});

// Shared by the manual "Delete Permanently" action and the retention-based
// auto-purge cron (studentTrashCron.js) — one place actually removes the
// underlying documents, so the two can never behave differently.
export const hardDeleteStudentAndRecord = async (record, { permanentlyDeletedBy = null, permanentDeleteRemark }) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const studentProfileId = record.studentProfileId;
      await Promise.all([
        StudentProfile.deleteOne({ _id: studentProfileId }, { session }),
        PersonalInfo.deleteMany({ studentId: studentProfileId }, { session }),
        FamilyInfo.deleteMany({ studentId: studentProfileId }, { session }),
        EducationHistory.deleteMany({ studentId: studentProfileId }, { session }),
        StudentDocuments.deleteMany({ studentId: studentProfileId }, { session }),
        Enrollment.deleteMany({ studentId: studentProfileId }, { session }),
        StudentAuth.deleteMany({ studentProfileId }, { session }),
      ]);

      record.status = "permanently_deleted";
      record.permanentlyDeletedBy = permanentlyDeletedBy;
      record.permanentlyDeletedAt = new Date();
      record.permanentDeleteRemark = permanentDeleteRemark;
      await record.save({ session });
    });
  } finally {
    await session.endSession();
  }
};

export const permanentlyDeleteStudent = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  if (!remark || !remark.trim()) {
    return res.status(400).json({ success: false, message: "A remark is required to permanently delete this record." });
  }

  const record = await StudentTrashRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Trash record not found." });
  }
  if (record.status !== "trashed") {
    return res.status(400).json({ success: false, message: "Only a currently-trashed record can be permanently deleted." });
  }

  await hardDeleteStudentAndRecord(record, {
    permanentlyDeletedBy: req.user._id,
    permanentDeleteRemark: remark.trim(),
  });

  res.status(200).json({
    success: true,
    message: "Student permanently deleted.",
  });
});

// Called by the daily cron (studentTrashCron.js) — hard-deletes every
// trashed record whose retention window has elapsed.
export const purgeExpiredStudentTrash = async () => {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await StudentTrashRecord.find({ status: "trashed", trashedAt: { $lte: cutoff } });

  let purgedCount = 0;
  for (const record of expired) {
    // eslint-disable-next-line no-await-in-loop
    await hardDeleteStudentAndRecord(record, {
      permanentlyDeletedBy: null,
      permanentDeleteRemark: `Auto-purged after the ${RETENTION_DAYS}-day retention period.`,
    });
    purgedCount += 1;
  }
  return purgedCount;
};
