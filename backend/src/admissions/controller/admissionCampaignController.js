import StaffProfile from "../../staff/models/StaffProfile.js";
import AdmissionCampaign from "../model/AdmissionCampaign.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

// ============================================================================
// CREATE CAMPAIGN — just a title; start/end dates are computed server-side
// (fixed 10-day window from creation), never trusted from the client.
// ============================================================================
export const createCampaign = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: "title is required." });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();

  const campaign = await AdmissionCampaign.create({
    title: title.trim(),
    createdBy: staffProfile?._id || null,
  });

  res.status(201).json({ success: true, message: "Admission campaign created.", data: campaign });
});

// ============================================================================
// LIST CAMPAIGNS — with a computed isActive flag for the Registrar's own
// view (separate from the public single-active-campaign check below).
// ============================================================================
export const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await AdmissionCampaign.find().sort({ createdAt: -1 }).lean();
  const now = Date.now();
  const data = campaigns.map((c) => ({
    ...c,
    isActive: new Date(c.endDate).getTime() >= now,
  }));

  res.status(200).json({ success: true, data });
});

// ============================================================================
// PUBLIC — the single currently-active campaign (if any), for the landing
// page announcement modal. No auth, so only non-sensitive fields matter —
// the schema only ever stores a title and two dates.
// ============================================================================
export const getActiveCampaignPublic = asyncHandler(async (req, res) => {
  const campaign = await AdmissionCampaign.findOne({ endDate: { $gte: new Date() } })
    .sort({ createdAt: -1 })
    .select("title startDate endDate")
    .lean();

  res.status(200).json({ success: true, data: campaign || null });
});
