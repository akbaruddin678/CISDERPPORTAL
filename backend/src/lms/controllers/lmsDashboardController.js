import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";

// GET /api/lms/announcements
export const getAnnouncements = asyncHandler(async (req, res) => {
  const now = new Date();
  const announcements = await Announcement.find({
    active: true,
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      {
        $or: [
          { audienceRoles: "student" },
          { recipientStudentIds: req.user.id },
          // Notices created before targeted audiences existed were student notices.
          { audienceRoles: { $exists: false } },
        ],
      },
    ],
  })
    .select("title summary body type date createdAt expiresAt")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.status(200).json({
    success: true,
    data: announcements,
  });
});

// GET /api/lms/events/upcoming
export const getUpcomingEvents = asyncHandler(async (req, res) => {
  // Fetch top 5 active events where the date is in the future, sorted closest first
  const events = await Event.find({
    active: true,
    time: { $gte: new Date() }, // Only future events
  })
    .sort({ time: 1 }) // Closest dates first
    .limit(5)
    .lean();

  res.status(200).json({
    success: true,
    data: events,
  });
});
