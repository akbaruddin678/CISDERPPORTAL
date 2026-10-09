import FineSetting from "../model/FineSetting.js";

// What the system charged before this setting existed. Used only until an
// accountant saves a value, so nothing changes silently on upgrade.
export const DEFAULT_LATE_FINE = 2000;

const roundNonNegative = (value, field) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const err = new Error(`${field} must be a number, 0 or more.`);
    err.statusCode = 400;
    throw err;
  }
  return Math.round(number);
};

export function normalizeLateFineTiers(tiers, fallbackAmount = DEFAULT_LATE_FINE) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return [{ durationDays: null, amount: Math.max(0, Math.round(Number(fallbackAmount) || 0)) }];
  }

  return tiers.map((tier, index) => ({
    durationDays:
      index === tiers.length - 1 || tier.durationDays === null
        ? null
        : Math.max(1, Math.round(Number(tier.durationDays) || 1)),
    amount: Math.max(0, Math.round(Number(tier.amount) || 0)),
  }));
}

export function calculateLateFine(tiers, daysOverdue) {
  let remainingDays = Math.max(0, Math.floor(Number(daysOverdue) || 0));
  if (remainingDays < 1) return 0;

  let fine = 0;
  for (const tier of normalizeLateFineTiers(tiers, 0)) {
    if (remainingDays < 1) break;
    fine += tier.amount;
    if (tier.durationDays === null) break;
    remainingDays -= tier.durationDays;
  }
  return fine;
}

export async function getLateFineSchedule(campusId = null) {
  let setting = null;
  if (campusId) setting = await FineSetting.findOne({ campusId }).lean();
  if (!setting) setting = await FineSetting.findOne({ campusId: null }).lean();

  const legacyAmount = setting?.lateFineAmount ?? DEFAULT_LATE_FINE;
  return normalizeLateFineTiers(setting?.lateFineTiers, legacyAmount);
}

// Resolves the late fine for a campus: the campus's own setting, else the
// all-campus default setting, else DEFAULT_LATE_FINE. A saved 0 is respected
// (it means "no fine").
export async function getLateFineAmount(campusId = null) {
  const schedule = await getLateFineSchedule(campusId);
  return schedule[0]?.amount || 0;
}

export async function saveLateFineSchedule(campusId, tiers, userId) {
  if (!Array.isArray(tiers) || tiers.length !== 3) {
    const err = new Error("Exactly three late-fine stages are required.");
    err.statusCode = 400;
    throw err;
  }

  const normalized = tiers.map((tier, index) => {
    const amount = roundNonNegative(tier.amount, `Stage ${index + 1} fine`);
    if (index === 2) return { durationDays: null, amount };
    const durationDays = Math.round(Number(tier.durationDays));
    if (!Number.isFinite(durationDays) || durationDays < 1) {
      const err = new Error(`Stage ${index + 1} duration must be at least 1 day.`);
      err.statusCode = 400;
      throw err;
    }
    return { durationDays, amount };
  });

  await FineSetting.findOneAndUpdate(
    { campusId: campusId || null },
    {
      $set: {
        lateFineAmount: normalized[0].amount,
        lateFineTiers: normalized,
        updatedBy: userId,
      },
    },
    { upsert: true, new: true },
  );
  return normalized;
}

export async function saveLateFineAmount(campusId, amount, userId) {
  const value = roundNonNegative(amount, "Fine amount");
  const tiers = [
    { durationDays: 1, amount: value },
    { durationDays: 1, amount: 0 },
    { durationDays: null, amount: 0 },
  ];
  await saveLateFineSchedule(campusId, tiers, userId);
  return value;
}
