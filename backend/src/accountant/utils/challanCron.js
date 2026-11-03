import cron from "node-cron";
import { StudentChallanService } from "../services/studentChallan.service.js";
import StudentChallan from "../model/StudentChallan.js";
import { getLateFineSchedule } from "../services/fineSetting.service.js";

// Open challans created before the Late Fine setting existed (or saved under a
// different campus) carry no schedule, so nothing is printed or charged for
// them. Stamp the current saved schedule on them, per campus.
const backfillLateFineTiers = async () => {
  const missing = {
    isDeleted: false,
    status: { $in: ["issued", "partial", "draft", "overdue"] },
    $or: [{ lateFineTiers: { $exists: false } }, { lateFineTiers: { $size: 0 } }],
  };
  const campusIds = await StudentChallan.distinct("campusId", missing);
  for (const campusId of campusIds) {
    const schedule = await getLateFineSchedule(campusId || null);
    if (!schedule.some((tier) => tier.amount > 0)) continue;
    await StudentChallan.updateMany(
      { ...missing, campusId: campusId || null },
      { $set: { lateFineTiers: schedule, lateFeeAmount: schedule[0].amount } },
    );
  }
};

export const startChallanCronJob = () => {

  cron.schedule(
    "1 0 * * *",
    async () => {

      await StudentChallanService.processOverdueChallansAutomatically();
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi",
    },
  );

  // Also run once immediately on startup — the daily 00:01 run only fires
  // if the server happens to be up at that exact minute; if it's down or
  // mid-restart (which happens often during development), that whole
  // day's overdue-detection and non-payment-cancellation silently never
  // runs until the next midnight. Running once here catches that up
  // immediately instead of leaving already-overdue challans stuck showing
  // "issued" for up to another day.
  backfillLateFineTiers()
    .catch((err) => {
      console.error("[CRON] Late fine schedule backfill failed:", err.message);
    })
    .then(() => StudentChallanService.processOverdueChallansAutomatically())
    .catch((err) => {
      console.error("[CRON] Startup catch-up run of Overdue Challan Scanner failed:", err.message);
    });

  console.log("[CRON] Daily Overdue Challan Scanner successfully initialized.");
};
