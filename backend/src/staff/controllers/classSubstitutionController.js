import StaffProfile from "../models/StaffProfile.js";
import ClassSubstitution from "../models/ClassSubstitution.js";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

const resolveStaffId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();
  return staffProfile?._id || null;
};

const populateRequest = (query) =>
  query
    .populate({
      path: "courseAssignmentId",
      populate: [
        { path: "courseId", select: "title code" },
        { path: "semesterId", select: "number" },
      ],
    })
    .populate({
      path: "requestingTeacherId",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .populate({
      path: "substituteTeacherId",
      populate: { path: "personalInfo", select: "fullName" },
    });

// ============================================================================
// CREATE SUBSTITUTION REQUEST — only for a course assignment you actually
// teach. Starts "Requested" with no substitute assigned — any other
// teacher can accept it, then HOD gives final approval (that review screen
// isn't built yet — requests visibly sit at whatever stage they reach).
// ============================================================================
export const createSubstitutionRequest = asyncHandler(async (req, res) => {
  const { courseAssignmentId, dateOfAbsence, reason } = req.body;
  if (!courseAssignmentId || !dateOfAbsence || !reason) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId, dateOfAbsence and reason are required.",
    });
  }

  const staffId = await resolveStaffId(req);
  if (!staffId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile. Contact HR to update your record.",
    });
  }

  const assignment = await CourseAssignment.findById(courseAssignmentId).lean();
  if (!assignment || String(assignment.instructorId) !== String(staffId)) {
    return res.status(403).json({
      success: false,
      message: "You can only request substitution for a course you teach.",
    });
  }

  const request = await ClassSubstitution.create({
    requestingTeacherId: staffId,
    courseAssignmentId,
    dateOfAbsence,
    reason,
  });

  res.status(201).json({ success: true, message: "Substitution request created.", data: request });
});

// ============================================================================
// MY REQUESTS — substitution requests I created.
// ============================================================================
export const getMySubstitutionRequests = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  if (!staffId) return res.status(200).json({ success: true, data: [] });

  const requests = await populateRequest(
    ClassSubstitution.find({ requestingTeacherId: staffId }).sort({ dateOfAbsence: -1 }),
  );
  res.status(200).json({ success: true, data: requests });
});

// ============================================================================
// OPEN REQUESTS — other teachers' requests still needing a substitute.
// ============================================================================
export const getOpenSubstitutionRequests = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  if (!staffId) return res.status(200).json({ success: true, data: [] });

  const requests = await populateRequest(
    ClassSubstitution.find({
      status: "Requested",
      substituteTeacherId: null,
      requestingTeacherId: { $ne: staffId },
    }).sort({ dateOfAbsence: 1 }),
  );
  res.status(200).json({ success: true, data: requests });
});

// ============================================================================
// ACCEPT — another teacher volunteers to cover the class.
// ============================================================================
export const acceptSubstitutionRequest = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  const request = await ClassSubstitution.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Substitution request not found." });
  }
  if (request.status !== "Requested" || request.substituteTeacherId) {
    return res.status(400).json({
      success: false,
      message: "This request already has a substitute or is no longer open.",
    });
  }
  if (String(request.requestingTeacherId) === String(staffId)) {
    return res.status(400).json({
      success: false,
      message: "You can't accept your own substitution request.",
    });
  }

  request.substituteTeacherId = staffId;
  request.status = "Accepted By Substitute";
  await request.save();

  res.status(200).json({ success: true, message: "You've accepted this class coverage.", data: request });
});

// ============================================================================
// CANCEL — only your own, only while still open (no substitute yet).
// ============================================================================
export const cancelSubstitutionRequest = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  const request = await ClassSubstitution.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ success: false, message: "Substitution request not found." });
  }
  if (String(request.requestingTeacherId) !== String(staffId)) {
    return res.status(403).json({ success: false, message: "This isn't your request." });
  }
  if (request.status !== "Requested") {
    return res.status(400).json({
      success: false,
      message: "This request already has a substitute and can't be cancelled here.",
    });
  }

  await request.deleteOne();
  res.status(200).json({ success: true, message: "Substitution request cancelled." });
});
