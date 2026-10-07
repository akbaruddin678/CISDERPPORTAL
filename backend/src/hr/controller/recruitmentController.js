import StaffProfile from "../../staff/models/StaffProfile.js";
import JobPosting from "../../staff/models/JobPosting.js";
import JobApplication from "../../staff/models/JobApplication.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

// ============================================================================
// JOB POSTINGS
// ============================================================================
export const createJobPosting = asyncHandler(async (req, res) => {
  const { title, departmentId, employmentType, description, requirements, applicationDeadline } =
    req.body;
  if (!title || !employmentType || !description || !applicationDeadline) {
    return res.status(400).json({
      success: false,
      message: "title, employmentType, description and applicationDeadline are required.",
    });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();

  const posting = await JobPosting.create({
    title,
    departmentId: departmentId || null,
    employmentType,
    description,
    requirements: requirements || [],
    applicationDeadline,
    postedBy: staffProfile?._id || null,
  });

  res.status(201).json({ success: true, message: "Job posting created.", data: posting });
});

export const getJobPostings = asyncHandler(async (req, res) => {
  const postings = await JobPosting.find()
    .populate("departmentId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const postingIds = postings.map((p) => p._id);
  const counts = await JobApplication.aggregate([
    { $match: { jobId: { $in: postingIds } } },
    { $group: { _id: "$jobId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = postings.map((p) => ({
    ...p,
    applicationCount: countMap.get(String(p._id)) || 0,
  }));

  res.status(200).json({ success: true, data });
});

export const updateJobPostingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Draft", "Published", "Closed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }

  const posting = await JobPosting.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );
  if (!posting) {
    return res.status(404).json({ success: false, message: "Job posting not found." });
  }

  res.status(200).json({ success: true, message: "Job posting updated.", data: posting });
});

// ============================================================================
// JOB APPLICATIONS — manual entry by HR (no public apply portal exists).
// ============================================================================
export const addJobApplication = asyncHandler(async (req, res) => {
  const { jobId, applicantName, email, phone, resumeUrl, coverLetter } = req.body;
  if (!jobId || !applicantName || !email || !phone || !resumeUrl) {
    return res.status(400).json({
      success: false,
      message: "jobId, applicantName, email, phone and resumeUrl are required.",
    });
  }

  const application = await JobApplication.create({
    jobId,
    applicantName,
    email,
    phone,
    resumeUrl,
    coverLetter,
  });

  res.status(201).json({ success: true, message: "Application recorded.", data: application });
});

export const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ success: false, message: "jobId is required." });
  }

  const applications = await JobApplication.find({ jobId }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, data: applications });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, interviewDate, interviewerNotes } = req.body;
  const validStatuses = [
    "Applied",
    "Shortlisted",
    "Interview Scheduled",
    "Offered",
    "Hired",
    "Rejected",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }

  const application = await JobApplication.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  application.status = status;
  if (interviewDate !== undefined) application.interviewDate = interviewDate;
  if (interviewerNotes !== undefined) application.interviewerNotes = interviewerNotes;
  await application.save();

  res.status(200).json({ success: true, message: "Application updated.", data: application });
});
