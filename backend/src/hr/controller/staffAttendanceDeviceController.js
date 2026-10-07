import StaffProfile from "../../staff/models/StaffProfile.js";
import StaffAttendance from "../../staff/models/StaffAttendance.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

// Shift start times used to decide Present vs Late on check-in. Weekend
// Program has no fixed weekday cadence, so it shares Day Shift's start
// time purely as a reasonable default grace anchor.
const SHIFT_START_TIMES = {
  "Day Shift": "09:00",
  "Evening Shift": "14:00",
  "Weekend Program": "09:00",
};
const GRACE_PERIOD_MINUTES = 15;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isLate = (punchTime, shift) => {
  const [hh, mm] = (SHIFT_START_TIMES[shift] || SHIFT_START_TIMES["Day Shift"])
    .split(":")
    .map(Number);
  const shiftStart = new Date(punchTime);
  shiftStart.setHours(hh, mm + GRACE_PERIOD_MINUTES, 0, 0);
  return punchTime > shiftStart;
};

// Console-logs every single punch clearly the moment it happens — the
// caller (device bridge/kiosk) doesn't need to log anything itself for
// this to show up.
const logPunch = ({ staff, staffName, punchTime, action, source }) => {
  console.log(
    `[Biometric Punch] ${staffName} (${staff.employeeId}) — ${action} at ${punchTime.toLocaleString()} [source: ${source}]`,
  );
};

// ============================================================================
// RECORD BIOMETRIC PUNCH — the single ingestion point for both a real
// biometric device/agent and the in-app self-service Kiosk. The FIRST punch
// of the day for a staff member is treated as check-in (status computed
// from their shift + a grace period), the SECOND as check-out — both of
// these, AND every punch after them ("extra"), are appended to the day's
// StaffAttendance.punches[] so HR can see the full picture, not just the
// derived check-in/out.
// ============================================================================
export const recordBiometricPunch = asyncHandler(async (req, res) => {
  const { biometricId, timestamp, source } = req.body;
  if (!biometricId) {
    return res.status(400).json({ success: false, message: "biometricId is required." });
  }
  const punchSource = source === "kiosk" ? "kiosk" : "device";

  const punchTime = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(punchTime.getTime())) {
    return res.status(400).json({ success: false, message: "Invalid timestamp." });
  }

  const staff = await StaffProfile.findOne({ biometricId })
    .populate({ path: "personalInfo", select: "name" });
  if (!staff) {
    console.log(`[Biometric Punch] Unmatched biometricId "${biometricId}" at ${punchTime.toLocaleString()} [source: ${punchSource}] — no staff registered.`);
    return res.status(404).json({
      success: false,
      message: "No staff member is registered with this Biometric ID.",
    });
  }

  const day = startOfDay(punchTime);
  let record = await StaffAttendance.findOne({ staffId: staff._id, date: day });
  const staffName = staff.personalInfo?.name || staff.employeeId;

  if (!record) {
    const status = isLate(punchTime, staff.shift) ? "Late" : "Present";
    record = await StaffAttendance.create({
      staffId: staff._id,
      date: day,
      status,
      checkInTime: punchTime,
      markedBy: "Biometric",
      punches: [{ timestamp: punchTime, action: "check-in", source: punchSource }],
    });
    logPunch({ staff, staffName, punchTime, action: "check-in", source: punchSource });
    return res.status(201).json({
      success: true,
      message: `Welcome, ${staffName} — marked ${status}.`,
      data: { staffName, action: "check-in", status: record.status, time: record.checkInTime },
    });
  }

  if (!record.checkOutTime) {
    if (punchTime > record.checkInTime) {
      record.checkOutTime = punchTime;
    }
    record.punches.push({ timestamp: punchTime, action: "check-out", source: punchSource });
    await record.save();
    logPunch({ staff, staffName, punchTime, action: "check-out", source: punchSource });
    return res.status(200).json({
      success: true,
      message: `Goodbye, ${staffName} — checked out.`,
      data: { staffName, action: "check-out", status: record.status, time: record.checkOutTime },
    });
  }

  record.punches.push({ timestamp: punchTime, action: "extra", source: punchSource });
  await record.save();
  logPunch({ staff, staffName, punchTime, action: "extra", source: punchSource });
  return res.status(200).json({
    success: true,
    message: `${staffName} has already completed both punches for today.`,
    data: { staffName, action: "already-complete", status: record.status, time: record.checkOutTime },
  });
});
