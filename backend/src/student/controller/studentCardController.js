import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";
import Person from "../../core/models/Person.js";
import Term from "../../catalog/model/Term.js";
import Semester from "../../catalog/model/Semester.js";
import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import StudentDocuments from "../models/StudentDocuments.js";
import StudentIdCard from "../models/StudentIdCard.js";

const isId = (v) => mongoose.isValidObjectId(v);
const text = (v) => String(v ?? "").trim();
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const toIsoDay = (d) => new Date(d).toISOString().slice(0, 10);

// The card is always drawn from the student's current profile; the photo is
// fetched server-side and returned inline so the browser can render it into
// the printable PDF without cross-origin restrictions on the media bucket.
async function fetchPhotoDataUrl(url) {
  const base = process.env.MEDIA_URL;
  if (!url || !base || !url.startsWith(base)) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadStudentForCard(studentId) {
  const student = await StudentProfile.findById(studentId)
    .select("studentId status isTrashed departmentId programId semesterId termId")
    .populate("departmentId", "name")
    .populate("programId", "name level durationStages")
    .populate("semesterId", "name number")
    .populate("termId", "name startDate")
    .lean();
  if (!student || student.isTrashed) return null;
  const [personal, family, documents] = await Promise.all([
    PersonalInfo.findOne({ studentId }).select("fullName cnic phone").lean(),
    FamilyInfo.findOne({ studentId }).select("fatherName").lean(),
    StudentDocuments.findOne({ studentId }).select("profilePhoto").lean(),
  ]);
  return {
    profile: student,
    view: {
      _id: student._id,
      regNo: student.studentId,
      status: student.status,
      fullName: personal?.fullName || "Unnamed student",
      fatherName: family?.fatherName || "",
      cnic: personal?.cnic || "",
      phone: personal?.phone || "",
      programName: student.programId?.name || "",
      departmentName: student.departmentId?.name || "",
      semesterNumber: student.semesterId?.number ?? null,
      sessionName: student.termId?.name || "",
      sessionId: student.termId?._id || null,
    },
    photoUrl: documents?.profilePhoto || null,
  };
}

// Suggests validity from what is left of the program: remaining semesters
// (or yearly parts for HSSC) from today, to the end of that month.
async function defaultsFor(profile) {
  const issue = new Date();
  const perStage = profile.programId?.level === "HSSC" ? 12 : 6;
  const stages = profile.programId?.durationStages || 1;
  const remaining = Math.max(1, stages - (profile.semesterId?.number || 1) + 1);
  const expiry = new Date(issue);
  expiry.setMonth(expiry.getMonth() + remaining * perStage + 1, 0);

  const endTerm = await Term.findOne({ startDate: { $lte: expiry } })
    .sort({ startDate: -1 })
    .select("_id")
    .lean();
  return {
    issueDate: toIsoDay(issue),
    expiryDate: toIsoDay(expiry),
    issueTermId: profile.termId?._id || null,
    endTermId: endTerm?._id || profile.termId?._id || null,
  };
}

const cardView = (c) => ({
  _id: c._id,
  cardNumber: c.cardNumber,
  status: c.status,
  issueDate: c.issueDate,
  expiryDate: c.expiryDate,
  issueTerm: c.issueTermId?.name || "",
  endTerm: c.endTermId?.name || "",
  issueTermId: c.issueTermId?._id || c.issueTermId,
  endTermId: c.endTermId?._id || c.endTermId,
  snapshot: c.snapshot || {},
  studentId: c.studentId?._id || c.studentId,
  printCount: c.printCount || 0,
  lastPrintedAt: c.lastPrintedAt || null,
  issuedByName: c.issuedByName || "",
  issuedAt: c.createdAt,
  revokedReason: c.revokedReason || "",
});

const populateCard = (q) => q.populate("issueTermId", "name").populate("endTermId", "name");

export const getCardData = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!isId(studentId)) return fail(res, 404, "Student not found.");
  const loaded = await loadStudentForCard(studentId);
  if (!loaded) return fail(res, 404, "Student not found.");

  const [photoDataUrl, defaults, cards] = await Promise.all([
    fetchPhotoDataUrl(loaded.photoUrl),
    defaultsFor(loaded.profile),
    populateCard(StudentIdCard.find({ studentId })).sort({ createdAt: -1 }).lean(),
  ]);

  res.json({
    success: true,
    data: {
      student: loaded.view,
      photoUrl: loaded.photoUrl,
      photoDataUrl,
      defaults,
      activeCard: cards.find((c) => c.status === "active") ? cardView(cards.find((c) => c.status === "active")) : null,
      history: cards.map(cardView),
      canIssue: !["withdrawn"].includes(loaded.view.status),
    },
  });
});

// Saves the picked / captured picture as the student's official profile photo.
export const saveStudentPhoto = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!isId(studentId)) return fail(res, 404, "Student not found.");
  const file = req.file;
  if (!file) return fail(res, 400, "No photo was received.");
  if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
    return fail(res, 400, "The photo must be a JPEG or PNG image.");
  }
  const exists = await StudentProfile.exists({ _id: studentId, isTrashed: { $ne: true } });
  if (!exists) return fail(res, 404, "Student not found.");

  const url = await uploadToR2(file, `students/${studentId}/documents`);
  await StudentDocuments.findOneAndUpdate(
    { studentId },
    { $set: { profilePhoto: url } },
    { upsert: true, new: true },
  );
  res.json({ success: true, message: "Photo saved as the student's official picture.", data: { photoUrl: url } });
});

async function nextCardNumber(year, session) {
  const prefix = `CISD-SC-${year}-`;
  const last = await StudentIdCard.findOne({ cardNumber: new RegExp(`^${prefix}`) })
    .sort({ cardNumber: -1 })
    .select("cardNumber")
    .session(session)
    .lean();
  const n = last ? Number(last.cardNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(5, "0")}`;
}

export const issueCard = asyncHandler(async (req, res) => {
  const { studentId, issueDate, expiryDate, issueTermId, endTermId } = req.body;
  if (!isId(studentId)) return fail(res, 400, "A valid student is required.");
  if (!isId(issueTermId) || !isId(endTermId)) return fail(res, 400, "Choose the issue session and the end session.");

  const issue = new Date(issueDate);
  const expiry = new Date(expiryDate);
  if (Number.isNaN(issue.getTime()) || Number.isNaN(expiry.getTime())) {
    return fail(res, 400, "Enter a valid issue date and end date.");
  }
  if (expiry <= issue) return fail(res, 400, "The end date must be after the issue date.");

  const [loaded, issueTerm, endTerm] = await Promise.all([
    loadStudentForCard(studentId),
    Term.findById(issueTermId).select("name startDate").lean(),
    Term.findById(endTermId).select("name startDate").lean(),
  ]);
  if (!loaded) return fail(res, 404, "Student not found.");
  if (loaded.view.status === "withdrawn") return fail(res, 409, "A withdrawn student can't be issued a card.");
  if (!issueTerm || !endTerm) return fail(res, 400, "The selected session no longer exists.");
  if (issueTerm.startDate && endTerm.startDate && endTerm.startDate < issueTerm.startDate) {
    return fail(res, 400, "The end session can't be earlier than the issue session.");
  }
  if (!loaded.photoUrl) return fail(res, 409, "Add the student's photo before generating the card.");

  const person = await Person.findOne({ userId: req.user._id }).select("name").lean();
  const issuedByName = person?.name || req.user.email;

  const session = await mongoose.startSession();
  let card;
  try {
    await session.withTransaction(async () => {
      await StudentIdCard.updateMany(
        { studentId, status: "active" },
        { $set: { status: "replaced" } },
        { session },
      );
      const cardNumber = await nextCardNumber(new Date().getFullYear(), session);
      [card] = await StudentIdCard.create(
        [
          {
            studentId,
            cardNumber,
            issueDate: issue,
            expiryDate: expiry,
            issueTermId,
            endTermId,
            photoUrl: loaded.photoUrl,
            snapshot: {
              fullName: loaded.view.fullName,
              fatherName: loaded.view.fatherName,
              regNo: loaded.view.regNo,
              cnic: loaded.view.cnic,
              programName: loaded.view.programName,
              departmentName: loaded.view.departmentName,
            },
            issuedBy: req.user._id,
            issuedByName,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  const full = await populateCard(StudentIdCard.findById(card._id)).lean();
  res.status(201).json({ success: true, message: "Student card generated.", data: cardView(full) });
});

export const markPrinted = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 404, "Card not found.");
  const card = await StudentIdCard.findByIdAndUpdate(
    req.params.id,
    { $inc: { printCount: 1 }, $set: { lastPrintedAt: new Date() } },
    { new: true },
  ).lean();
  if (!card) return fail(res, 404, "Card not found.");
  res.json({ success: true, data: { printCount: card.printCount } });
});

export const revokeCard = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 404, "Card not found.");
  const reason = text(req.body.reason);
  if (!reason) return fail(res, 400, "A reason is required (e.g. lost, damaged, withdrawn).");
  const card = await StudentIdCard.findById(req.params.id);
  if (!card) return fail(res, 404, "Card not found.");
  if (card.status !== "active") return fail(res, 409, "Only an active card can be revoked.");
  card.status = "revoked";
  card.revokedReason = reason;
  card.revokedAt = new Date();
  await card.save();
  res.json({ success: true, message: "Card revoked." });
});

export const listCards = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const filter = {};
  if (["active", "replaced", "revoked"].includes(req.query.status)) filter.status = req.query.status;

  const q = text(req.query.q);
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [byProfile, byInfo] = await Promise.all([
      StudentProfile.find({ studentId: rx }).select("_id").limit(200).lean(),
      PersonalInfo.find({ $or: [{ fullName: rx }, { cnic: rx }] }).select("studentId").limit(200).lean(),
    ]);
    filter.$or = [
      { cardNumber: rx },
      { studentId: { $in: [...byProfile.map((s) => s._id), ...byInfo.map((i) => i.studentId)] } },
    ];
  }

  const [rows, total] = await Promise.all([
    populateCard(StudentIdCard.find(filter))
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    StudentIdCard.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: rows.map(cardView),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

// Students the card screen can pick from, narrowed by department, program,
// semester number and session (all optional) plus a name / reg-no / CNIC
// search. Each row says whether the student has a photo and a live card, so
// the picker shows what is still to do.
export const listStudentsForCards = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const { departmentId, programId, sessionId } = req.query;
  const semesterNumber = parseInt(req.query.semesterNumber);

  // Same visibility rule as the rest of the app: an admission that has never
  // paid a fee stays out, and so do withdrawn / graduated students.
  const filter = {
    isTrashed: { $ne: true },
    feeActivated: { $ne: false },
    status: { $nin: ["withdrawn", "graduated"] },
  };
  if (isId(departmentId)) filter.departmentId = departmentId;
  if (isId(programId)) filter.programId = programId;
  if (isId(sessionId)) filter.termId = sessionId;
  if (Number.isFinite(semesterNumber)) {
    const semQuery = { number: semesterNumber };
    if (isId(programId)) semQuery.programId = programId;
    const sems = await Semester.find(semQuery).select("_id").lean();
    filter.semesterId = { $in: sems.map((x) => x._id) };
  }

  const q = text(req.query.q);
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const byInfo = await PersonalInfo.find({ $or: [{ fullName: rx }, { cnic: rx }] })
      .select("studentId")
      .limit(500)
      .lean();
    filter.$or = [{ studentId: rx }, { _id: { $in: byInfo.map((i) => i.studentId) } }];
  }

  const [rows, total] = await Promise.all([
    StudentProfile.find(filter)
      .select("studentId departmentId programId semesterId termId status")
      .populate("departmentId", "name")
      .populate("programId", "name")
      .populate("semesterId", "name number")
      .populate("termId", "name")
      .sort({ studentId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    StudentProfile.countDocuments(filter),
  ]);

  const ids = rows.map((r) => r._id);
  const [infos, docs, cards] = await Promise.all([
    PersonalInfo.find({ studentId: { $in: ids } }).select("studentId fullName").lean(),
    StudentDocuments.find({ studentId: { $in: ids } }).select("studentId profilePhoto").lean(),
    StudentIdCard.find({ studentId: { $in: ids }, status: "active" })
      .select("studentId cardNumber expiryDate")
      .lean(),
  ]);
  const infoMap = new Map(infos.map((i) => [String(i.studentId), i]));
  const photoSet = new Set(docs.filter((d) => d.profilePhoto).map((d) => String(d.studentId)));
  const cardMap = new Map(cards.map((c) => [String(c.studentId), c]));

  res.json({
    success: true,
    data: rows.map((r) => {
      const card = cardMap.get(String(r._id));
      return {
        _id: r._id,
        regNo: r.studentId,
        fullName: infoMap.get(String(r._id))?.fullName || "Unnamed student",
        departmentName: r.departmentId?.name || "",
        programName: r.programId?.name || "",
        semesterNumber: r.semesterId?.number ?? null,
        sessionName: r.termId?.name || "",
        hasPhoto: photoSet.has(String(r._id)),
        activeCard: card ? { cardNumber: card.cardNumber, expiryDate: card.expiryDate } : null,
      };
    }),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});
