import StaffProfile from "../models/StaffProfile.js";
import StaffLeaveRequest from "../models/StaffLeaveRequest.js";
import Department from "../../catalog/model/Department.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import {
  sendLeaveSubmittedForReviewEmail,
  sendLeaveDecisionEmail,
} from "../../core/utils/email.js";

const resolveStaffId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();
  return staffProfile?._id || null;
};

// Resolves the requesting teacher's own email, for the decision-notification
// emails HOD/HR review actions fire off.
const resolveRequesterEmail = async (staffId) => {
  const staff = await StaffProfile.findById(staffId)
    .select("userId")
    .populate({ path: "userId", select: "email" })
    .lean();
  return staff?.userId?.email || null;
};

// Resolves the head-of-department's email for a given department, mirroring
// the same populate chain hrStaffController.js uses for its onboarding
// HOD notification.
const resolveHodEmail = async (departmentId) => {
  if (!departmentId) return null;
  const dept = await Department.findById(departmentId)
    .select("headOfDepartment")
    .populate({ path: "headOfDepartment", populate: { path: "userId", select: "email" } });
  return dept?.headOfDepartment?.userId?.email || null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================================================
// SUBMIT LEAVE REQUEST — starts at Pending; HOD then HR review it in
// sequence (status chain: Pending -> Approved_HOD -> Approved_HR, or
// Rejected at either stage).
// ============================================================================
export const submitLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({
      success: false,
      message: "leaveType, startDate, endDate and reason are required.",
    });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id departmentId")
    .populate({ path: "personalInfo", select: "name" })
    .lean();
  const staffId = staffProfile?._id || null;
  if (!staffId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile. Contact HR to update your record.",
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return res.status(400).json({ success: false, message: "Invalid date range." });
  }
  const totalDays = Math.round((end - start) / MS_PER_DAY) + 1;

  const request = await StaffLeaveRequest.create({
    staffId,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason,
  });

  // Notify the HOD that a request is waiting on them — best-effort, must
  // never block the request itself from being created.
  try {
    const hodEmail = await resolveHodEmail(staffProfile.departmentId);
    if (hodEmail) {
      await sendLeaveSubmittedForReviewEmail(hodEmail, {
        employeeName: staffProfile.personalInfo?.name || "An employee",
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
      });
    }
  } catch (err) {
    console.error("Leave-submitted HOD notification email failed:", err);
  }

  res.status(201).json({ success: true, message: "Leave request submitted.", data: request });
});

// ============================================================================
// GET MY LEAVE REQUESTS
// ============================================================================
export const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  if (!staffId) {
    return res.status(200).json({ success: true, data: [] });
  }

  const requests = await StaffLeaveRequest.find({ staffId }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, data: requests });
});

// ============================================================================
// CANCEL LEAVE REQUEST — only your own, only while still Pending (once HOD
// or HR has acted on it, it's no longer cancellable by the requester).
// ============================================================================
export const cancelLeaveRequest = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  const request = await StaffLeaveRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Leave request not found." });
  }
  if (String(request.staffId) !== String(staffId)) {
    return res.status(403).json({ success: false, message: "This isn't your leave request." });
  }
  if (request.status !== "Pending") {
    return res.status(400).json({
      success: false,
      message: "Only a still-pending request can be withdrawn.",
    });
  }

  await request.deleteOne();
  res.status(200).json({ success: true, message: "Leave request withdrawn." });
});

// ============================================================================
// HOD REVIEW — the HOD's stage of the chain (Pending -> Approved_HOD /
// Rejected), scoped to the HOD's own department via resolveHodDepartment
// (admin is unscoped). Mirrors the HR stage below one step earlier.
// ============================================================================
export const getAllLeaveRequestsForHod = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.hodDepartmentId) {
    const staffInDept = await StaffProfile.find({ departmentId: req.hodDepartmentId })
      .select("_id")
      .lean();
    filter.staffId = { $in: staffInDept.map((s) => s._id) };
  }

  const requests = await StaffLeaveRequest.find(filter)
    .populate({
      path: "staffId",
      select: "employeeId departmentId userId personalInfo",
      populate: [
        { path: "personalInfo", select: "name" },
        { path: "departmentId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: requests });
});

export const reviewLeaveRequestAsHod = asyncHandler(async (req, res) => {
  const { decision, remarks } = req.body;
  if (!["Approved_HOD", "Rejected"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "decision must be Approved_HOD or Rejected.",
    });
  }

  const request = await StaffLeaveRequest.findById(req.params.id).populate({
    path: "staffId",
    select: "departmentId",
  });
  if (!request) {
    return res.status(404).json({ success: false, message: "Leave request not found." });
  }
  if (request.status !== "Pending") {
    return res.status(400).json({
      success: false,
      message: "This request has already been reviewed.",
    });
  }
  if (
    req.hodDepartmentId &&
    String(request.staffId?.departmentId) !== String(req.hodDepartmentId)
  ) {
    return res.status(403).json({
      success: false,
      message: "This request belongs to a different department.",
    });
  }

  const reviewerId = await resolveStaffId(req);
  request.status = decision;
  request.hodReview = { reviewedBy: reviewerId, remarks: remarks || "", reviewedAt: new Date() };
  await request.save();

  try {
    const requesterEmail = await resolveRequesterEmail(request.staffId?._id || request.staffId);
    if (requesterEmail) {
      await sendLeaveDecisionEmail(requesterEmail, {
        stage: "hod",
        decision,
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        remarks: request.hodReview.remarks,
      });
    }
  } catch (err) {
    console.error("Leave HOD-decision notification email failed:", err);
  }

  res.status(200).json({
    success: true,
    message:
      decision === "Approved_HOD"
        ? "Leave request approved and forwarded to HR."
        : "Leave request rejected.",
    data: request,
  });
});

// ============================================================================
// HR REVIEW — HR's stage of the chain (Approved_HOD -> Approved_HR /
// Rejected). Only actionable once the HOD has already approved.
// ============================================================================
export const getAllLeaveRequestsForHr = asyncHandler(async (req, res) => {
  const requests = await StaffLeaveRequest.find()
    .populate({
      path: "staffId",
      select: "employeeId departmentId userId personalInfo",
      populate: [
        { path: "personalInfo", select: "name" },
        { path: "departmentId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: requests });
});

export const reviewLeaveRequestAsHr = asyncHandler(async (req, res) => {
  const { decision, remarks } = req.body;
  if (!["Approved_HR", "Rejected"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "decision must be Approved_HR or Rejected.",
    });
  }

  const request = await StaffLeaveRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Leave request not found." });
  }
  if (request.status !== "Approved_HOD") {
    return res.status(400).json({
      success: false,
      message: "This request hasn't been approved by the HOD yet.",
    });
  }

  const reviewerId = await resolveStaffId(req);
  request.status = decision;
  request.hrReview = { reviewedBy: reviewerId, remarks: remarks || "", reviewedAt: new Date() };
  await request.save();

  try {
    const requesterEmail = await resolveRequesterEmail(request.staffId);
    if (requesterEmail) {
      await sendLeaveDecisionEmail(requesterEmail, {
        stage: "hr",
        decision,
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        remarks: request.hrReview.remarks,
      });
    }
  } catch (err) {
    console.error("Leave HR-decision notification email failed:", err);
  }

  res.status(200).json({
    success: true,
    message: decision === "Approved_HR" ? "Leave request approved." : "Leave request rejected.",
    data: request,
  });
});
