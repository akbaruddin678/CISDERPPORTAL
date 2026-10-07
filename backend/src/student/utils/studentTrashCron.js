import cron from "node-cron";
import { purgeExpiredStudentTrash } from "../controller/studentTrashController.js";

// Same shape as accountant/utils/challanCron.js — daily, Asia/Karachi,
// delegates all logic to the controller so this file stays just scheduling.
export const startStudentTrashCronJob = () => {
  cron.schedule(
    "5 0 * * *",
    async () => {
      const purgedCount = await purgeExpiredStudentTrash();
      if (purgedCount > 0) {
        console.log(`[CRON] Student Trash: permanently purged ${purgedCount} record(s) past retention.`);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi",
    },
  );

  console.log("[CRON] Daily Student Trash Purge Scanner successfully initialized.");
};
