import StaffProfile from "../../staff/models/StaffProfile.js";
import StaffAttendance from "../../staff/models/StaffAttendance.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ============================================================================
// MARK ATTENDANCE — bulk upsert for one date, whole-roster-at-once. Relies
// on the model's unique {staffId,date} index so re-marking the same day
// just overwrites the earlier entry.
// ============================================================================
export const markAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body;
  if (!date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: "date and records[] are required.",
    });
  }

  const day = startOfDay(date);
  const ops = records
    .filter((r) => r.staffId && r.status)
    .map((r) => ({
      updateOne: {
        filter: { staffId: r.staffId, date: day },
        update: { $set: { status: r.status, markedBy: "Manual" } },
        upsert: true,
      },
    }));

  if (ops.length === 0) {
    return res.status(400).json({ success: false, message: "No valid records to save." });
  }

  await StaffAttendance.bulkWrite(ops);
  res.status(200).json({ success: true, message: `Attendance saved for ${ops.length} staff member(s).` });
});

// ============================================================================
// GET ATTENDANCE FOR A DATE — full active-staff roster joined with that
// date's records (missing entries default to "Unmarked" client-side).
// ============================================================================
export const getAttendanceForDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: "date is required." });
  }
  const day = startOfDay(date);

  const [staff, records] = await Promise.all([
    StaffProfile.find({ status: "Active" })
      .populate({ path: "personalInfo", select: "name" })
      .populate("departmentId", "name")
      .lean(),
    StaffAttendance.find({ date: day }).lean(),
  ]);

  const recordByStaffId = new Map(records.map((r) => [String(r.staffId), r]));

  const data = staff.map((s) => {
    const record = recordByStaffId.get(String(s._id));
    const staffPunches = (record?.punches || []).map((p) => ({
      time: p.timestamp,
      action: p.action,
      source: p.source,
    }));
    return {
      staffId: String(s._id),
      name: s.personalInfo?.name || "Unknown",
      employeeId: s.employeeId,
      departmentName: s.departmentId?.name || "N/A",
      status: record?.status || null,
      checkInTime: record?.checkInTime || null,
      checkOutTime: record?.checkOutTime || null,
      markedBy: record?.markedBy || null,
      punchCount: staffPunches.length,
      punches: staffPunches,
    };
  });

  res.status(200).json({ success: true, data });
});

// ============================================================================
// MONTHLY SUMMARY — per-staff attendance counts by status for one month.
// ============================================================================
export const getMonthlySummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ success: false, message: "month and year are required." });
  }

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 1);

  const summary = await StaffAttendance.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: { staffId: "$staffId", status: "$status" }, count: { $sum: 1 } } },
  ]);

  const byStaff = {};
  summary.forEach((row) => {
    const key = String(row._id.staffId);
    if (!byStaff[key]) byStaff[key] = {};
    byStaff[key][row._id.status] = row.count;
  });

  res.status(200).json({ success: true, data: byStaff });
});
