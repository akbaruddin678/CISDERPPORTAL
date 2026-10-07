import cron from "node-cron";
import StaffProfile from "../../staff/models/StaffProfile.js";
import StaffDocument from "../../staff/models/StaffDocument.js";
import User from "../../user/model/User.js";
import {
  sendProbationEndingEmail,
  sendDocumentExpiryEmail,
  sendContractEndingEmail,
} from "../../core/utils/email.js";

const ALERT_WINDOW_DAYS = 30;
const TIME_BOUND_TYPES = ["Visiting", "Adjunct", "Contract"];

const windowEnd = () => {
  const d = new Date();
  d.setDate(d.getDate() + ALERT_WINDOW_DAYS);
  return d;
};

const getHrEmails = async () => {
  const hrUsers = await User.find({ roles: "hr" }).select("email").lean();
  return hrUsers.map((u) => u.email).filter(Boolean);
};

// Probation periods ending within the alert window, not yet reminded —
// emails HR plus the employee's own department head (if any), matching
// the spec's "triggering automated workflows to the HOD and HR 30 days
// before the probation ends."
const scanProbationEndings = async (hrEmails) => {
  const staffList = await StaffProfile.find({
    "probation.status": "in_progress",
    "probation.endDate": { $lte: windowEnd(), $gte: new Date() },
    "probation.reminderSentAt": null,
  })
    .populate({ path: "departmentId", select: "headOfDepartment" })
    .populate("personalInfo")
    .lean();

  for (const staff of staffList) {
    const name = staff.personalInfo?.name || staff.employeeId;
    const recipients = new Set(hrEmails);

    if (staff.departmentId?.headOfDepartment) {
      const hod = await StaffProfile.findById(staff.departmentId.headOfDepartment)
        .populate("userId", "email")
        .lean();
      if (hod?.userId?.email) recipients.add(hod.userId.email);
    }

    for (const email of recipients) {
      await sendProbationEndingEmail(email, { name, endDate: staff.probation.endDate }).catch(
        () => null,
      );
    }

    await StaffProfile.updateOne(
      { _id: staff._id },
      { $set: { "probation.reminderSentAt": new Date() } },
    );
  }

  return staffList.length;
};

// StaffDocument.expiryDate within the alert window, not yet alerted —
// emails the employee themselves plus HR.
const scanDocumentExpiries = async (hrEmails) => {
  const docs = await StaffDocument.find({
    expiryDate: { $lte: windowEnd(), $gte: new Date() },
    expiryAlertSentAt: null,
  }).lean();

  for (const doc of docs) {
    const staff = await StaffProfile.findById(doc.staffId)
      .populate("userId", "email")
      .populate("personalInfo")
      .lean();
    if (!staff) continue;

    const name = staff.personalInfo?.name || staff.employeeId;
    const recipients = new Set(hrEmails);
    if (staff.userId?.email) recipients.add(staff.userId.email);

    for (const email of recipients) {
      await sendDocumentExpiryEmail(email, {
        name,
        docType: doc.docType,
        expiryDate: doc.expiryDate,
      }).catch(() => null);
    }

    await StaffDocument.updateOne(
      { _id: doc._id },
      { $set: { expiryAlertSentAt: new Date() } },
    );
  }

  return docs.length;
};

// Time-bound contracts (Visiting/Adjunct/Contract) with contractEndDate
// within the alert window, not yet alerted.
const scanContractEndings = async (hrEmails) => {
  const staffList = await StaffProfile.find({
    employmentType: { $in: TIME_BOUND_TYPES },
    contractEndDate: { $lte: windowEnd(), $gte: new Date() },
    contractEndAlertSentAt: null,
  })
    .populate("personalInfo")
    .lean();

  for (const staff of staffList) {
    const name = staff.personalInfo?.name || staff.employeeId;
    for (const email of hrEmails) {
      await sendContractEndingEmail(email, { name, endDate: staff.contractEndDate }).catch(
        () => null,
      );
    }

    await StaffProfile.updateOne(
      { _id: staff._id },
      { $set: { contractEndAlertSentAt: new Date() } },
    );
  }

  return staffList.length;
};

export const runHrAlertScan = async () => {
  const hrEmails = await getHrEmails();
  const [probationCount, documentCount, contractCount] = await Promise.all([
    scanProbationEndings(hrEmails),
    scanDocumentExpiries(hrEmails),
    scanContractEndings(hrEmails),
  ]);
  return { probationCount, documentCount, contractCount };
};

// Offset from the challan cron ("1 0 * * *") to avoid both running at
// the exact same minute.
export const startHrAlertCronJob = () => {
  cron.schedule(
    "15 0 * * *",
    async () => {
      await runHrAlertScan();
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi",
    },
  );

  console.log("[CRON] Daily HR Probation/Document/Contract Alert Scanner successfully initialized.");
};
