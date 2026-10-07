import mongoose from "mongoose";

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

// A named admission window (e.g. "Fall 2026") that stays open for a fixed
// 10 days from creation — no seat/eligibility config, just an announcement
// window the public landing page checks for.
const admissionCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    startDate: { type: Date, default: Date.now },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + TEN_DAYS_MS),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AdmissionCampaign", admissionCampaignSchema);
