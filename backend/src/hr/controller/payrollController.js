import mongoose from "mongoose";
import PayrollSlip from "../../staff/models/PayrollSlip.js";
import StaffEmploymentInfo from "../../staff/models/StaffEmploymentInfo.js";
import StaffAttendance from "../../staff/models/StaffAttendance.js";
import StaffLeaveRequest from "../../staff/models/StaffLeaveRequest.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

const computeNetPayable = (basicSalary, allowances = [], deductions = []) => {
  const allowanceTotal = allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const deductionTotal = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  return Number(basicSalary) + allowanceTotal - deductionTotal;
};

const ALLOWANCE_LABELS = {
  phdAllowance: "PhD Allowance",
  researchAllowance: "Research Allowance",
  housingAllowance: "Housing Allowance",
  transportAllowance: "Transport Allowance",
};

// ============================================================================
// SUGGEST PAYROLL SLIP — read-only pre-fill for the "Generate Slip" form.
// Pulls basicSalary/allowances from StaffEmploymentInfo (the Profile-page
// source of truth, previously never read here) and estimates a deduction
// for unpaid absences (StaffAttendance) + unpaid leave (StaffLeaveRequest)
// for the given month. HR can still freely edit/remove any suggested line
// before saving — this never writes anything.
// ============================================================================
export const suggestPayrollSlip = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ success: false, message: "month and year are required." });
  }

  const employmentInfo = await StaffEmploymentInfo.findOne({ staffId }).lean();
  const basicSalary = employmentInfo?.basicSalary || 0;

  const allowances = Object.entries(employmentInfo?.allowances || {})
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({ name: ALLOWANCE_LABELS[key] || key, amount }));

  const monthStart = new Date(Number(year), Number(month) - 1, 1);
  const monthEnd = new Date(Number(year), Number(month), 1);
  const staffObjectId = new mongoose.Types.ObjectId(staffId);
  const perDayRate = basicSalary > 0 ? basicSalary / 30 : 0;

  const [absentCount, unpaidLeaveAgg] = await Promise.all([
    StaffAttendance.countDocuments({
      staffId: staffObjectId,
      date: { $gte: monthStart, $lt: monthEnd },
      status: "Absent",
    }),
    StaffLeaveRequest.aggregate([
      {
        $match: {
          staffId: staffObjectId,
          leaveType: "Unpaid",
          status: "Approved_HR",
          startDate: { $lt: monthEnd },
          endDate: { $gte: monthStart },
        },
      },
      { $group: { _id: null, totalDays: { $sum: "$totalDays" } } },
    ]),
  ]);
  const unpaidLeaveDays = unpaidLeaveAgg[0]?.totalDays || 0;

  const deductions = [];
  if (absentCount > 0) {
    deductions.push({
      name: `Unpaid Absence (${absentCount} day${absentCount === 1 ? "" : "s"})`,
      amount: Math.round(perDayRate * absentCount),
    });
  }
  if (unpaidLeaveDays > 0) {
    deductions.push({
      name: `Unpaid Leave (${unpaidLeaveDays} day${unpaidLeaveDays === 1 ? "" : "s"})`,
      amount: Math.round(perDayRate * unpaidLeaveDays),
    });
  }

  res.status(200).json({
    success: true,
    data: { basicSalary, allowances, deductions, bankDetails: employmentInfo?.bankDetails || null },
  });
});

// ============================================================================
// GENERATE PAYROLL SLIP — one per staff per month (model enforces the
// unique {staffId,month,year} index), netPayable computed server-side.
// ============================================================================
export const generatePayrollSlip = asyncHandler(async (req, res) => {
  const { staffId, month, year, basicSalary, allowances = [], deductions = [] } = req.body;
  if (!staffId || !month || !year || basicSalary === undefined) {
    return res.status(400).json({
      success: false,
      message: "staffId, month, year and basicSalary are required.",
    });
  }

  const existing = await PayrollSlip.findOne({ staffId, month, year });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "A payroll slip for this staff member and month already exists.",
    });
  }

  const netPayable = computeNetPayable(basicSalary, allowances, deductions);
  const slip = await PayrollSlip.create({
    staffId,
    month,
    year,
    basicSalary,
    allowances,
    deductions,
    netPayable,
  });

  res.status(201).json({ success: true, message: "Payroll slip generated.", data: slip });
});

// ============================================================================
// GET PAYROLL SLIPS — filterable by month/year, populated with staff name.
// ============================================================================
export const getPayrollSlips = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const query = {};
  if (month) query.month = Number(month);
  if (year) query.year = Number(year);

  const slips = await PayrollSlip.find(query)
    .populate({
      path: "staffId",
      select: "employeeId departmentId personalInfo",
      populate: [
        { path: "personalInfo", select: "name" },
        { path: "departmentId", select: "name" },
      ],
    })
    .sort({ year: -1, month: -1 })
    .lean();

  res.status(200).json({ success: true, data: slips });
});

// ============================================================================
// UPDATE PAYROLL STATUS — Generated -> Approved -> Paid.
// ============================================================================
export const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { status, paymentDate, transactionId } = req.body;
  if (!["Generated", "Approved", "Paid"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }

  const slip = await PayrollSlip.findById(req.params.id);
  if (!slip) {
    return res.status(404).json({ success: false, message: "Payroll slip not found." });
  }

  slip.status = status;
  if (status === "Paid") {
    slip.paymentDate = paymentDate || new Date();
    slip.transactionId = transactionId || slip.transactionId;
  }
  await slip.save();

  res.status(200).json({ success: true, message: "Payroll slip updated.", data: slip });
});
