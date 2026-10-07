import FineSetting from "../model/FineSetting.js";

// What the system charged before this setting existed. Used only until an
// accountant saves a value, so nothing changes silently on upgrade.
export const DEFAULT_LATE_FINE = 2000;

// Resolves the late fine for a campus: the campus's own setting, else the
// all-campus default setting, else DEFAULT_LATE_FINE. A saved 0 is respected
// (it means "no fine").
export async function getLateFineAmount(campusId = null) {
  if (campusId) {
    const own = await FineSetting.findOne({ campusId }).lean();
    if (own) return own.lateFineAmount;
  }
  const global = await FineSetting.findOne({ campusId: null }).lean();
  if (global) return global.lateFineAmount;
  return DEFAULT_LATE_FINE;
}

export async function saveLateFineAmount(campusId, amount, userId) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) {
    const err = new Error("Fine amount must be a number, 0 or more.");
    err.statusCode = 400;
    throw err;
  }
  const rounded = Math.round(value);
  await FineSetting.findOneAndUpdate(
    { campusId: campusId || null },
    { $set: { lateFineAmount: rounded, updatedBy: userId } },
    { upsert: true, new: true },
  );
  return rounded;
}
