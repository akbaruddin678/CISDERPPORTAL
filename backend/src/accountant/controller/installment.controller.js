import { asyncHandler } from '../middleware/asyncHandler.js';
import { InstallmentService } from '../services/installment.service.js';
import StudentFeePreference from "../model/StudentFeePreference.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import mongoose from 'mongoose';

export const createInstallmentPlan = asyncHandler(async (req, res) => {
  
  const plan = await InstallmentService.createPlan(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Installment plan created successfully',
    data: plan
  });
});

export const getInstallmentPlans = asyncHandler(async (req, res) => {

  const result = await InstallmentService.getPlans(req.query);
  
  res.status(200).json({
    success: true,
    ...result
  });
});

export const assignInstallment = asyncHandler(async (req, res) => {
  const assignment = await InstallmentService.assignToStudent(req.body);
  
  res.status(200).json({
    success: true,
    message: 'Installment plan assigned successfully',
    data: assignment
  });
});

// controllers/installment.controller.js
export const getStudentInstallments = asyncHandler(async (req, res) => {


  try {
    const { studentId } = req.params;
    


    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    const installments = await InstallmentService.getStudentInstallments(studentId);
    
    res.status(200).json({
      success: true,
      data: installments // Return as array directly
    });

  } catch (error) {
    // console.error('❌ Error fetching student installments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student installments',
      error: error.message
    });
  }
});

export const getInstallmentPlan = asyncHandler(async (req, res) => {
  const plan = await InstallmentService.getPlan(req.params.id);
  
  res.status(200).json({
    success: true,
    data: plan
  });
});

export const updateInstallmentPlan = asyncHandler(async (req, res) => {
  const plan = await InstallmentService.updatePlan(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: 'Installment plan updated successfully',
    data: plan
  });
});

export const getAssignmentDetails = asyncHandler(async (req, res) => {
  const assignment = await InstallmentService.getAssignmentDetails(req.params.assignmentId);
  
  res.status(200).json({
    success: true,
    data: assignment
  });
});

export const updateInstallmentPayment = asyncHandler(async (req, res) => {
  const assignment = await InstallmentService.updateInstallmentPayment(
    req.params.assignmentId,
    req.params.installmentNumber,
    req.body
  );
  
  res.status(200).json({
    success: true,
    message: 'Installment payment recorded successfully',
    data: assignment
  });
});

export const removeInstallmentAssignment = asyncHandler(async (req, res) => {
  await InstallmentService.removeAssignment(req.params.assignmentId);
  
  res.status(200).json({
    success: true,
    message: 'Installment assignment removed successfully'
  });
});

export const saveStudentPreferences = asyncHandler(async (req, res) => {
  const {
    studentIds,
    semesterId,
    numberOfInstallments,
    customPercentages,
    customAmounts,
    installmentMode,
    customMonths,
    feeBasis,
    installmentsPerMonth,
  } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No students selected" });
  }


  if (!semesterId) {
    return res.status(400).json({
      success: false,
      message:
        "Semester ID is required to ensure configurations are properly separated by semester.",
    });
  }

  const installments = parseInt(numberOfInstallments);
  const mode = installmentMode === "amount" ? "amount" : "percentage";
  const basis = feeBasis === "monthly" ? "monthly" : "total";
  const perMonth = basis === "monthly" ? Math.max(1, parseInt(installmentsPerMonth) || 1) : 1;

  if (basis === "monthly") {
    if (mode === "amount") {
      return res.status(400).json({ success: false, message: "A monthly plan uses percentages of the monthly fee." });
    }
    if (!Array.isArray(customPercentages) || customPercentages.length !== installments || installments % perMonth !== 0) {
      return res.status(400).json({
        success: false,
        message: "A monthly plan needs one percentage per installment, in whole months.",
      });
    }
    // Every month's parts must add up to 100% of that month's fee.
    for (let start = 0; start < installments; start += perMonth) {
      const sum = customPercentages.slice(start, start + perMonth).reduce((a, b) => a + Number(b), 0);
      if (Math.abs(sum - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `The parts of month ${start / perMonth + 1} add up to ${sum}%, they must add up to 100%.`,
        });
      }
    }
  }

  if (mode === "amount") {
    if (!Array.isArray(customAmounts) || customAmounts.length !== installments) {
      return res.status(400).json({
        success: false,
        message: "customAmounts must have exactly one entry per installment.",
      });
    }
    if (customAmounts.some((a) => !Number.isFinite(Number(a)) || Number(a) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Every installment amount must be a valid, non-negative number.",
      });
    }
  }

  // Defensive: an old single-field unique index on `studentId` alone can
  // pre-date the current {studentId, semesterId} compound index (schema
  // changes don't drop old physical indexes). If present, it silently
  // blocks any student from having more than one semester's preference.
  try {
    await StudentFeePreference.collection.dropIndex("studentId_1");
  } catch (e) {}

  const operations = studentIds.map((studentId) => ({
    updateOne: {
    
      filter: { studentId: studentId, semesterId: semesterId },
      update: {
        $set: {
          defaultInstallments: installments,
          autoSplit: installments > 1,
          installmentMode: mode,
          feeBasis: basis,
          installmentsPerMonth: perMonth,
          customPercentages: customPercentages || [],
          customAmounts: mode === "amount" ? customAmounts.map(Number) : [],
          customMonths: customMonths || [],
        },
      },
      upsert: true,
    },
  }));

  await StudentFeePreference.bulkWrite(operations);

  res
    .status(200)
    .json({
      success: true,
      message: "Preferences securely updated for the selected semester.",
    });
});

// A student's full installment-preference history across every semester —
// used to show past semesters' plans (read-only) alongside the current one.
export const getStudentPreferenceHistory = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid student ID" });
  }

  const preferences = await StudentFeePreference.find({ studentId })
    .populate("semesterId", "number name")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: preferences });
});

// Lets the frontend know whether a student already has a preference for a
// specific semester (so it can load it for editing) instead of guessing
// from a possibly-different-semester's cached row on the student list.
export const getStudentPreference = asyncHandler(async (req, res) => {
  const { studentId, semesterId } = req.query;

  if (!studentId || !semesterId) {
    return res.status(400).json({
      success: false,
      message: "studentId and semesterId are required",
    });
  }

  let preference = await StudentFeePreference.findOne({
    studentId,
    semesterId,
  });

  // Legacy fallback: no preference tagged to this specific semester — if
  // there's exactly ONE untagged preference (set up before semesterId
  // tagging existed on StudentFeePreference), load it for editing instead
  // of showing "not configured" and losing/duplicating what was already
  // set up. More than one untagged record is ambiguous, so that case is
  // intentionally left as "not configured" rather than guessing.
  if (!preference) {
    const untagged = await StudentFeePreference.find({
      studentId,
      semesterId: { $in: [null, undefined] },
    });
    if (untagged.length === 1) preference = untagged[0];
  }

  res.status(200).json({ success: true, data: preference });
});

// Permanently tags a legacy installment/billing-month preference (saved
// before semesterId tagging existed) with the semester staff confirms it
// actually belongs to — the manual, per-record counterpart to the
// read-time "use it if it's the only untagged one" fallback in
// getStudentPreference above. Once assigned, it behaves exactly like any
// normally-tagged preference everywhere (Installment Configuration,
// challan generation) — no more fallback needed for it.
export const assignPreferenceSemester = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { semesterId } = req.body;

  if (!semesterId) {
    return res
      .status(400)
      .json({ success: false, message: "semesterId is required" });
  }

  const preference = await StudentFeePreference.findById(id);
  if (!preference) {
    return res
      .status(404)
      .json({ success: false, message: "Preference not found" });
  }
  if (preference.semesterId) {
    return res.status(400).json({
      success: false,
      message: "This preference is already assigned to a semester.",
    });
  }

  const conflict = await StudentFeePreference.findOne({
    _id: { $ne: id },
    studentId: preference.studentId,
    semesterId,
  });
  if (conflict) {
    return res.status(409).json({
      success: false,
      message:
        "This student already has an installment preference for that semester — cannot assign.",
    });
  }

  preference.semesterId = semesterId;
  await preference.save();

  res
    .status(200)
    .json({ success: true, message: "Semester assigned", data: preference });
});

// Bulk version of getStudentPreference — for a batch of students being
// selected in the Bulk Challan tool, tells the frontend which of them have
// a real (>1 installment) plan for the given semester, so the Billing Month
// field can be required/disabled per the same rule as single-generate.
// Checks each student's OWN current semester's installment preference —
// not one shared `semesterId` applied to the whole batch, which required
// every selected student to already be on the same Part/Semester (and
// forced the caller to have that semesterId on hand at all, which a
// Part-only filter — no Program required — doesn't produce).
export const getBatchInstallmentStatus = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "studentIds[] is required",
    });
  }

  const students = await StudentProfile.find({
    _id: { $in: studentIds },
  }).select("semesterId");
  const currentSemesterMap = new Map(
    students.map((s) => [
      s._id.toString(),
      (s.semesterId || "").toString() || null,
    ]),
  );

  const prefs = await StudentFeePreference.find({
    studentId: { $in: studentIds },
  }).select("studentId semesterId defaultInstallments");

  // Group per student so an untagged legacy preference (predating
  // semesterId tagging) can stand in as that student's current-semester
  // plan when nothing tagged to that semester exists — mirrors the same
  // fallback in StudentChallanService.generate() and the single-student
  // getStudentPreference lookup above, so this "has an installment plan"
  // signal stays consistent with what generation itself will actually do.
  const prefsByStudent = new Map();
  prefs.forEach((p) => {
    const sid = p.studentId.toString();
    if (!prefsByStudent.has(sid)) prefsByStudent.set(sid, []);
    prefsByStudent.get(sid).push(p);
  });

  const statusMap = {};
  prefsByStudent.forEach((studentPrefs, sid) => {
    const ownSemesterId = currentSemesterMap.get(sid);
    if (!ownSemesterId) return;
    let match = studentPrefs.find(
      (p) => String(p.semesterId) === ownSemesterId,
    );
    if (!match) {
      const untagged = studentPrefs.filter((p) => !p.semesterId);
      if (untagged.length === 1) match = untagged[0];
    }
    if (match && (match.defaultInstallments || 0) > 1) {
      statusMap[sid] = true;
    }
  });

  res.status(200).json({ success: true, data: statusMap });
});

export const getOverdueInstallments = asyncHandler(async (req, res) => {
  const overdue = await InstallmentService.getOverdueInstallments();
  
  res.status(200).json({
    success: true,
    data: overdue
  });
});

export const generateSpecificInstallment = asyncHandler(async (req, res) => {
  const { assignmentId, installmentNumber } = req.params;
  
  if (!assignmentId || !installmentNumber) {
    return res.status(400).json({ success: false, message: "Assignment ID and Installment Number are required." });
  }

  const challan = await InstallmentService.generateSpecificInstallmentChallan(
    assignmentId, 
    installmentNumber
  );

  res.status(201).json({
    success: true,
    message: `Installment ${installmentNumber} generated successfully. Arrears applied.`,
    data: challan
  });
});