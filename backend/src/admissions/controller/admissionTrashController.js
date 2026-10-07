import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Admission from "../model/Admission.js";
import DeletedStudentRecord from "../model/DeletedStudentRecord.js";
import CompletedAdmissionRecord from "../model/CompletedAdmissionRecord.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import FamilyInfo from "../../student/models/FamilyInfo.js";
import EducationHistory from "../../student/models/EducationHistory.js";
import StudentDocuments from "../../student/models/StudentDocuments.js";
import Enrollment from "../../student/models/Enrollment.js";
import StudentAuth from "../../student/models/StudentAuth.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";
import Term from "../../catalog/model/Term.js";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";
import { isAdmissionComplete } from "../../accountant/services/student.service.js";
import { ScholarshipService } from "../../accountant/services/scholarship.service.js";

// How long a deleted record — soft-trashed or permanently deleted — stays
// visible to the admin. A trashed record auto-purges (hard delete) once
// this elapses without being restored; a permanently-deleted record's log
// entry is never actually removed (see DeletedStudentRecord's own comment)
// but simply stops being returned by getTrashList once its window passes.
const RETENTION_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

// Populated so every snapshot (trash + complete) carries real
// program/department/semester/session names, not bare ObjectIds — needed
// for the Completed Admissions dashboard widget to show "full details"
// without a second round-trip.
const findStudentProfileForAdmission = (admissionId) =>
  StudentProfile.findOne({ createdFromApplicationId: admissionId })
    .populate("departmentId", "name")
    .populate("programId", "name level")
    .populate("semesterId", "number")
    .populate("termId", "name")
    .lean();

// Same fallback-id strategy used in challanController.getLatestChallan —
// admission-fee challans may be keyed to the raw user id (pre-promotion) or
// to the promoted StudentProfile's _id.
const findRelatedChallans = async (admission, studentProfile) => {
  const possibleIds = [admission.userId?.toString()].filter(Boolean);
  if (studentProfile) possibleIds.push(studentProfile._id.toString());
  if (possibleIds.length === 0) return [];
  return StudentChallan.find({ studentId: { $in: possibleIds } }).lean();
};

const buildSnapshot = async (admission, studentProfile, challans) => {
  let personalInfo = null;
  let familyInfo = null;
  let educationHistory = [];
  let studentDocuments = null;
  let enrollment = null;
  let studentAuth = null;

  if (studentProfile) {
    [personalInfo, familyInfo, educationHistory, studentDocuments, enrollment, studentAuth] =
      await Promise.all([
        PersonalInfo.findOne({ studentId: studentProfile._id }).lean(),
        FamilyInfo.findOne({ studentId: studentProfile._id }).lean(),
        EducationHistory.find({ studentId: studentProfile._id }).lean(),
        StudentDocuments.findOne({ studentId: studentProfile._id }).lean(),
        Enrollment.findOne({ studentId: studentProfile._id }).lean(),
        StudentAuth.findOne({ studentProfileId: studentProfile._id })
          .select("-password")
          .lean(),
      ]);
  }

  return {
    admission,
    studentProfile: studentProfile || null,
    personalInfo,
    familyInfo,
    educationHistory,
    studentDocuments,
    enrollment,
    studentAuth,
    challans,
    snapshotTakenAt: new Date(),
  };
};

export const trashAdmissionRecord = asyncHandler(async (req, res) => {
  const { admissionId } = req.params;
  const { remark, scope: requestedScope } = req.body;

  if (!mongoose.isValidObjectId(admissionId)) {
    return res.status(400).json({ success: false, message: "Invalid admission ID." });
  }
  if (!remark || !remark.trim()) {
    return res.status(400).json({ success: false, message: "A remark is required to delete this record." });
  }

  const admission = await Admission.findById(admissionId).lean();
  if (!admission) {
    return res.status(404).json({ success: false, message: "Admission not found." });
  }
  if (admission.isTrashed) {
    return res.status(400).json({ success: false, message: "This record is already in the trash." });
  }

  const studentProfile = await findStudentProfileForAdmission(admissionId);

  // Scope decides whether the StudentProfile (and its challans) get
  // trashed alongside the Admission, or only the Admission application
  // itself is removed. "both" is only ever valid before real money has
  // changed hands — once a challan has been paid or is overdue, deleting
  // the student profile through this screen is blocked server-side
  // regardless of what the client requests, so this can't be bypassed by
  // calling the API directly.
  let scope = requestedScope === "admission_only" ? "admission_only" : "both";
  if (studentProfile) {
    const statusMap = await StudentChallanService.getChallanStatusForStudents([
      studentProfile._id.toString(),
    ]);
    const challanStatus = statusMap.get(studentProfile._id.toString())?.challanStatus || "not_generated";
    if (scope === "both" && (challanStatus === "paid" || challanStatus === "overdue")) {
      return res.status(400).json({
        success: false,
        message: "This student has a paid or overdue fee challan — only the Admission application record can be deleted, not the student profile.",
      });
    }
  } else {
    scope = "admission_only"; // Nothing to delete but the application anyway.
  }

  const challans = await findRelatedChallans(admission, studentProfile);
  const snapshot = await buildSnapshot(admission, studentProfile, challans);

  const session = await mongoose.startSession();
  try {
    let deletedRecord;
    await session.withTransaction(async () => {
      const now = new Date();

      await Admission.updateOne(
        { _id: admissionId },
        {
          $set: {
            isTrashed: true,
            trashedAt: now,
            trashedBy: req.user._id,
            trashRemark: remark.trim(),
          },
        },
        { session },
      );

      if (studentProfile && scope === "both") {
        await StudentProfile.updateOne(
          { _id: studentProfile._id },
          { $set: { isTrashed: true, trashedAt: now, trashedBy: req.user._id } },
          { session },
        );

        if (challans.length > 0) {
          await StudentChallan.updateMany(
            { _id: { $in: challans.map((c) => c._id) } },
            {
              $set: {
                isDeleted: true,
                deletedAt: now,
                deletedBy: req.user._id,
                deletionReason: `Trashed alongside admission record: ${remark.trim()}`,
              },
            },
            { session },
          );
        }
      }

      const created = await DeletedStudentRecord.create(
        [
          {
            admissionId,
            // Only linked here if the student profile was actually part of
            // this trash operation — an admission_only delete leaves the
            // student profile live, so restoring THIS record should only
            // ever restore the Admission, never touch the (never-trashed)
            // student.
            studentProfileId: scope === "both" ? studentProfile?._id || null : null,
            snapshot,
            status: "trashed",
            trashedBy: req.user._id,
            trashedAt: now,
            trashRemark: remark.trim(),
          },
        ],
        { session },
      );
      deletedRecord = created[0];
    });

    res.status(200).json({
      success: true,
      message:
        scope === "both"
          ? "Student record deleted and the full record has been downloaded."
          : "Admission application deleted. The student profile was left untouched.",
      data: { snapshot, trashId: deletedRecord._id },
    });
  } finally {
    await session.endSession();
  }
});

export const getTrashList = asyncHandler(async (req, res) => {
  const status = req.query.status === "permanently_deleted" ? "permanently_deleted" : "trashed";
  const now = Date.now();

  let records;
  if (status === "trashed") {
    records = await DeletedStudentRecord.find({ status: "trashed" })
      .sort({ trashedAt: -1 })
      .lean();
  } else {
    // Only the last RETENTION_DAYS worth — the log document itself is
    // never deleted, this just stops surfacing it in the admin view once
    // its visibility window has passed.
    records = await DeletedStudentRecord.find({
      status: "permanently_deleted",
      permanentlyDeletedAt: { $gte: new Date(now - RETENTION_DAYS * DAY_MS) },
    })
      .sort({ permanentlyDeletedAt: -1 })
      .lean();
  }

  const anchorField = status === "trashed" ? "trashedAt" : "permanentlyDeletedAt";
  const data = records.map((r) => {
    const purgeAt = new Date(new Date(r[anchorField]).getTime() + RETENTION_DAYS * DAY_MS);
    const daysRemaining = Math.max(0, Math.ceil((purgeAt.getTime() - now) / DAY_MS));
    return { ...r, purgeAt, daysRemaining, retentionDays: RETENTION_DAYS };
  });

  res.status(200).json({ success: true, data });
});

export const restoreAdmissionRecord = asyncHandler(async (req, res) => {
  const record = await DeletedStudentRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Trash record not found." });
  }
  if (record.status !== "trashed") {
    return res.status(400).json({ success: false, message: "This record cannot be restored." });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const now = new Date();

      await Admission.updateOne(
        { _id: record.admissionId },
        { $set: { isTrashed: false, restoredAt: now, restoredBy: req.user._id } },
        { session },
      );

      if (record.studentProfileId) {
        await StudentProfile.updateOne(
          { _id: record.studentProfileId },
          { $set: { isTrashed: false } },
          { session },
        );
      }

      const challanIds = (record.snapshot?.challans || []).map((c) => c._id);
      if (challanIds.length > 0) {
        await StudentChallan.updateMany(
          { _id: { $in: challanIds } },
          { $set: { isDeleted: false, deletedAt: null, deletedBy: null, deletionReason: null } },
          { session },
        );
      }

      record.status = "restored";
      record.restoredBy = req.user._id;
      record.restoredAt = now;
      await record.save({ session });
    });

    res.status(200).json({ success: true, message: "Student record restored successfully." });
  } finally {
    await session.endSession();
  }
});

// Shared by the manual "Delete Permanently" action and the retention-based
// auto-purge cron (admissionTrashCron.js) — one place actually removes the
// underlying documents, so the two can never behave differently. Mirrors
// student/controller/studentTrashController.js's hardDeleteStudentAndRecord.
export const hardDeleteAdmissionAndRecord = async (record, { permanentlyDeletedBy = null, permanentDeleteRemark }) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const now = new Date();
      const studentProfileId = record.studentProfileId;

      await Admission.deleteOne({ _id: record.admissionId }, { session });

      if (studentProfileId) {
        await Promise.all([
          StudentProfile.deleteOne({ _id: studentProfileId }, { session }),
          PersonalInfo.deleteMany({ studentId: studentProfileId }, { session }),
          FamilyInfo.deleteMany({ studentId: studentProfileId }, { session }),
          EducationHistory.deleteMany({ studentId: studentProfileId }, { session }),
          StudentDocuments.deleteMany({ studentId: studentProfileId }, { session }),
          Enrollment.deleteMany({ studentId: studentProfileId }, { session }),
          StudentAuth.deleteMany({ studentProfileId }, { session }),
        ]);
      }

      const challanIds = (record.snapshot?.challans || []).map((c) => c._id);
      if (challanIds.length > 0) {
        await StudentChallan.deleteMany({ _id: { $in: challanIds } }, { session });
      }

      record.status = "permanently_deleted";
      record.permanentlyDeletedBy = permanentlyDeletedBy;
      record.permanentlyDeletedAt = now;
      record.permanentDeleteRemark = permanentDeleteRemark;
      await record.save({ session });
    });
  } finally {
    await session.endSession();
  }
};

export const permanentlyDeleteAdmissionRecord = asyncHandler(async (req, res) => {
  const { remark } = req.body;
  if (!remark || !remark.trim()) {
    return res.status(400).json({ success: false, message: "A remark is required to permanently delete this record." });
  }

  const record = await DeletedStudentRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Trash record not found." });
  }
  if (record.status !== "trashed") {
    return res.status(400).json({ success: false, message: "Only a currently-trashed record can be permanently deleted." });
  }

  await hardDeleteAdmissionAndRecord(record, {
    permanentlyDeletedBy: req.user._id,
    permanentDeleteRemark: remark.trim(),
  });

  res.status(200).json({
    success: true,
    message: "Student record permanently deleted. The applicant may now register again.",
  });
});

// Called by the daily cron (admissionTrashCron.js) — hard-deletes every
// trashed record whose retention window has elapsed.
export const purgeExpiredAdmissionTrash = async () => {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS);
  const expired = await DeletedStudentRecord.find({ status: "trashed", trashedAt: { $lte: cutoff } });

  let purgedCount = 0;
  for (const record of expired) {
    // eslint-disable-next-line no-await-in-loop
    await hardDeleteAdmissionAndRecord(record, {
      permanentlyDeletedBy: null,
      permanentDeleteRemark: `Auto-purged after the ${RETENTION_DAYS}-day retention period.`,
    });
    purgedCount += 1;
  }
  return purgedCount;
};

// --- MARK COMPLETE --- only reachable from the Fee Paid bucket. Confirms
// the admission is fully done: archives everything into
// CompletedAdmissionRecord (this is what the dashboard widget reads),
// then permanently removes the now-redundant Admission application
// document. The StudentProfile/StudentAuth/PersonalInfo/etc — the actual
// student record — and the applicant's own login (User) are never
// touched, so they keep full access; only the completed application
// itself is cleared.
export const completeAdmission = asyncHandler(async (req, res) => {
  const { admissionId } = req.params;
  const { remark, confirmed } = req.body;

  if (!mongoose.isValidObjectId(admissionId)) {
    return res.status(400).json({ success: false, message: "Invalid admission ID." });
  }
  if (confirmed !== true) {
    return res.status(400).json({
      success: false,
      message: "Please confirm the student has completed admission before continuing.",
    });
  }
  if (!remark || !remark.trim()) {
    return res.status(400).json({ success: false, message: "A remark is required." });
  }

  const admission = await Admission.findById(admissionId).lean();
  if (!admission) {
    return res.status(404).json({ success: false, message: "Admission not found." });
  }

  const studentProfile = await findStudentProfileForAdmission(admissionId);
  if (!studentProfile) {
    return res.status(400).json({
      success: false,
      message: "This application has no promoted student yet — nothing to mark complete.",
    });
  }

  const sid = studentProfile._id.toString();
  const [statusMap, scholarshipMap] = await Promise.all([
    StudentChallanService.getAdmissionChallanStatusForStudents([sid]),
    ScholarshipService.getBulkActiveScholarships([sid]),
  ]);
  const challanStatus = statusMap.get(sid)?.challanStatus || "not_generated";
  const hasScholarship = !!scholarshipMap.get(sid)?.hasScholarship;

  // Re-checked here independently of whatever the client showed — never
  // trust "confirmed: true" alone for the actual eligibility decision. See
  // isAdmissionComplete's own comment for what "complete" means and why.
  if (!isAdmissionComplete({ challanStatus, hasScholarship })) {
    return res.status(400).json({
      success: false,
      message:
        "Admission can only be marked complete once the fee challan is fully paid, or the student has an approved scholarship and no admission fee was ever billed.",
    });
  }

  const challans = await findRelatedChallans(admission, studentProfile);
  const snapshot = await buildSnapshot(admission, studentProfile, challans);

  const session = await mongoose.startSession();
  try {
    let completedRecord;
    await session.withTransaction(async () => {
      const created = await CompletedAdmissionRecord.create(
        [
          {
            studentProfileId: studentProfile._id,
            termId: studentProfile.termId || null,
            snapshot,
            completedBy: req.user._id,
            completedAt: new Date(),
            remark: remark.trim(),
          },
        ],
        { session },
      );
      completedRecord = created[0];

      await Admission.deleteOne({ _id: admissionId }, { session });
    });

    res.status(200).json({
      success: true,
      message: "Admission marked complete. The application record has been cleared.",
      data: { completedId: completedRecord._id },
    });
  } finally {
    await session.endSession();
  }
});

export const getCompletedAdmissions = asyncHandler(async (req, res) => {
  const { currentSession } = req.query;
  const filter = {};

  if (currentSession === "true" || currentSession === true) {
    const activeTerm = await Term.findOne({ isActive: true }).select("_id").lean();
    filter.termId = activeTerm?._id || null;
  }

  const records = await CompletedAdmissionRecord.find(filter)
    .sort({ completedAt: -1 })
    .populate("completedBy", "email")
    .populate("termId", "name")
    .lean();

  res.status(200).json({ success: true, data: records });
});

export const getAdmissionProcessStats = asyncHandler(async (req, res) => {
  const baseFilter = { isTrashed: { $ne: true } };

  const [draft, submitted, newAdmissionStudents, trashCount] = await Promise.all([
    Admission.countDocuments({ ...baseFilter, status: "draft" }),
    Admission.countDocuments({ ...baseFilter, status: "submitted" }),
    // "New admission" = first-semester students promoted from an accepted
    // application — the same convention useNewAdmissions.js uses, so these
    // counts line up with what the pipeline tabs actually show.
    StudentProfile.find({
      isTrashed: { $ne: true },
      createdFromApplicationId: { $ne: null },
    })
      .select("_id semesterId")
      .populate("semesterId", "number")
      .lean(),
    DeletedStudentRecord.countDocuments({ status: "trashed" }),
  ]);

  const studentIds = newAdmissionStudents
    .filter((s) => (s.semesterId?.number || 1) === 1)
    .map((s) => s._id.toString());

  // Reuses the exact same admission-fee-only rollup the pipeline tabs use,
  // so these counts never disagree with what's shown per-student.
  const statusMap = await StudentChallanService.getAdmissionChallanStatusForStudents(studentIds);

  let accepted = 0;
  let challanGenerated = 0;
  let feePaid = 0;
  let feeOverdue = 0;
  studentIds.forEach((id) => {
    const status = statusMap.get(id)?.challanStatus || "not_generated";
    if (status === "not_generated") accepted += 1;
    else if (status === "overdue") feeOverdue += 1;
    else if (status === "paid") feePaid += 1;
    else challanGenerated += 1;
  });

  res.status(200).json({
    success: true,
    data: {
      draft,
      submitted,
      accepted,
      challanGenerated,
      feePaid,
      feeOverdue,
      trashCount,
    },
  });
});
