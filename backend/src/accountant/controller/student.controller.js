import { asyncHandler } from '../middleware/asyncHandler.js';
import { StudentService } from '../services/student.service.js';
import { StudentChallanService } from '../services/studentChallan.service.js';
import { ScholarshipService } from '../services/scholarship.service.js';
import StudentProfile from '../../student/models/StudentProfile.js';
import Admission from '../../admissions/model/Admission.js';

export const getChallanStatusBatch = asyncHandler(async (req, res) => {
  const { studentIds } = req.query;
  const ids = (studentIds || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const map = await StudentChallanService.getChallanStatusForStudents(ids);

  res.status(200).json({
    success: true,
    data: Object.fromEntries(map),
  });
});

// Same shape as getChallanStatusBatch above, but scoped to ONLY each
// student's admission-fee challan — used by the Admission Process
// pipeline, where "Fee Paid" must mean the admission fee specifically was
// paid, not that every challan the student has ever been issued happens
// to be paid too.
export const getAdmissionChallanStatusBatch = asyncHandler(async (req, res) => {
  const { studentIds } = req.query;
  const ids = (studentIds || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const map = await StudentChallanService.getAdmissionChallanStatusForStudents(ids);

  res.status(200).json({
    success: true,
    data: Object.fromEntries(map),
  });
});

// Bulk "does this student have an active scholarship" lookup — powers the
// Student Directory export's Scholarship/Scholarship Name columns and the
// "scholarship students only" filter without one DB round trip per row.
export const getScholarshipStatusBatch = asyncHandler(async (req, res) => {
  const { studentIds } = req.query;
  const ids = (studentIds || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const map = await ScholarshipService.getBulkActiveScholarships(ids);

  res.status(200).json({
    success: true,
    data: Object.fromEntries(map),
  });
});

// Real-time "New Admissions" snapshot for the accountant dashboard/list —
// same "first semester = new admission" convention used everywhere else
// (useNewAdmissions.js, StudentAdmissionController.jsx), split into
// College (Program.level === "HSSC") vs University (everything else), plus
// how many of those arrived in the last 2 days for the dashboard widget.
export const getNewAdmissionsSummary = asyncHandler(async (req, res) => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  // Restricted to an actually-accepted Admission — the exact same
  // "onlyAcceptedAdmission" convention used by getAllStudents and now by
  // StudentService.getStudents (see student.service.js), so this summary
  // can never disagree with the table it sits above. Using the broader
  // `createdFromApplicationId != null` check here previously counted a
  // handful of legacy/edge-case profiles the table correctly excludes.
  const acceptedApplications = await Admission.find({ status: 'accepted' })
    .select('_id')
    .lean();
  const acceptedIds = acceptedApplications.map((a) => a._id);

  const admissions = await StudentProfile.find({
    isTrashed: { $ne: true },
    createdFromApplicationId: { $in: acceptedIds },
  })
    .select('_id programId semesterId createdAt')
    .populate('programId', 'level')
    .populate('semesterId', 'number')
    .lean();

  const newAdmissions = admissions.filter(
    (s) => (s.semesterId?.number || 1) === 1,
  );
  const last2Days = newAdmissions.filter(
    (s) => new Date(s.createdAt) >= twoDaysAgo,
  ).length;

  const universityIds = newAdmissions
    .filter((s) => s.programId?.level !== 'HSSC')
    .map((s) => s._id.toString());
  const collegeIds = newAdmissions
    .filter((s) => s.programId?.level === 'HSSC')
    .map((s) => s._id.toString());

  const [universityStatusMap, collegeStatusMap] = await Promise.all([
    StudentChallanService.getChallanStatusForStudents(universityIds),
    StudentChallanService.getChallanStatusForStudents(collegeIds),
  ]);

  const bucketize = (ids, statusMap) => {
    let generated = 0;
    let notGenerated = 0;
    let overdue = 0;
    ids.forEach((id) => {
      const status = statusMap.get(id)?.challanStatus || 'not_generated';
      if (status === 'not_generated') notGenerated += 1;
      else generated += 1;
      if (status === 'overdue') overdue += 1;
    });
    return { total: ids.length, generated, notGenerated, overdue };
  };

  res.status(200).json({
    success: true,
    data: {
      last2Days,
      university: bucketize(universityIds, universityStatusMap),
      college: bucketize(collegeIds, collegeStatusMap),
    },
  });
});

export const reAdmitStudent = asyncHandler(async (req, res) => {
  const student = await StudentChallanService.reAdmitStudent(
    req.params.id,
    req.user?._id,
  );

  res.status(200).json({
    success: true,
    message: 'Student re-admitted successfully.',
    data: student,
  });
});

export const getStudents = asyncHandler(async (req, res) => {

  const result = await StudentService.getStudents(req.query);

  res.status(200).json({
    success: true,
    ...result
  });
});

export const updateAdmissionReviewStatus = asyncHandler(async (req, res) => {
  const { completed } = req.body;

  const student = await StudentService.setAdmissionReviewStatus(
    req.params.id,
    completed,
    req.user?._id,
  );

  res.status(200).json({
    success: true,
    message: completed
      ? "Marked as completed."
      : "Marked as pending.",
    data: student,
  });
});

export const getStudentDetails = asyncHandler(async (req, res) => {
  const student = await StudentService.getDetails(req.params.id);
  
  res.status(200).json({
    success: true,
    data: student
  });
});

export const getStudentsForChallan = asyncHandler(async (req, res) => {
  const students = await StudentService.getForChallanGeneration(req.query);
  
  res.status(200).json({
    success: true,
    data: students
  });
});

export const getStudentsByProgram = asyncHandler(async (req, res) => {
  const students = await StudentService.getStudentsByProgram(req.params.programId, req.query);
  
  res.status(200).json({
    success: true,
    data: students
  });
});

export const getStudentAcademicInfo = asyncHandler(async (req, res) => {
  const academicInfo = await StudentService.getStudentAcademicInfo(req.params.id);
  
  res.status(200).json({
    success: true,
    data: academicInfo
  });
});

export const validateStudentsForChallan = asyncHandler(async (req, res) => {
  const result = await StudentService.validateStudentsForChallan(req.body.studentIds, req.body.academicFilters);
  
  res.status(200).json({
    success: true,
    data: result
  });
});