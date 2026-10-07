import mongoose from "mongoose";

// Document Vault — one record per uploaded file, categorized so HR can
// filter/audit ("show all unverified MS degrees") and so the API can
// hide sensitive categories (Financial/Contract) from non-hr/admin
// requesters. Object storage (Cloudflare R2) holds the actual file;
// this model only stores metadata + the file URL/key.
const staffDocumentSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      index: true,
    },
    docType: { type: String, required: true }, // e.g. "Transcript", "CNIC", "Employment Contract"
    category: {
      type: String,
      enum: [
        "Onboarding",
        "Academic",
        "Experience",
        "Identity",
        "Contract",
        "Financial",
        "Medical",
        "Compliance",
        "Exit",
        "Other",
      ],
      default: "Other",
    },
    fileUrl: { type: String, required: true },
    fileKey: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiryDate: { type: Date },
    // Set once an expiry alert has actually been emailed, so the daily
    // cron never re-sends for the same document.
    expiryAlertSentAt: { type: Date },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("StaffDocument", staffDocumentSchema);
