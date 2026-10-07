import { asyncHandler } from '../middleware/asyncHandler.js';
import { ScholarshipService } from '../services/scholarship.service.js';

// Scholarship Plans
export const createScholarshipPlan = asyncHandler(async (req, res) => {
  const planData = {
    ...req.body,
    createdBy: req.user._id // assuming authenticated user
  };
  const plan = await ScholarshipService.createPlan(planData);
  
  res.status(201).json({
    success: true,
    message: 'Scholarship plan created successfully',
    data: plan
  });
});

export const getScholarshipPlans = asyncHandler(async (req, res) => {
  const result = await ScholarshipService.getPlans(req.query);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getScholarshipPlanById = asyncHandler(async (req, res) => {
  const plan = await ScholarshipService.getPlanById(req.params.id);
  res.status(200).json({
    success: true,
    data: plan,
  });
});

export const updateScholarshipPlan = asyncHandler(async (req, res) => {
  const plan = await ScholarshipService.updatePlan(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Scholarship plan updated successfully',
    data: plan
  });
});

export const deleteScholarshipPlan = asyncHandler(async (req, res) => {
  await ScholarshipService.deletePlan(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Scholarship plan deleted successfully'
  });
});

export const toggleScholarshipPlanStatus = asyncHandler(async (req, res) => {
  const { active } = req.body;
  const plan = await ScholarshipService.togglePlanStatus(req.params.id, active);
  
  res.status(200).json({
    success: true,
    message: `Scholarship plan ${active ? 'activated' : 'deactivated'} successfully`,
    data: plan
  });
});

// Student Applications
export const applyForScholarship = asyncHandler(async (req, res) => {
  const application = await ScholarshipService.applyForScholarship(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Scholarship application submitted successfully',
    data: application
  });
});

export const getStudentApplications = asyncHandler(async (req, res) => {
  const result = await ScholarshipService.getStudentApplications(req.query);
  
  res.status(200).json({
    success: true,
    ...result
  });
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await ScholarshipService.getApplicationById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: application
  });
});

export const approveScholarship = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    approvedBy: req.user._id // assuming authenticated user
  };
  const application = await ScholarshipService.approveApplication(req.params.id, data);
  
  res.status(200).json({
    success: true,
    message: 'Scholarship approved successfully',
    data: application
  });
});

export const rejectScholarship = asyncHandler(async (req, res) => {
  const application = await ScholarshipService.rejectApplication(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Scholarship application rejected',
    data: application
  });
});

export const revokeScholarship = asyncHandler(async (req, res) => {
  const application = await ScholarshipService.revokeApplication(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Scholarship revoked successfully',
    data: application
  });
});

// Student-specific endpoints
export const getStudentScholarships = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const applications = await ScholarshipService.getApplicationsByStudent(studentId, req.query);
  
  res.status(200).json({
    success: true,
    data: applications
  });
});

// Check eligibility
export const checkEligibility = asyncHandler(async (req, res) => {
  const { studentId, scholarshipPlanId } = req.body;
  const eligibility = await ScholarshipService.checkEligibility(studentId, scholarshipPlanId);
  
  res.status(200).json({
    success: true,
    data: eligibility
  });
});

// Get available plans for student
export const getAvailablePlans = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const plans = await ScholarshipService.getAvailablePlans(studentId, req.query);

  res.status(200).json({
    success: true,
    data: plans
  });
});

// Tuition/fee context for a student — powers the Assign/Approve flows'
// fee preview and "set up fee" shortcut.
export const getStudentFeeContext = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const context = await ScholarshipService.getStudentFeeContext(studentId);

  res.status(200).json({
    success: true,
    data: context,
  });
});

// Statistics
export const getScholarshipStats = asyncHandler(async (req, res) => {
  const stats = await ScholarshipService.getStatistics();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});