import cron from "node-cron";
import User from "../model/User.js";
import Person from "../../core/models/Person.js";

// An applicant who never verifies their email would otherwise occupy that
// email address forever (registerApplicant rejects a duplicate email up
// front) — this purges any registration still unverified past its 10-minute
// window (see verificationExpires, set in registerApplicant) so the same
// email can be used to sign up again. Deletes the linked Person record too,
// since a raw Mongo delete here wouldn't otherwise leave anything to do it.
export const purgeUnverifiedApplicants = async () => {
  const expired = await User.find({
    status: "pending_verification",
    emailVerified: false,
    verificationExpires: { $lt: new Date() },
  }).select("_id");

  if (expired.length === 0) return 0;

  const ids = expired.map((u) => u._id);
  await Person.deleteMany({ userId: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  return ids.length;
};

// Runs every minute — the unverified window is only 10 minutes, so the
// daily cadence used by the other cron jobs in this codebase
// (studentTrashCron.js, challanCron.js) would leave expired registrations
// blocking their email for most of a day before being cleared.
export const startApplicantCleanupCronJob = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      const purgedCount = await purgeUnverifiedApplicants();
      if (purgedCount > 0) {
        console.log(
          `[CRON] Unverified Applicants: purged ${purgedCount} expired pending registration(s).`,
        );
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi",
    },
  );

  console.log("[CRON] Unverified Applicant Cleanup Scanner successfully initialized (every minute).");
};
