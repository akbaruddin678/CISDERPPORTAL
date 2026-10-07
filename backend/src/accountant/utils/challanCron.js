import cron from "node-cron";
import { StudentChallanService } from "../services/studentChallan.service.js";

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
  StudentChallanService.processOverdueChallansAutomatically().catch((err) => {
    console.error("[CRON] Startup catch-up run of Overdue Challan Scanner failed:", err.message);
  });

  console.log("[CRON] Daily Overdue Challan Scanner successfully initialized.");
};
