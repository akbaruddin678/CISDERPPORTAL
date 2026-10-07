import cron from "node-cron";
import { purgeExpiredAdmissionTrash } from "../controller/admissionTrashController.js";

// Same shape as student/utils/studentTrashCron.js — daily, Asia/Karachi,
// delegates all logic to the controller so this file stays just scheduling.
export const startAdmissionTrashCronJob = () => {
  cron.schedule(
    "10 0 * * *",
    async () => {
      const purgedCount = await purgeExpiredAdmissionTrash();
      if (purgedCount > 0) {
        console.log(`[CRON] Admission Trash: permanently purged ${purgedCount} record(s) past retention.`);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi",
    },
  );

  // Startup catch-up — a midnight-only cron reliably misses its window on a
  // dev server that restarts often (see accountant/utils/challanCron.js for
  // the same fix and rationale), leaving expired trash sitting past its
  // retention period until the next midnight the process happens to be up.
  purgeExpiredAdmissionTrash().catch((err) => {
    console.error("[CRON] Startup catch-up run of Admission Trash Purge failed:", err.message);
  });

  console.log("[CRON] Daily Admission Trash Purge Scanner successfully initialized.");
};
