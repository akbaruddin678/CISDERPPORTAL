import { asyncHandler } from "../../core/utils/asyncHandler.js";
import ComplianceReport from "../models/ComplianceReport.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";

// A report that's still Draft/Pending past its due date reads as "Late" —
// computed at response time rather than stored, so it never drifts out of
// sync with the clock and no cron job is needed to flip it.
const withEffectiveStatus = (report) => {
  if (report.status !== "Submitted" && new Date(report.dueDate) < new Date()) {
    return { ...report, status: "Late" };
  }
  return report;
};

export const createComplianceReport = asyncHandler(async (req, res) => {
  const { title, category, authority, dueDate } = req.body;
  if (!title || !category || !authority || !dueDate) {
    return res.status(400).json({
      success: false,
      message: "title, category, authority and dueDate are required.",
    });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();

  const report = await ComplianceReport.create({
    title,
    category,
    authority,
    dueDate,
    createdBy: staffProfile?._id,
  });

  res.status(201).json({ success: true, message: "Compliance report created.", data: report });
});

export const getComplianceReports = asyncHandler(async (req, res) => {
  const reports = await ComplianceReport.find().sort({ dueDate: 1 }).lean();
  res.status(200).json({ success: true, data: reports.map(withEffectiveStatus) });
});

export const markReportSubmitted = asyncHandler(async (req, res) => {
  const report = await ComplianceReport.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: "Compliance report not found." });
  }

  if (req.file) {
    try {
      report.fileUrl = await uploadToR2(req.file, "compliance-reports");
    } catch {
      // Upload failing shouldn't block marking the report as submitted.
    }
  }

  report.status = "Submitted";
  report.submittedDate = new Date();
  await report.save();

  res.status(200).json({ success: true, message: "Report marked as submitted.", data: report });
});
