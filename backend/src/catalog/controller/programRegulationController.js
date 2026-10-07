import mongoose from "mongoose";
import ProgramRegulation from "../model/ProgramRegulation.js";
import { hasRole, getActorName } from "../../graduation/services/graduationAccess.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

const isId = (v) => mongoose.isValidObjectId(v);
const NUMERIC_FIELDS = [
  "minTotalCredits",
  "minDurationSemesters",
  "maxDurationSemesters",
  "minCreditsPerSemester",
  "maxCreditsPerSemester",
  "maxSummerCredits",
];
const canBypassLock = (user) => hasRole(user, "admin", "vc", "vice_vc");
const canEditUnlocked = (user) => hasRole(user, "admin", "head_of_academia", "registrar");

// GET /api/catalog/program-regulations?programId=&admissionTermId=
export const listRegulations = asyncHandler(async (req, res) => {
  const { programId, admissionTermId } = req.query;
  const filter = {};
  if (programId) {
    if (!isId(programId)) return res.status(400).json({ success: false, message: "Invalid programId." });
    filter.programId = programId;
  }
  if (admissionTermId) {
    if (!isId(admissionTermId)) return res.status(400).json({ success: false, message: "Invalid admissionTermId." });
    filter.admissionTermId = admissionTermId;
  }
  const regulations = await ProgramRegulation.find(filter)
    .populate("programId", "name code")
    .populate("admissionTermId", "name")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: regulations });
});

// POST /api/catalog/program-regulations  { programId, admissionTermId, ...numeric fields }
// Create-or-update (upsert by the unique programId+admissionTermId index).
// Refused with 409 if a regulation already exists for this batch and is
// locked, unless the caller can bypass the lock.
export const createOrUpdateRegulation = asyncHandler(async (req, res) => {
  const { programId, admissionTermId } = req.body;
  if (!isId(programId) || !isId(admissionTermId)) {
    return res.status(400).json({ success: false, message: "A valid programId and admissionTermId are required." });
  }
  if (!canEditUnlocked(req.user) && !canBypassLock(req.user)) {
    return res.status(403).json({ success: false, message: "You don't have permission to edit Program Regulations." });
  }

  const existing = await ProgramRegulation.findOne({ programId, admissionTermId });
  if (existing?.isLocked) {
    return res.status(409).json({
      success: false,
      message: "This batch rulebook is permanently locked. Create rules for a new admission batch instead of changing historical policy.",
    });
  }

  const update = {};
  for (const field of NUMERIC_FIELDS) {
    if (req.body[field] === undefined || req.body[field] === "" || req.body[field] === null) continue;
    const n = Number(req.body[field]);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ success: false, message: `${field} must be a non-negative number.` });
    }
    update[field] = n;
  }

  const actorName = await getActorName(req.user);
  const nextVersion = existing ? (existing.version || 1) + 1 : 1;
  const regulation = await ProgramRegulation.findOneAndUpdate(
    { programId, admissionTermId },
    existing
      ? {
          $set: { ...update, version: nextVersion },
          $push: { changeHistory: { version: nextVersion, changedBy: req.user._id, changedByName: actorName, values: update } },
        }
      : {
          $set: { ...update, version: 1, createdBy: req.user._id, createdByName: actorName },
          $push: { changeHistory: { version: 1, changedBy: req.user._id, changedByName: actorName, values: update } },
        },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.json({ success: true, message: "Program Regulations saved.", data: regulation });
});

// PATCH /api/catalog/program-regulations/:id/lock
export const lockRegulation = asyncHandler(async (req, res) => {
  if (!canEditUnlocked(req.user) && !canBypassLock(req.user)) {
    return res.status(403).json({ success: false, message: "You don't have permission to lock Program Regulations." });
  }
  const regulation = await ProgramRegulation.findById(req.params.id);
  if (!regulation) return res.status(404).json({ success: false, message: "Regulation not found." });

  const actorName = await getActorName(req.user);
  regulation.isLocked = true;
  regulation.lockedBy = req.user._id;
  regulation.lockedByName = actorName;
  regulation.lockedAt = new Date();
  await regulation.save();

  res.json({ success: true, message: "Regulations locked.", data: regulation });
});

// PATCH /api/catalog/program-regulations/:id/unlock — admin/VC/Dean only.
export const unlockRegulation = asyncHandler(async (req, res) => {
  if (!canBypassLock(req.user)) {
    return res.status(403).json({ success: false, message: "Only an admin or VC/Dean-tier user can unlock Program Regulations." });
  }
  const regulation = await ProgramRegulation.findById(req.params.id);
  if (!regulation) return res.status(404).json({ success: false, message: "Regulation not found." });
  return res.status(409).json({
    success: false,
    message: "Locked batch regulations are immutable. Create a new rulebook for a new admission batch.",
  });
});
