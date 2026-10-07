import User from "../../user/model/User.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import StaffExitRecord from "../../staff/models/StaffExitRecord.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

const ALL_CLEARANCES_DONE = (clearances = {}) =>
  Boolean(
    clearances.itDepartment && clearances.library && clearances.finance && clearances.departmentHod,
  );

// StaffProfile.status has no "Retired"/"Contract Expiry" value of its own
// — those map to "Resigned" as the closest fit; only an actual
// Termination maps to "Terminated".
const EXIT_TYPE_TO_STAFF_STATUS = {
  Termination: "Terminated",
  Resignation: "Resigned",
  Retirement: "Resigned",
  "Contract Expiry": "Resigned",
};

// ============================================================================
// CREATE EXIT RECORD — one per staff member (model enforces staffId unique).
// ============================================================================
export const createExitRecord = asyncHandler(async (req, res) => {
  const { staffId, type, noticeGivenDate, lastWorkingDay, reason } = req.body;
  if (!staffId || !type || !noticeGivenDate || !lastWorkingDay) {
    return res.status(400).json({
      success: false,
      message: "staffId, type, noticeGivenDate and lastWorkingDay are required.",
    });
  }

  const existing = await StaffExitRecord.findOne({ staffId });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "An exit record already exists for this staff member.",
    });
  }

  const record = await StaffExitRecord.create({
    staffId,
    type,
    noticeGivenDate,
    lastWorkingDay,
    reason,
  });

  res.status(201).json({ success: true, message: "Exit record created.", data: record });
});

// ============================================================================
// GET EXIT RECORDS
// ============================================================================
export const getExitRecords = asyncHandler(async (req, res) => {
  const records = await StaffExitRecord.find()
    .populate({
      path: "staffId",
      select: "employeeId departmentId personalInfo",
      populate: [
        { path: "personalInfo", select: "name" },
        { path: "departmentId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: records });
});

// ============================================================================
// UPDATE EXIT RECORD — toggle clearances, notes, settlement. Once every
// clearance flag is true, BOTH the login (User.status) and the employee
// record itself (StaffProfile.status) are updated — previously only the
// login was deactivated, so an exited employee kept showing up as
// "Active" everywhere (dashboard KPI, Staff Directory, department
// breakdowns) forever.
// ============================================================================
export const updateExitRecord = asyncHandler(async (req, res) => {
  const { clearances, exitInterviewNotes, finalSettlementPaid, finalSettlementAmount } = req.body;

  const record = await StaffExitRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: "Exit record not found." });
  }

  if (clearances) {
    Object.entries(clearances).forEach(([key, value]) => {
      record.clearances[key] = value;
    });
  }
  if (exitInterviewNotes !== undefined) record.exitInterviewNotes = exitInterviewNotes;
  if (finalSettlementAmount !== undefined) record.finalSettlementAmount = finalSettlementAmount;
  if (finalSettlementPaid !== undefined) record.finalSettlementPaid = finalSettlementPaid;
  await record.save();

  if (ALL_CLEARANCES_DONE(record.clearances)) {
    const staff = await StaffProfile.findById(record.staffId).select("userId status");
    if (staff) {
      // "inactive" isn't a value in User.status's enum (active/disabled/
      // pending_verification) — findByIdAndUpdate skips validators by
      // default, so this previously wrote a value outside the declared
      // enum with no error.
      await User.findByIdAndUpdate(staff.userId, { status: "disabled" });
      const newStatus = EXIT_TYPE_TO_STAFF_STATUS[record.type] || "Resigned";
      if (staff.status !== newStatus) {
        staff.status = newStatus;
        await staff.save();
      }
    }
  }

  res.status(200).json({ success: true, message: "Exit record updated.", data: record });
});
