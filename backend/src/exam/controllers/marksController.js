import ExamResult from "../models/ExamResult.js";
import ResultApproval from "../models/ResultApproval.js";
import ReEvaluation from "../models/ReEvaluation.js";
import StudentAcademicRecord from "../models/StudentAcademicRecord.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js"; // Required
import MarkDistribution from "../models/MarkDistribution.js";
import StaffProfile from "../../staff/models/StaffProfile.js";

import Exam from "../models/Exam.js";
import ExamAttendance from "../models/ExamAttendance.js";

const resolveStaffId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();
  return staffProfile?._id || null;
};

export const saveStudentMarks = async (req, res) => {
  try {
    const { examId, studentId, obtainedMarks, isAbsent, enteredBy } = req.body;
    const result = await ExamResult.findOneAndUpdate(
      { examId, studentId },
      { obtainedMarks: isAbsent ? 0 : obtainedMarks, isAbsent, enteredBy },
      { new: true, upsert: true },
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitResultForApproval = async (req, res) => {
  try {
    const { examId, userId } = req.body;
    const approval = await ResultApproval.create({
      examId,
      approvalHistory: [
        { role: "Faculty", userId, action: "Submitted for HoD Review" },
      ],
    });
    res.status(200).json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyReEvaluation = async (req, res) => {
  try {
    const application = await ReEvaluation.create(req.body);
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateAcademicRecords = async (req, res) => {
  try {
    const record = await StudentAcademicRecord.create(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// BULK MARKS & RESULTS LOGIC
// ==========================================


// Admin/Exam-Cell manual entry point: writes straight to ExamResult (the
// same model transcripts read from) and marks it "Verified" immediately —
// no teacher draft/publish step and no HOD review, by design.
export const manualUploadExamMarks = async (req, res) => {
  try {
    const { termId, courseId, semesterId, examId, records } = req.body;
    if (
      !termId ||
      !courseId ||
      !semesterId ||
      !examId ||
      !Array.isArray(records) ||
      records.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "termId, courseId, semesterId, examId and records[] are required.",
      });
    }

    const exam = await Exam.findOne({ _id: examId, termId, courseId, semesterId }).lean();
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found for this course." });
    }

    const staffId = await resolveStaffId(req);
    if (!staffId) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a staff profile.",
      });
    }

    const studentIds = records.map((r) => r.studentId).filter(Boolean);
    const validRegistrations = await StudentCourseRegistration.find({
      studentId: { $in: studentIds },
      termId,
      courseId,
      semesterId,
    })
      .select("studentId")
      .lean();
    const validStudentIds = new Set(
      validRegistrations.map((r) => String(r.studentId)),
    );

    const ops = records
      .filter((r) => validStudentIds.has(String(r.studentId)))
      .map((r) => {
        const isAbsent = Boolean(r.isAbsent);
        const obtainedMarks = isAbsent
          ? 0
          : Math.min(Math.max(Number(r.obtainedMarks) || 0, 0), exam.totalMarks);
        return {
          updateOne: {
            filter: { examId, studentId: r.studentId },
            update: {
              $set: {
                obtainedMarks,
                isAbsent,
                enteredBy: staffId,
                status: "Verified",
              },
            },
            upsert: true,
          },
        };
      });

    if (ops.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid marks records to save." });
    }

    await ExamResult.bulkWrite(ops);

    res.status(200).json({
      success: true,
      message: `Marks saved (auto-approved) for ${ops.length} student(s).`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBatchCourses = async (req, res) => {
  try {
    const { termId, programId, semesterId } = req.query;
    const registrations = await StudentCourseRegistration.find({
      termId,
      programId,
      semesterId,
    })
      .populate("courseId", "title code")
      .lean();

    const uniqueCourses = [];
    const seenIds = new Set();

    registrations.forEach((reg) => {
      if (reg.courseId && reg.courseId._id) {
        const idStr = String(reg.courseId._id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          uniqueCourses.push(reg.courseId);
        }
      }
    });
    res.status(200).json({ success: true, data: uniqueCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Plain course roster (with attendance status) — used by the UFM and
// Re-evaluation modules to pick a target student, unrelated to the
// exam-instance marks flow below.
export const getCourseStudents = async (req, res) => {
  try {
    const { termId, courseId, semesterId } = req.query;

    const registrations = await StudentCourseRegistration.find({
      termId,
      courseId,
      semesterId,
    })
      .populate({ path: "studentId", populate: { path: "personalInfo" } })
      .lean();

    const exam = await Exam.findOne({ termId, courseId });
    const attendances = exam
      ? await ExamAttendance.find({ examId: exam._id }).lean()
      : [];

    const attMap = {};
    attendances.forEach((a) => {
      if (a.studentId) attMap[String(a.studentId)] = a.status;
    });

    const students = registrations
      .filter((reg) => reg.studentId && reg.studentId._id)
      .map((reg) => {
        const sid = String(reg.studentId._id);
        return {
          registrationId: reg._id,
          studentId: sid,
          name: reg.studentId.personalInfo?.fullName || "Unknown Student",
          rollNo: reg.studentId.studentId || "N/A",
          midMarks: reg.midMarks || 0,
          finalMarks: reg.finalMarks || 0,
          sessionalMarks: reg.sessionalMarks || 0,
          hasSavedMarks:
            reg.midMarks !== undefined || reg.finalMarks !== undefined,
          attendanceStatus: attMap[sid] || "Pending Exam",
        };
      });

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error("Error in getCourseStudents:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// An exam can only be marked once it has actually been conducted — i.e. its
// scheduled date+time has passed. Sessional exams are dateless by design
// (a running mark entered off ongoing class performance, not a scheduled
// event), so they're always eligible.
const isExamConducted = (exam) => {
  if (exam.type === "Sessional") return true;
  if (!exam.date) return false;

  const examEnd = new Date(exam.date);
  const timeStr = exam.endTime || exam.startTime;
  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    examEnd.setHours(hours || 0, minutes || 0, 0, 0);
    if (!exam.endTime && exam.duration) {
      examEnd.setMinutes(examEnd.getMinutes() + Number(exam.duration));
    }
  } else {
    examEnd.setHours(23, 59, 59, 999);
  }
  return examEnd.getTime() <= Date.now();
};

// Scheduled exams for a course/term/semester, so the manual-upload tool can
// offer an exam picker instead of a fixed mid/final/sessional split. Only
// exams that have already been conducted are offered — marks can't be
// entered for an exam that hasn't happened yet.
export const getExamsForCourse = async (req, res) => {
  try {
    const { termId, courseId, semesterId } = req.query;
    if (!termId || !courseId || !semesterId) {
      return res.status(400).json({
        success: false,
        message: "termId, courseId and semesterId are required.",
      });
    }
    const exams = await Exam.find({ termId, courseId, semesterId })
      .sort({ date: 1 })
      .lean();
    const conductedExams = exams.filter(isExamConducted);
    res.status(200).json({ success: true, data: conductedExams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Roster + existing ExamResult marks for one specific exam, across every
// section of the course (this tool is course-wide, not section-scoped).
export const getCourseExamRoster = async (req, res) => {
  try {
    const { termId, courseId, semesterId, examId } = req.query;
    if (!termId || !courseId || !semesterId || !examId) {
      return res.status(400).json({
        success: false,
        message: "termId, courseId, semesterId and examId are required.",
      });
    }

    const exam = await Exam.findOne({ _id: examId, termId, courseId, semesterId }).lean();
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found for this course." });
    }

    const registrations = await StudentCourseRegistration.find({
      termId,
      courseId,
      semesterId,
    })
      .populate({
        path: "studentId",
        select: "studentId personalInfo",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .lean();

    const results = await ExamResult.find({ examId }).lean();
    const resultByStudentId = new Map(results.map((r) => [String(r.studentId), r]));

    const students = registrations
      .filter((reg) => reg.studentId && reg.studentId._id)
      .map((reg) => {
        const sid = String(reg.studentId._id);
        const result = resultByStudentId.get(sid);
        return {
          registrationId: String(reg._id),
          studentId: sid,
          name: reg.studentId.personalInfo?.fullName || "Unknown Student",
          rollNo: reg.studentId.studentId || "N/A",
          obtainedMarks: result?.obtainedMarks ?? null,
          isAbsent: result?.isAbsent || false,
        };
      });

    res.status(200).json({ success: true, data: { exam, students } });
  } catch (error) {
    console.error("Error in getCourseExamRoster:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// MARK DISTRIBUTION CONFIGURATION
// ==========================================
export const getMarkConfig = async (req, res) => {
  try {
    const { termId, courseId } = req.query;
    let config = await MarkDistribution.findOne({ termId, courseId }).lean();
    
    // If no config exists in the DB yet, return the default 20/50/30
    if (!config) {
      config = { mid: 20, final: 50, sessional: 30 };
    }
    
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveMarkConfig = async (req, res) => {
  try {
    const { termId, courseId, mid, final, sessional } = req.body;
    
    // Upsert will create it if it doesn't exist, or update it if it does
    const config = await MarkDistribution.findOneAndUpdate(
      { termId, courseId },
      { mid, final, sessional },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ success: true, message: "Distribution Setup Saved!", data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};