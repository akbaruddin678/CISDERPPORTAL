import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Announcement from "../../lms/models/Announcement.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import User from "../../user/model/User.js";

const VALID_ROLES = new Set(["student", "teacher"]);
const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const asPage = (value, fallback) => Math.max(parseInt(value, 10) || fallback, 1);

const visibleQuery = ({ role, studentId, staffId }) => ({
  active: true,
  $and: [
    { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
    {
      $or: [
        { audienceRoles: role },
        ...(studentId ? [{ recipientStudentIds: studentId }] : []),
        ...(staffId ? [{ recipientStaffIds: staffId }] : []),
      ],
    },
  ],
});

export const createNotification = asyncHandler(async (req, res) => {
  const {
    title,
    body,
    type = "General",
    audienceRoles = [],
    recipientStudentIds = [],
    recipientStaffIds = [],
    expiresAt = null,
  } = req.body;
  const roles = [...new Set(audienceRoles.map(String))];
  const studentIds = [...new Set(recipientStudentIds.map(String))];
  const staffIds = [...new Set(recipientStaffIds.map(String))];

  if (String(title || "").trim().length < 3 || String(body || "").trim().length < 3) {
    return res.status(400).json({ success: false, message: "Title and message must each contain at least 3 characters." });
  }
  if (roles.some((role) => !VALID_ROLES.has(role))) {
    return res.status(400).json({ success: false, message: "Notifications can only target students or teachers." });
  }
  if (![...studentIds, ...staffIds].every(mongoose.isValidObjectId)) {
    return res.status(400).json({ success: false, message: "One or more selected recipients are invalid." });
  }
  if (!roles.length && !studentIds.length && !staffIds.length) {
    return res.status(400).json({ success: false, message: "Select at least one recipient role or individual person." });
  }
  if (expiresAt && (Number.isNaN(new Date(expiresAt).getTime()) || new Date(expiresAt) <= new Date())) {
    return res.status(400).json({ success: false, message: "Expiry must be a valid future date and time." });
  }

  const selectedStaff = staffIds.length
    ? await StaffProfile.find({ _id: { $in: staffIds }, status: { $nin: ["Resigned", "Terminated"] } }).select("userId").lean()
    : [];
  const [studentCount, teacherUserCount] = await Promise.all([
    StudentProfile.countDocuments({ _id: { $in: studentIds }, isTrashed: { $ne: true } }),
    User.countDocuments({ _id: { $in: selectedStaff.map((staff) => staff.userId) }, roles: "teacher", status: "active" }),
  ]);
  if (studentCount !== studentIds.length || selectedStaff.length !== staffIds.length || teacherUserCount !== staffIds.length) {
    return res.status(409).json({ success: false, message: "A selected recipient is no longer active or available." });
  }

  const notification = await Announcement.create({
    title: title.trim(),
    summary: body.trim().slice(0, 220),
    body: body.trim(),
    type,
    audienceRoles: roles,
    recipientStudentIds: studentIds,
    recipientStaffIds: staffIds,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    createdBy: req.user._id,
    active: true,
    date: new Date(),
  });

  res.status(201).json({ success: true, message: "Notification published to the selected audience.", data: notification });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const page = asPage(req.query.page, 1);
  const limit = Math.min(asPage(req.query.limit, 10), 50);
  const [data, total] = await Promise.all([
    Announcement.find({ createdBy: req.user._id })
      .populate("createdBy", "email roles")
      .select("title summary body type audienceRoles recipientStudentIds recipientStaffIds active expiresAt createdAt createdBy")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Announcement.countDocuments({ createdBy: req.user._id }),
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

export const setNotificationActive = asyncHandler(async (req, res) => {
  const notification = await Announcement.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    { $set: { active: Boolean(req.body.active) } },
    { new: true },
  );
  if (!notification) return res.status(404).json({ success: false, message: "Notification not found or not owned by your office." });
  res.json({ success: true, message: notification.active ? "Notification restored." : "Notification withdrawn.", data: notification });
});

export const searchRecipients = asyncHandler(async (req, res) => {
  const role = VALID_ROLES.has(req.query.role) ? req.query.role : "student";
  const search = String(req.query.search || "").trim();
  const page = asPage(req.query.page, 1);
  const limit = Math.min(asPage(req.query.limit, 12), 30);
  const matcher = search ? new RegExp(escapeRegex(search), "i") : null;

  const pipeline = role === "student"
    ? [
        { $match: { isTrashed: { $ne: true }, status: { $nin: ["withdrawn", "struck_off_time_barred"] } } },
        { $lookup: { from: "personalinfos", localField: "_id", foreignField: "studentId", as: "person" } },
        { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
        ...(matcher ? [{ $match: { $or: [{ studentId: matcher }, { "person.fullName": matcher }, { "person.email": matcher }] } }] : []),
        { $project: { _id: 1, role: { $literal: "student" }, name: { $ifNull: ["$person.fullName", "Unnamed student"] }, identifier: "$studentId", email: "$person.email" } },
      ]
    : [
        { $match: { status: { $nin: ["Resigned", "Terminated"] } } },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $match: { "user.status": "active", "user.roles": "teacher" } },
        { $lookup: { from: "people", localField: "userId", foreignField: "userId", as: "person" } },
        { $unwind: { path: "$person", preserveNullAndEmptyArrays: true } },
        ...(matcher ? [{ $match: { $or: [{ employeeId: matcher }, { "person.name": matcher }, { "user.email": matcher }] } }] : []),
        { $project: { _id: 1, role: { $literal: "teacher" }, name: { $ifNull: ["$person.name", "Unnamed teacher"] }, identifier: "$employeeId", email: "$user.email" } },
      ];

  const [result] = await (role === "student" ? StudentProfile : StaffProfile).aggregate([
    ...pipeline,
    { $sort: { name: 1, identifier: 1 } },
    { $facet: { data: [{ $skip: (page - 1) * limit }, { $limit: limit }], meta: [{ $count: "total" }] } },
  ]);
  const total = result?.meta?.[0]?.total || 0;
  res.json({ success: true, data: result?.data || [], pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

export const getMyTeacherNotifications = asyncHandler(async (req, res) => {
  const staff = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();
  const data = await Announcement.find(visibleQuery({ role: "teacher", staffId: staff?._id }))
    .select("title summary body type date createdAt expiresAt")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ success: true, data });
});
