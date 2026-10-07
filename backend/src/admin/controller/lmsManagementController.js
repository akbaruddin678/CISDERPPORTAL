import crypto from "crypto";
import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentAuth from "../../student/models/StudentAuth.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";

// Same ceiling the export actions on this same screen already use for
// "fetch the whole tab in one shot" — reused here so a bulk generate/reset
// covering an entire (very large) tab can't accidentally become a
// runaway request.
const BULK_ID_LIMIT = 5000;

const LMS_EMAIL_DOMAIN = "cisd.edu.pk";

// Unambiguous charset (no 0/O/1/l/I) — these passwords are meant to be
// read off a screen/export and typed by a student, so visual confusion
// between characters is worth avoiding even at a small entropy cost.
const PASSWORD_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const generateReadablePassword = (length = 8) => {
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += PASSWORD_CHARSET[bytes[i] % PASSWORD_CHARSET.length];
  }
  return password;
};

// GET LMS ACCOUNTS — paginated + server-side filtered by College/University
// (via program level) and search, so the browser never has to load and
// render every student's account at once (that was freezing the page for
// large student counts). Fee-pending status is computed only for the page
// actually being returned, not the whole collection. Tab badge counts are
// a separate, cheap aggregate independent of the current page/search.
export const getLmsAccounts = asyncHandler(async (req, res) => {
  const {
    level = "college",
    search = "",
    page = 1,
    limit = 20,
    departmentId = "",
    programId = "",
    semesterId = "",
  } = req.query;

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  // Capped much higher than the normal page size so the "Export" actions
  // can request the full tab in one shot without the table itself ever
  // rendering more than a page's worth of rows at a time.
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 5000);
  const skip = (pageNumber - 1) * limitNumber;

  // "college" = Program.level "HSSC"; "university" = everything else
  // (including accounts with no linked program), matching the convention
  // used across Admission Process / COIS vs University elsewhere in the app.
  const levelMatch =
    level === "university"
      ? { "program.level": { $ne: "HSSC" } }
      : { "program.level": "HSSC" };

  // Optional Department/Program/Semester narrowing — same pattern as the
  // Student Management screen's cascading filters. Matched on the raw
  // StudentProfile fields (already present on the joined "profile"
  // sub-document from the $lookup stages below), not the joined
  // department/program/semester documents.
  if (departmentId && mongoose.isValidObjectId(departmentId)) {
    levelMatch["profile.departmentId"] = new mongoose.Types.ObjectId(departmentId);
  }
  if (programId && mongoose.isValidObjectId(programId)) {
    levelMatch["profile.programId"] = new mongoose.Types.ObjectId(programId);
  }
  if (semesterId && mongoose.isValidObjectId(semesterId)) {
    levelMatch["profile.semesterId"] = new mongoose.Types.ObjectId(semesterId);
  }

  const joinStages = [
    {
      $lookup: {
        from: "studentprofiles",
        localField: "studentProfileId",
        foreignField: "_id",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "programs",
        localField: "profile.programId",
        foreignField: "_id",
        as: "program",
      },
    },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "departments",
        localField: "profile.departmentId",
        foreignField: "_id",
        as: "department",
      },
    },
    { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "terms",
        localField: "profile.termId",
        foreignField: "_id",
        as: "term",
      },
    },
    { $unwind: { path: "$term", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "semesters",
        localField: "profile.semesterId",
        foreignField: "_id",
        as: "semester",
      },
    },
    { $unwind: { path: "$semester", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "personalinfos",
        localField: "profile._id",
        foreignField: "studentId",
        as: "personalInfo",
      },
    },
    { $unwind: { path: "$personalInfo", preserveNullAndEmptyArrays: true } },
  ];

  const searchTrim = search.trim();
  const searchStage = searchTrim
    ? [
        {
          $match: {
            $or: [
              { email: { $regex: searchTrim, $options: "i" } },
              { rollNumber: { $regex: searchTrim, $options: "i" } },
              { "personalInfo.fullName": { $regex: searchTrim, $options: "i" } },
            ],
          },
        },
      ]
    : [];

  const [pageResult] = await StudentAuth.aggregate([
    ...joinStages,
    { $match: levelMatch },
    ...searchStage,
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limitNumber },
          {
            $project: {
              _id: 1,
              rollNumber: 1,
              email: 1,
              status: 1,
              lastLogin: 1,
              studentProfileId: "$profile._id",
              semesterId: "$profile.semesterId",
              name: { $ifNull: ["$personalInfo.fullName", "Unknown"] },
              programName: "$program.name",
              programLevel: "$program.level",
              department: { $ifNull: ["$department.name", "N/A"] },
              session: { $ifNull: ["$term.name", "N/A"] },
              semester: "$semester.number",
              academicStatus: { $ifNull: ["$profile.status", "N/A"] },
              admissionLifecycleStatus: {
                $ifNull: ["$profile.admissionLifecycleStatus", "active"],
              },
            },
          },
        ],
      },
    },
  ]);

  const rows = pageResult?.data || [];
  const total = pageResult?.metadata?.[0]?.total || 0;

  // "Fee pending for the whole semester" is scoped to each student's OWN
  // current semester, students grouped by semesterId first and
  // StudentChallanService.getSemesterChallanStatusForStudents called once
  // per group — the same per-semester-bucket batching examController.js
  // already uses for admit-card eligibility. Only runs for this page.
  const bySemester = new Map();
  rows.forEach((r) => {
    const semId = r.semesterId?.toString();
    const profId = r.studentProfileId?.toString();
    if (!semId || !profId) return;
    if (!bySemester.has(semId)) bySemester.set(semId, []);
    bySemester.get(semId).push(profId);
  });

  const feeStatusMap = new Map();
  await Promise.all(
    Array.from(bySemester.entries()).map(async ([semId, ids]) => {
      const statusMap =
        await StudentChallanService.getSemesterChallanStatusForStudents(
          ids,
          semId,
        );
      statusMap.forEach((val, key) => feeStatusMap.set(key, val));
    }),
  );

  const formattedData = rows.map((r) => {
    const profileId = r.studentProfileId?.toString();
    const feeInfo = profileId ? feeStatusMap.get(profileId) : null;
    // Anything other than "paid" counts as pending — including
    // "not_generated", since a semester with no fee even billed yet is
    // just as much "not paid" from the school's point of view.
    const feePendingForSemester = !feeInfo || feeInfo.challanStatus !== "paid";

    return {
      _id: r._id,
      studentProfileId: profileId || null,
      name: r.name,
      rollNumber: r.rollNumber,
      email: r.email,
      status: r.status || "BLOCKED",
      lastLogin: r.lastLogin || null,
      academicStatus: r.academicStatus,
      admissionLifecycleStatus: r.admissionLifecycleStatus,
      program: r.programName ? { name: r.programName, level: r.programLevel } : null,
      programLevel: r.programLevel || null,
      department: r.department,
      session: r.session,
      semester: r.semester ?? null,
      feePendingForSemester,
      feeChallanStatus: feeInfo?.challanStatus || "not_generated",
    };
  });

  // Tab badge counts (College vs University) — independent of the current
  // page/search filter so switching pages doesn't make the badges flicker.
  const countsResult = await StudentAuth.aggregate([
    ...joinStages,
    {
      $group: {
        _id: {
          $cond: [{ $eq: ["$program.level", "HSSC"] }, "college", "university"],
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const counts = { college: 0, university: 0 };
  countsResult.forEach((c) => {
    counts[c._id] = c.count;
  });

  res.status(200).json({
    success: true,
    data: formattedData,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.max(Math.ceil(total / limitNumber), 1),
    },
    counts,
  });
});

// UPDATE CREDENTIALS (Email & Password)
export const updateLmsCredentials = asyncHandler(async (req, res) => {
  const { authId } = req.params;
  const { email, password } = req.body;

  const authRecord = await StudentAuth.findById(authId);
  if (!authRecord)
    return res.status(404).json({ message: "LMS Account not found" });

  // Update Email
  if (email) {
    const emailNorm = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    const emailExists = await StudentAuth.findOne({
      email: emailNorm,
      _id: { $ne: authId },
    });
    if (emailExists)
      return res
        .status(400)
        .json({ message: "Email is already in use by another student." });
    authRecord.email = emailNorm;

    // Also update PersonalInfo email to keep them in sync
    await PersonalInfo.findOneAndUpdate(
      { studentId: authRecord.studentProfileId },
      { email: emailNorm },
    );
  }

  // Update Password (hashed by the model's own pre-save hook)
  if (password && password.trim() !== "") {
    if (password.trim().length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }
    authRecord.password = password.trim();
  }

  await authRecord.save();
  res
    .status(200)
    .json({ success: true, message: "Credentials updated successfully." });
});

// TOGGLE STATUS (Works for Single AND Bulk)
export const toggleLmsStatus = asyncHandler(async (req, res) => {
  const { authIds, status } = req.body; // authIds is an Array of IDs, status is "ACTIVE" or "BLOCKED"

  if (!authIds || !Array.isArray(authIds) || authIds.length === 0) {
    return res.status(400).json({ message: "No accounts selected." });
  }

  if (!["ACTIVE", "BLOCKED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status provided." });
  }

  await StudentAuth.updateMany(
    { _id: { $in: authIds } },
    { $set: { status: status } },
  );

  res.status(200).json({
    success: true,
    message: `Successfully marked ${authIds.length} account(s) as ${status}.`,
  });
});

// GENERATE LMS EMAIL — Works for single, multiple, or "whole list" (the
// frontend just sends however many ids apply). Deterministic from
// rollNumber, so it's safe to re-run on an account that's already correct
// (skipped, not re-saved) and can never collide since rollNumber is unique.
export const bulkGenerateLmsEmails = asyncHandler(async (req, res) => {
  const { authIds } = req.body;

  if (!authIds || !Array.isArray(authIds) || authIds.length === 0) {
    return res.status(400).json({ message: "No accounts selected." });
  }
  if (authIds.length > BULK_ID_LIMIT) {
    return res.status(400).json({
      message: `Cannot process more than ${BULK_ID_LIMIT} accounts at once.`,
    });
  }

  const accounts = await StudentAuth.find({ _id: { $in: authIds } });

  let updatedCount = 0;
  const results = [];
  for (const account of accounts) {
    const generatedEmail = `${account.rollNumber}`.trim().toLowerCase() + `@${LMS_EMAIL_DOMAIN}`;
    if (account.email !== generatedEmail) {
      account.email = generatedEmail;
      // eslint-disable-next-line no-await-in-loop
      await account.save();
      // eslint-disable-next-line no-await-in-loop
      await PersonalInfo.findOneAndUpdate(
        { studentId: account.studentProfileId },
        { email: generatedEmail },
      );
      updatedCount += 1;
    }
    results.push({ authId: account._id, rollNumber: account.rollNumber, email: account.email });
  }

  res.status(200).json({
    success: true,
    message: `Generated/updated email for ${updatedCount} of ${accounts.length} account(s).`,
    data: results,
  });
});

// RESET LMS PASSWORD (auto-generated) — Works for single, multiple, or the
// whole list. Must save each StudentAuth document individually (not
// updateMany) so the model's own pre("save") bcrypt hook runs and each
// account gets its own distinct random password. The returned plaintext
// passwords are the only time they're ever visible again — the frontend is
// responsible for showing/exporting them immediately.
export const bulkResetLmsPasswords = asyncHandler(async (req, res) => {
  const { authIds } = req.body;

  if (!authIds || !Array.isArray(authIds) || authIds.length === 0) {
    return res.status(400).json({ message: "No accounts selected." });
  }
  if (authIds.length > BULK_ID_LIMIT) {
    return res.status(400).json({
      message: `Cannot process more than ${BULK_ID_LIMIT} accounts at once.`,
    });
  }

  const accounts = await StudentAuth.find({ _id: { $in: authIds } }).populate({
    path: "studentProfileId",
    populate: { path: "personalInfo", select: "fullName" },
  });

  const results = [];
  for (const account of accounts) {
    const newPassword = generateReadablePassword();
    account.password = newPassword;
    // eslint-disable-next-line no-await-in-loop
    await account.save();
    results.push({
      authId: account._id,
      name: account.studentProfileId?.personalInfo?.fullName || "Unknown",
      rollNumber: account.rollNumber,
      email: account.email,
      newPassword,
    });
  }

  res.status(200).json({
    success: true,
    message: `Reset password for ${results.length} account(s).`,
    data: results,
  });
});
