import mongoose from "mongoose";
import StudentProfile from "../../student/models/StudentProfile.js";
import CourseAssignment from "../models/CourseAssignment.js";
import StudentCourseRegistration from "../models/StudentCourseRegistration.js";
import ExamResult from "../../exam/models/ExamResult.js";
import Course from "../models/Course.js";
import Term from "../../catalog/model/Term.js";
import { creditsOf } from "../../core/utils/credits.js";
import { resolveRegulation } from "../../catalog/services/programRegulation.service.js";
import CreditOverride from "../models/CreditOverride.js";
import { getPassedCourseIds } from "../services/passedCourses.service.js";
import { getRegisteredCountsByAssignment } from "../services/sectionSeats.service.js";

// Same percentage->letter-grade thresholds as the student-facing LMS
// transcript (lms/controllers/lmsTranscriptController.js::calculateGrade) —
// kept identical so a student's own transcript and what an exam-office staff
// member sees when looking up that same student never disagree.
const GRADE_THRESHOLDS = [
  { min: 85, grade: "A", points: 4.0 },
  { min: 80, grade: "A-", points: 3.7 },
  { min: 75, grade: "B+", points: 3.3 },
  { min: 70, grade: "B", points: 3.0 },
  { min: 65, grade: "B-", points: 2.7 },
  { min: 60, grade: "C+", points: 2.3 },
  { min: 55, grade: "C", points: 2.0 },
  { min: 50, grade: "D", points: 1.0 },
];
const calculateGrade = (percentage) =>
  GRADE_THRESHOLDS.find((t) => percentage >= t.min) || { grade: "F", points: 0.0 };

export const getStudentsForRegistration = async (req, res) => {
  try {
    const { programId, semesterId } = req.query;
    const students = await StudentProfile.find({
      programId,
      semesterId,
      status: "active",
    }).populate("personalInfo", "fullName");
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Read-only — never consulted by saveStudentRegistrations. Staff manually
// registering a student can SEE unmet prerequisites and section fullness,
// the same information the mobile self-service flow (lms/) enforces, but
// nothing here blocks Save: staff keep full manual override ability.
export const getStudentCourseDetails = async (req, res) => {
  try {
    const { studentId, termId, programId, semesterId } = req.query;
    const offeredCourses = await CourseAssignment.find({
      termId,
      programId,
      semesterId,
    }).populate({
      path: "courseId",
      select: "title code creditHours prerequisites",
      populate: { path: "prerequisites", select: "code title" },
    });
    const [registered, passedCourseIds, countByAssignment] = await Promise.all([
      StudentCourseRegistration.find({ studentId, termId }),
      getPassedCourseIds(studentId),
      getRegisteredCountsByAssignment(offeredCourses.map((offer) => offer._id)),
    ]);
    const registeredCourseIds = registered.map((r) => r.courseId.toString());

    const byCourse = new Map();
    for (const offer of offeredCourses) {
      if (!offer.courseId) continue;
      const courseId = offer.courseId._id.toString();
      const enrolled = countByAssignment.get(String(offer._id)) || 0;
      const section = {
        assignmentId: offer._id,
        section: offer.section,
        capacity: offer.capacity,
        enrolled,
        seatsRemaining: Math.max((offer.capacity || 0) - enrolled, 0),
      };
      if (!byCourse.has(courseId)) {
        byCourse.set(courseId, {
          assignmentId: offer._id,
          courseId: offer.courseId._id,
          code: offer.courseId.code,
          title: offer.courseId.title,
          credits: creditsOf(offer.courseId),
          isRegistered: registeredCourseIds.includes(courseId),
          missingPrerequisites: (offer.courseId.prerequisites || [])
            .filter((p) => !passedCourseIds.has(String(p._id)))
            .map((p) => ({ courseId: p._id, code: p.code, title: p.title })),
          sections: [],
        });
      }
      byCourse.get(courseId).sections.push(section);
    }

    res.status(200).json({ success: true, data: [...byCourse.values()] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Shared by saveStudentRegistrations (enforcement) and getCreditLimit
// (preview, so the frontend can show the limit before the student tries to
// save) — one place resolves "what's the effective per-semester credit cap
// for this student right now", so the two can never disagree.
// Returns { maxCredits, minCredits, overrideActive } — either limit is
// `null` when nothing applies (no regulation, or a regulation with that
// field unset): current no-limit behavior.
async function resolveCreditLimit({ studentId, programId, semesterId, termId }) {
  const [student, term, override] = await Promise.all([
    StudentProfile.findById(studentId).select("admissionTermId").lean(),
    termId ? Term.findById(termId).select("termType").lean() : null,
    semesterId
      ? CreditOverride.findOne({ studentId, semesterId }).lean()
      : null,
  ]);

  const regulation = student?.admissionTermId
    ? await resolveRegulation(programId, student.admissionTermId)
    : null;

  const regulationMax =
    term?.termType === "short" ? regulation?.maxSummerCredits : regulation?.maxCreditsPerSemester;

  return {
    maxCredits: typeof override?.maxCredits === "number" ? override.maxCredits : (regulationMax ?? null),
    minCredits: typeof regulation?.minCreditsPerSemester === "number" ? regulation.minCreditsPerSemester : null,
    overrideActive: !!override,
  };
}

// GET /api/course/registration/credit-limit?studentId=&programId=&semesterId=&termId=
// Preview for the registration UI — lets it show/enforce the limit live as
// courses are toggled, before the student ever tries to Save.
export const getCreditLimit = async (req, res) => {
  try {
    const { studentId, programId, semesterId, termId } = req.query;
    if (!studentId || !programId) {
      return res.status(400).json({ success: false, message: "studentId and programId are required." });
    }
    const limit = await resolveCreditLimit({ studentId, programId, semesterId, termId });
    res.status(200).json({ success: true, data: limit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveStudentRegistrations = async (req, res) => {
  try {
    const { studentId, termId, programId, semesterId, courseIds } = req.body;
    const ids = courseIds || [];

    if (ids.length > 0) {
      const { maxCredits, minCredits } = await resolveCreditLimit({ studentId, programId, semesterId, termId });
      const courses = await Course.find({ _id: { $in: ids } }).select("creditHours").lean();
      const totalCredits = courses.reduce((sum, c) => sum + creditsOf(c), 0);

      if (typeof maxCredits === "number" && totalCredits > maxCredits) {
        return res.status(409).json({
          success: false,
          message: `Credit limit exceeded (${totalCredits} of max ${maxCredits}). Drop a course, or ask your HOD for an override.`,
          data: { totalCredits, maxCredits },
        });
      }

      await StudentCourseRegistration.deleteMany({ studentId, termId });
      const newRegistrations = ids.map((cId) => ({
        studentId,
        termId,
        programId,
        semesterId,
        courseId: cId,
      }));
      await StudentCourseRegistration.insertMany(newRegistrations);

      const warning =
        typeof minCredits === "number" && totalCredits < minCredits
          ? `Under-enrolled: ${totalCredits} of minimum ${minCredits} credits.`
          : undefined;
      return res.status(200).json({ success: true, message: "Registrations updated!", warning });
    }

    await StudentCourseRegistration.deleteMany({ studentId, termId });
    res.status(200).json({ success: true, message: "Registrations updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentCourseHistory = async (req, res) => {
  try {
    const { studentId: rawId } = req.params;

    // Quick Search on the admin screen submits a human-readable
    // registration number (e.g. "SP2026D0016041"), not a Mongo ObjectId —
    // the "View History" button from the batch table already passes a real
    // ObjectId (student._id), which this leaves untouched. Resolving both
    // shapes here means both entry points hit the exact same, correct query.
    let studentId = rawId;
    if (!mongoose.isValidObjectId(rawId)) {
      const profile = await StudentProfile.findOne({ studentId: rawId }).select("_id").lean();
      if (!profile) {
        return res.status(404).json({ success: false, message: "No student found with that registration number." });
      }
      studentId = profile._id;
    }

    // Find ALL registrations for this student across ALL time
    const history = await StudentCourseRegistration.find({ studentId })
      .populate({
        path: "courseId",
        select: "title code creditHours prerequisites",
        populate: { path: "prerequisites", select: "code title" },
      })
      .populate("semesterId", "number name") // Assuming semester has a number/name
      .populate("termId", "name year") // e.g., Fall 2024
      .lean();

    // Same grade/percentage computation as the student-facing LMS
    // transcript (lmsTranscriptController.js::getMyTranscripts) — only
    // HOD-approved (or admin-uploaded, auto-approved) marks count, so a
    // student mid-way through evaluation shows as "Registered", not a
    // premature grade.
    const studentMarks = await ExamResult.find({ studentId, isAbsent: false, status: "Verified" })
      .populate("examId", "courseId totalMarks")
      .lean();
    const courseTotals = {};
    studentMarks.forEach((mark) => {
      if (!mark.examId?.courseId) return;
      const cId = mark.examId.courseId.toString();
      if (!courseTotals[cId]) courseTotals[cId] = { obtained: 0, total: 0 };
      courseTotals[cId].obtained += mark.obtainedMarks || 0;
      courseTotals[cId].total += mark.examId.totalMarks || 0;
    });

    // Group the courses by Semester for the frontend, folding in the
    // registration's own status/grade fields (previously discarded
    // entirely — this endpoint returned an enrolled-course list with no
    // performance data at all) plus the computed exam grade where available.
    const groupedHistory = history.reduce((acc, curr) => {
      const semName =
        curr.semesterId?.name ||
        `Semester ${curr.semesterId?.number}` ||
        "Unknown Semester";
      if (!acc[semName])
        acc[semName] = { term: curr.termId?.name, semesterNumber: curr.semesterId?.number ?? 0, courses: [] };

      const cId = curr.courseId?._id?.toString();
      const totals = cId ? courseTotals[cId] : null;
      let grade = curr.grade || null;
      let gradePoints = null;
      let percentage = null;
      // Once a real grade is computed, it — not the registration's own
      // manually-tracked status — decides Passed/Failed, exactly like
      // lmsTranscriptController.js does for the student's own view of the
      // same data. Otherwise fall back to the registration's tracked status
      // (Registered/In-Progress/Dropped) for a course still being graded.
      let registrationStatus = curr.status;
      if (totals && totals.total > 0) {
        percentage = Number(((totals.obtained / totals.total) * 100).toFixed(2));
        const result = calculateGrade(percentage);
        grade = result.grade;
        gradePoints = result.points;
        registrationStatus = grade === "F" ? "Failed" : "Passed";
      }

      acc[semName].courses.push({
        ...curr.courseId,
        registrationStatus,
        grade,
        gradePoints,
        percentage,
        obtainedMarks: totals?.obtained ?? null,
        totalMarks: totals?.total ?? null,
      });
      return acc;
    }, {});

    // Credit-hour-weighted SGPA per semester — only counts courses that
    // actually have a computed grade point; a semester still mid-evaluation
    // simply omits sgpa rather than showing a misleading partial average.
    Object.values(groupedHistory).forEach((sem) => {
      let creditSum = 0;
      let pointSum = 0;
      sem.courses.forEach((c) => {
        if (c.gradePoints === null) return;
        const credits = creditsOf(c);
        creditSum += credits;
        pointSum += credits * c.gradePoints;
      });
      sem.sgpa = creditSum > 0 ? Number((pointSum / creditSum).toFixed(2)) : null;
    });

    // Sort chronologically by the real semester number, not by the
    // semesterId ObjectId (which only coincidentally sorts correctly if
    // semester documents happened to be created in numeric order).
    const sortedHistory = Object.fromEntries(
      Object.entries(groupedHistory).sort(
        ([, a], [, b]) => (a.semesterNumber || 0) - (b.semesterNumber || 0),
      ),
    );

    res.status(200).json({ success: true, data: sortedHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};