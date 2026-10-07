import cron from "node-cron";
import StaffProfile from "../../staff/models/StaffProfile.js";
import StaffAttendance from "../../staff/models/StaffAttendance.js";
import StaffLeaveRequest from "../../staff/models/StaffLeaveRequest.js";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Runs once after the work day ends — for every Active staff member with
// no punch/manual entry for today, records a real computed default instead
// of leaving it to silently look like nothing happened: "On Leave" if an
// Approved_HR leave covers today, otherwise "Absent".
export const runAttendanceAbsenceScan = async () => {
  const today = startOfDay(new Date());

  const [activeStaff, markedStaffIds] = await Promise.all([
    StaffProfile.find({ status: "Active" }).select("_id").lean(),
    StaffAttendance.find({ date: today }).select("staffId").lean(),
  ]);
  const markedSet = new Set(markedStaffIds.map((r) => String(r.staffId)));
  const unmarked = activeStaff.filter((s) => !markedSet.has(String(s._id)));

  if (unmarked.length === 0) return { absentCount: 0, onLeaveCount: 0 };

  const onLeaveRequests = await StaffLeaveRequest.find({
    staffId: { $in: unmarked.map((s) => s._id) },
    status: "Approved_HR",
    startDate: { $lte: today },
    endDate: { $gte: today },
  })
    .select("staffId")
    .lean();
  const onLeaveSet = new Set(onLeaveRequests.map((r) => String(r.staffId)));

  const ops = unmarked.map((s) => ({
    insertOne: {
      document: {
        staffId: s._id,
        date: today,
        status: onLeaveSet.has(String(s._id)) ? "On Leave" : "Absent",
        markedBy: "System",
      },
    },
  }));
  await StaffAttendance.bulkWrite(ops);

  return {
    absentCount: unmarked.length - onLeaveSet.size,
    onLeaveCount: onLeaveSet.size,
  };
};

export const startAttendanceAbsenceCronJob = () => {
  cron.schedule(
    "30 20 * * *",
    async () => {
      await runAttendanceAbsenceScan();
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi",
    },
  );

  console.log("[CRON] Daily Staff Attendance Absence Scanner successfully initialized.");
};
