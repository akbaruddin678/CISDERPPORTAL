import mongoose from "mongoose";
import Exam from "../models/Exam.js";
import AdmitCard from "../models/AdmitCard.js";
import UFMReport from "../models/UFMReport.js";
import ReEvaluation from "../models/ReEvaluation.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";

// ==========================================
// EXAM MANAGEMENT
// ==========================================
const MAX_COURSE_WEIGHTAGE = 100;

// Sessional has no fixed date/time — it's a running mark the teacher enters
// off ongoing class performance, not a scheduled event.
const isDateless = (type) => type === "Sessional";

// Sums weightage across a course's existing exams (excluding whichever ids
// are passed in) — used to enforce the 100%-weightage cap on edits. The cap
// is on weightage (what % of the final grade each exam is worth), not on
// totalMarks (the raw mark scale an exam is graded out of, which can be
// anything and isn't bounded).
const courseWeightageTotal = async (courseId, termId, semesterId, excludeIds = []) => {
  const existing = await Exam.find({
    courseId,
    termId,
    semesterId,
    _id: { $nin: excludeIds },
  })
    .select("weightage")
    .lean();
  return existing.reduce((sum, e) => sum + (Number(e.weightage) || 0), 0);
};

// Bulk create/update a semester's exam plan — one row per (course, exam
// type). Upserts on {courseId, termId, semesterId, type}; refuses to touch
// a row that's already PUBLISHED (those are locked), and enforces that no
// course's exams ever sum to more than MAX_COURSE_WEIGHTAGE.
export const saveSemesterExamPlan = async (req, res) => {
  try {
    const { exams, targetStatus } = req.body;
    if (!Array.isArray(exams) || exams.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No exam rows provided." });
    }
    if (!["DRAFT", "SCHEDULED"].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: "targetStatus must be DRAFT or SCHEDULED.",
      });
    }

    // Hard server-side rule, not just a disabled option in the Create Exam
    // UI — an exam can't be created for a program+semester combination with
    // no currently-active students, regardless of how the request was made.
    const semesterProgramPairs = new Map();
    exams.forEach((e) => {
      if (e.programId && e.semesterId) {
        semesterProgramPairs.set(`${e.programId}:${e.semesterId}`, {
          programId: e.programId,
          semesterId: e.semesterId,
        });
      }
    });
    for (const { programId, semesterId } of semesterProgramPairs.values()) {
      // eslint-disable-next-line no-await-in-loop
      const hasActiveStudent = await StudentProfile.exists({ programId, semesterId, status: "active" });
      if (!hasActiveStudent) {
        return res.status(400).json({
          success: false,
          message: "This semester has no active students — an exam can't be created for it.",
        });
      }
    }

    const byCourse = new Map();
    for (const entry of exams) {
      const key = String(entry.courseId);
      if (!byCourse.has(key)) byCourse.set(key, []);
      byCourse.get(key).push(entry);
    }

    for (const entries of byCourse.values()) {
      const { courseId, termId, semesterId } = entries[0];
      const existing = await Exam.find({ courseId, termId, semesterId })
        .select("type totalMarks publishStatus")
        .lean();
      const existingByType = new Map(existing.map((e) => [e.type, e]));

      for (const entry of entries) {
        const current = existingByType.get(entry.type);
        if (current && current.publishStatus === "PUBLISHED") {
          return res.status(400).json({
            success: false,
            message: `${entry.type} for this course is already published and can't be edited here.`,
          });
        }
      }

      const touchedTypes = new Set(entries.map((e) => e.type));
      const untouchedTotal = existing
        .filter((e) => !touchedTypes.has(e.type))
        .reduce((sum, e) => sum + (Number(e.weightage) || 0), 0);
      const incomingTotal = entries.reduce(
        (sum, e) => sum + (Number(e.weightage) || 0),
        0,
      );
      const grandTotal = untouchedTotal + incomingTotal;

      if (grandTotal > MAX_COURSE_WEIGHTAGE) {
        return res.status(400).json({
          success: false,
          message: `Total weightage for this course would be ${grandTotal}%, which exceeds the ${MAX_COURSE_WEIGHTAGE}% cap.`,
        });
      }
    }

    // Each entry is upserted independently — a batch of one (today's single-
    // exam flow) or many (bulk-create a whole semester/program at once)
    // shouldn't let one bad row 500 the entire request and leave the caller
    // guessing which of the others actually committed.
    const results = [];
    const errors = [];
    for (const entry of exams) {
      try {
        const { courseId, termId, semesterId, type, ...rest } = entry;
        const doc = await Exam.findOneAndUpdate(
          { courseId, termId, semesterId, type },
          {
            $set: {
              courseId,
              termId,
              semesterId,
              type,
              ...rest,
              publishStatus: targetStatus,
            },
          },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );
        results.push(doc);
      } catch (err) {
        errors.push(`${entry.title || entry.type}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      errors,
      successCount: results.length,
      failedCount: errors.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Locks a set of exams from DRAFT/SCHEDULED to PUBLISHED — this is what
// makes them visible to teachers (see teacherMarksController's
// getScheduledExams/resolveExamForAssignment).
export const publishExams = async (req, res) => {
  try {
    const { examIds } = req.body;
    if (!Array.isArray(examIds) || examIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No exams selected to publish." });
    }

    const exams = await Exam.find({ _id: { $in: examIds } });
    const incomplete = exams.filter((e) => {
      if (!e.totalMarks) return true;
      if (isDateless(e.type)) return false; // Sessional needs no date/time.
      return !e.date || !e.startTime || !e.endTime || !e.duration;
    });
    if (incomplete.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${incomplete.length} exam(s) are missing required fields (marks, or date/time/duration for non-Sessional types) and can't be published yet.`,
      });
    }

    await Exam.updateMany(
      { _id: { $in: examIds } },
      { $set: { publishStatus: "PUBLISHED" } },
    );

    res
      .status(200)
      .json({ success: true, message: `${examIds.length} exam(s) published.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }
    if (exam.publishStatus === "PUBLISHED") {
      return res
        .status(400)
        .json({ success: false, message: "Published exams cannot be edited." });
    }

    const editable = [
      "type", "totalMarks", "weightage", "date", "startTime", "endTime", "duration",
    ];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) exam[field] = req.body[field];
    });

    if (req.body.weightage !== undefined) {
      const otherTotal = await courseWeightageTotal(
        exam.courseId, exam.termId, exam.semesterId, [exam._id],
      );
      if (otherTotal + Number(exam.weightage) > MAX_COURSE_WEIGHTAGE) {
        return res.status(400).json({
          success: false,
          message: `Total weightage for this course would exceed the ${MAX_COURSE_WEIGHTAGE}% cap.`,
        });
      }
    }

    await exam.save();
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }
    if (exam.publishStatus === "PUBLISHED") {
      return res
        .status(400)
        .json({ success: false, message: "Published exams cannot be deleted." });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Exam deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find(req.query)
      .populate("courseId", "title code")
      .sort({ date: 1 });
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ADMIT CARDS
// ==========================================
// An exam is still "upcoming" (card should read Active) if it hasn't
// happened yet — dateless exams can't be admit-carded at all so every
// exam on a card is expected to have a date; treat a missing date as
// upcoming defensively rather than expiring the card on bad data.
const isExamUpcoming = (exam) => {
  if (!exam) return false;
  if (exam.status && ["Ongoing", "Completed", "Cancelled"].includes(exam.status))
    return false;
  if (!exam.date) return true;
  return new Date(exam.date).getTime() >= Date.now();
};

const withEffectiveStatus = (card) => {
  const obj = card.toObject ? card.toObject() : card;
  if (obj.status === "Revoked") {
    obj.effectiveStatus = "Revoked";
  } else {
    const stillUpcoming = (obj.exams || []).some((e) => isExamUpcoming(e));
    obj.effectiveStatus = stillUpcoming ? "Active" : "Expired";
  }
  return obj;
};

export const getAdmitCards = async (req, res) => {
  try {
    const { termId, departmentId, programId, semesterId, examType } =
      req.query;
    const filter = {};
    if (termId && termId !== "all") filter.termId = termId;
    if (departmentId && departmentId !== "all")
      filter.departmentId = departmentId;
    if (programId && programId !== "all") filter.programId = programId;
    if (semesterId && semesterId !== "all") filter.semesterId = semesterId;
    if (examType && examType !== "all") filter.examType = examType;

    const cards = await AdmitCard.find(filter)
      .populate({
        path: "studentId",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .populate({
        path: "exams",
        populate: { path: "courseId", select: "title code" },
      })
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, data: cards.map(withEffectiveStatus) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resolves every student registered for a course that has a PUBLISHED exam
// of `examType` in scope — the same eligibility computation
// generateBulkAdmitCards uses — plus each student's CURRENT-SEMESTER fee
// status (their own registration semesterId, not the filter's) and whether
// they already have a card. Lets the admit-card screen show a preview
// table (with fee status per row) before anything is actually generated,
// for both single- and bulk-generation.
export const getEligibleStudentsForAdmitCards = async (req, res) => {
  try {
    const { termId, programId, semesterId, examType } = req.query;

    if (!termId || !examType) {
      return res.status(400).json({
        success: false,
        message: "Session and Exam Round are required.",
      });
    }
    if (isDateless(examType)) {
      return res.status(400).json({
        success: false,
        message: `${examType} has no scheduled sitting — it can't have an admit card.`,
      });
    }

    const registrationQuery = { termId };
    if (programId && programId !== "all") registrationQuery.programId = programId;
    if (semesterId && semesterId !== "all") registrationQuery.semesterId = semesterId;

    const registrations = await StudentCourseRegistration.find(registrationQuery)
      .populate({
        path: "studentId",
        select: "studentId personalInfo",
        populate: { path: "personalInfo", select: "fullName" },
      });

    const studentData = {};
    registrations.forEach((reg) => {
      const sid = String(reg.studentId?._id || reg.studentId);
      if (!studentData[sid]) {
        studentData[sid] = {
          student: reg.studentId,
          courses: [],
          semesterId: reg.semesterId,
        };
      }
      studentData[sid].courses.push(reg.courseId);
    });

    const studentIds = Object.keys(studentData);
    if (studentIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Each student's fee is checked against THEIR OWN current semester
    // (from their registration), not the filter — "All Semesters" can
    // still be selected while students span several actual semesters.
    const bySemester = new Map();
    studentIds.forEach((sid) => {
      const semId = String(studentData[sid].semesterId?._id || studentData[sid].semesterId);
      if (!bySemester.has(semId)) bySemester.set(semId, []);
      bySemester.get(semId).push(sid);
    });
    const feeMap = new Map();
    for (const [semId, idsInSem] of bySemester.entries()) {
      const partial = await StudentChallanService.getSemesterChallanStatusForStudents(
        idsInSem,
        semId,
      );
      partial.forEach((v, k) => feeMap.set(k, v));
    }

    const results = [];
    for (const [studentId, data] of Object.entries(studentData)) {
      const scheduledExams = await Exam.find({
        termId,
        courseId: { $in: data.courses },
        type: examType,
        publishStatus: "PUBLISHED",
      }).select("_id");
      if (scheduledExams.length === 0) continue;

      const existingCard = await AdmitCard.findOne({
        studentId,
        termId,
        semesterId: data.semesterId,
        examType,
      }).select("_id status");

      results.push({
        studentId,
        regNo: data.student?.studentId || "N/A",
        name: data.student?.personalInfo?.fullName || "Unknown",
        examCount: scheduledExams.length,
        feeStatus: feeMap.get(studentId)?.challanStatus || "not_generated",
        alreadyHasCard: !!existingCard,
        existingCardId: existingCard?._id || null,
        existingCardStatus: existingCard?.status || null,
      });
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generates admit cards — used for BOTH single (`studentIds: [oneId]`) and
// bulk (`studentIds` omitted = every eligible student in scope) generation.
// Fee-checked per student against their own current semester: no challan
// at all ("fee missing") always blocks generation with no override; an
// unpaid-but-generated challan ("fee not paid") blocks unless the caller
// explicitly confirms via `forceUnpaidStudentIds` (the "are you sure?"
// override from the confirmation dialog).
export const generateBulkAdmitCards = async (req, res) => {
  try {
    const {
      termId,
      departmentId,
      programId,
      semesterId,
      examType,
      studentIds: onlyStudentIds,
      forceUnpaidStudentIds,
    } = req.body;

    if (!examType)
      return res.status(400).json({
        success: false,
        message: "Select an exam round (e.g. Mid Term, Final Exam) to generate admit cards for.",
      });
    if (isDateless(examType))
      return res.status(400).json({
        success: false,
        message: `${examType} has no scheduled sitting — it can't have an admit card.`,
      });

    let registrationQuery = { termId };
    if (programId && programId !== "all")
      registrationQuery.programId = programId;
    if (semesterId && semesterId !== "all")
      registrationQuery.semesterId = semesterId;
    if (Array.isArray(onlyStudentIds) && onlyStudentIds.length > 0) {
      registrationQuery.studentId = { $in: onlyStudentIds };
    }

    const registrations =
      await StudentCourseRegistration.find(registrationQuery);
    if (registrations.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "No registrations found." });

    const studentData = {};
    registrations.forEach((reg) => {
      const sid = String(reg.studentId._id || reg.studentId);
      if (!studentData[sid])
        studentData[sid] = {
          courses: [],
          prog: reg.programId,
          sem: reg.semesterId,
        };
      studentData[sid].courses.push(reg.courseId);
    });

    const studentIdsList = Object.keys(studentData);
    const bySemester = new Map();
    studentIdsList.forEach((sid) => {
      const semId = String(studentData[sid].sem?._id || studentData[sid].sem);
      if (!bySemester.has(semId)) bySemester.set(semId, []);
      bySemester.get(semId).push(sid);
    });
    const feeMap = new Map();
    for (const [semId, idsInSem] of bySemester.entries()) {
      const partial = await StudentChallanService.getSemesterChallanStatusForStudents(
        idsInSem,
        semId,
      );
      partial.forEach((v, k) => feeMap.set(k, v));
    }

    const forceSet = new Set((forceUnpaidStudentIds || []).map(String));
    let newlyGeneratedCount = 0;
    const toInsert = [];
    const skippedNoFee = [];
    const skippedUnpaid = [];

    for (const [studentId, data] of Object.entries(studentData)) {
      const exists = await AdmitCard.findOne({
        studentId,
        termId,
        semesterId: data.sem,
        examType,
      });
      if (exists) continue;

      const feeStatus = feeMap.get(studentId)?.challanStatus || "not_generated";
      const isForcedUnpaid = feeStatus !== "paid" && forceSet.has(studentId);
      if (feeStatus === "not_generated" && !isForcedUnpaid) {
        skippedNoFee.push(studentId);
        continue;
      }
      if (feeStatus !== "paid" && feeStatus !== "not_generated" && !isForcedUnpaid) {
        skippedUnpaid.push({ studentId, feeStatus });
        continue;
      }

      const scheduledExams = await Exam.find({
        termId,
        courseId: { $in: data.courses },
        type: examType,
        publishStatus: "PUBLISHED",
      });
      if (scheduledExams.length > 0) {
        toInsert.push({
          studentId,
          termId,
          departmentId,
          programId: data.prog,
          semesterId: data.sem,
          examType,
          exams: scheduledExams.map((e) => e._id),
          isEligible: true,
          status: "Active",
          feeWarning: isForcedUnpaid,
          feeStatusAtIssue: feeStatus,
        });
        newlyGeneratedCount++;
      }
    }

    if (toInsert.length > 0) await AdmitCard.insertMany(toInsert);
    res.status(201).json({
      success: true,
      generatedCount: newlyGeneratedCount,
      skippedNoFee,
      skippedUnpaid,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const revokeAdmitCard = async (req, res) => {
  try {
    const card = await AdmitCard.findByIdAndUpdate(
      req.params.id,
      { status: "Revoked" },
      { new: true },
    );
    if (!card)
      return res
        .status(404)
        .json({ success: false, message: "Admit card not found." });
    res.status(200).json({ success: true, data: withEffectiveStatus(card) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// EXAM SCHEDULE — HOD read-only view
// ==========================================
// Department-filtered, published-only view of the exam schedule for the
// Exam Coordination screen — HOD does not create/edit exams (that's
// Exam-Cell's job), and departmentId is always forced from
// req.hodDepartmentId server-side, never trusted from the client, unlike
// the plain getExams above which forwards whatever query params it's given.
export const getExamScheduleForHod = async (req, res) => {
  try {
    const query = { publishStatus: "PUBLISHED" };
    if (req.hodDepartmentId) query.departmentId = req.hodDepartmentId;
    if (req.query.termId) query.termId = req.query.termId;

    const exams = await Exam.find(query)
      .populate("courseId", "title code")
      .populate("programId", "name")
      .populate("semesterId", "number")
      .sort({ date: 1 })
      .lean();

    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DASHBOARD OVERVIEW
// ==========================================
// One aggregation call backing the Exam Cell landing page — KPI counters,
// the next 7 days' published exams, and the outstanding-action queues
// (UFM cases still open, re-evaluation appeals still pending) so staff can
// see what needs attention without opening every sub-screen.
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalExams,
      publishedExams,
      draftExams,
      upcomingExams,
      totalStudents,
      activeAdmitCards,
      openUfmCount,
      pendingReEvaluationCount,
      upcomingExamsList,
    ] = await Promise.all([
      Exam.countDocuments({}),
      Exam.countDocuments({ publishStatus: "PUBLISHED" }),
      Exam.countDocuments({ publishStatus: { $in: ["DRAFT", "SCHEDULED"] } }),
      Exam.countDocuments({
        publishStatus: "PUBLISHED",
        date: { $gte: now, $lte: weekAhead },
      }),
      StudentProfile.countDocuments({ status: "active" }),
      AdmitCard.countDocuments({ status: "Active" }),
      UFMReport.countDocuments({ status: { $in: ["Reported", "Under Review"] } }),
      ReEvaluation.countDocuments({ status: { $in: ["Applied", "Under Review"] } }),
      Exam.find({ publishStatus: "PUBLISHED", date: { $gte: now, $lte: weekAhead } })
        .sort({ date: 1 })
        .limit(6)
        .populate("courseId", "title code")
        .populate("departmentId", "name")
        .populate("programId", "name")
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalExams,
        publishedExams,
        draftExams,
        upcomingExams,
        totalStudents,
        activeAdmitCards,
        openUfmCount,
        pendingReEvaluationCount,
        upcomingExamsList,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Which of a program's semesters actually have at least one active student
// right now — the Create Exam screen's Semester picker uses this to disable
// picking a semester nobody is currently enrolled in, so staff can't
// generate an exam nothing will ever be taken for. Same
// {programId, semesterId, status:"active"} scoping
// studentCourseController.js::getStudentsForRegistration already uses for
// "is anyone actually here" checks, aggregated into a per-semester count.
export const getSemestersWithActiveStudents = async (req, res) => {
  try {
    const { programId } = req.query;
    if (!programId) {
      return res.status(400).json({ success: false, message: "programId is required." });
    }

    const counts = await StudentProfile.aggregate([
      { $match: { programId: new mongoose.Types.ObjectId(programId), status: "active" } },
      { $group: { _id: "$semesterId", activeStudentCount: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: counts
        .filter((c) => c._id)
        .map((c) => ({ semesterId: c._id.toString(), activeStudentCount: c.activeStudentCount })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
