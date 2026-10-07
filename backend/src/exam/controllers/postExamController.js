import UFMReport from "../models/UFMReport.js";
import ReEvaluation from "../models/ReEvaluation.js";
import AuditLog from "../models/AuditLog.js";
import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";


// ==========================================
// UFM (UNFAIR MEANS) MANAGEMENT
// ==========================================
export const getUFMReports = async (req, res) => {
  try {
    const reports = await UFMReport.find()
      .populate({
        path: "studentId",
        select: "personalInfo studentId",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .populate({
        path: "examId",
        populate: { path: "courseId", select: "title code" },
      })
      .populate("reportedBy", "personalInfo.fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUFMDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { committeeDecision, status, userId } = req.body; // userId passed from frontend auth

    const report = await UFMReport.findById(id);
    if (!report)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });

    // Create Audit Log
    await AuditLog.create({
      entity: "UFMReport",
      entityId: report._id,
      action: "UPDATE_DECISION",
      userId: userId || req.user?._id, // Assumes auth middleware attaches req.user
      previousValue: {
        status: report.status,
        decision: report.committeeDecision,
      },
      newValue: { status, decision: committeeDecision },
    });

    report.committeeDecision = committeeDecision;
    report.status = status;
    await report.save();

    res
      .status(200)
      .json({ success: true, message: "UFM Decision Updated", data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// RE-EVALUATION / APPEALS MANAGEMENT
// ==========================================
export const getReEvaluations = async (req, res) => {
  try {
    const appeals = await ReEvaluation.find()
      .populate({
        path: "studentId",
        select: "personalInfo studentId",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .populate({
        path: "resultId",
        populate: {
          path: "examId",
          populate: { path: "courseId", select: "title code" },
        },
      })
      .sort({ requestDate: -1 });

    res.status(200).json({ success: true, data: appeals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { newMarks, decisionNote, status, userId } = req.body;

    const appeal = await ReEvaluation.findById(id);
    if (!appeal)
      return res
        .status(404)
        .json({ success: false, message: "Appeal not found" });

    await AuditLog.create({
      entity: "ReEvaluation",
      entityId: appeal._id,
      action: "UPDATE_MARKS",
      userId: userId || req.user?._id,
      previousValue: { status: appeal.status, marks: appeal.newMarks },
      newValue: { status, marks: newMarks },
    });

    appeal.newMarks = newMarks;
    appeal.decisionNote = decisionNote;
    appeal.status = status;
    await appeal.save();

    // Note: In a real system, you would also trigger an update to the StudentCourseRegistration
    // or ExamResult schema here to reflect the newMarks automatically.

    res
      .status(200)
      .json({ success: true, message: "Appeal Updated", data: appeal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUFMReportManual = async (req, res) => {
  try {
    const {
      termId,
      courseId,
      studentId,
      violationType,
      statement,
      status,
      reportedBy,
    } = req.body;

    // 1. Find the scheduled exam for this course & term
    const exam = await Exam.findOne({ termId, courseId });
    if (!exam) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "No Exam is scheduled for this Course. Cannot create UFM report.",
        });
    }

    
    const report = await UFMReport.create({
      examId: exam._id,
      studentId,
      reportedBy,
      violationType,
      statement,
      status,
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUFMReport = async (req, res) => {
  try {
    await UFMReport.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Report deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// HOD-SCOPED UFM & RE-EVALUATION REVIEW
// ==========================================
// Department-scoped versions of the above, for the HOD module. Exam stores
// departmentId directly, so both UFMReport (via examId) and ReEvaluation
// (via resultId -> ExamResult.examId) can be scoped with a one/two-hop
// id-set filter — no need for the heavier Program/CourseAssignment join
// teacherMarksController.js uses. req.hodDepartmentId is set by
// resolveHodDepartment (unset for admin = unscoped).

const deptExamIds = async (req) => {
  const query = {};
  if (req.hodDepartmentId) query.departmentId = req.hodDepartmentId;
  const exams = await Exam.find(query).select("_id").lean();
  return exams.map((e) => e._id);
};

export const getUFMReportsForHod = async (req, res) => {
  try {
    const examIds = await deptExamIds(req);
    const reports = await UFMReport.find({ examId: { $in: examIds } })
      .populate({
        path: "studentId",
        select: "personalInfo studentId",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .populate({
        path: "examId",
        populate: { path: "courseId", select: "title code" },
      })
      .populate("reportedBy", "personalInfo.fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewUFMReportAsHod = async (req, res) => {
  try {
    const { id } = req.params;
    const { committeeDecision, status } = req.body;

    const report = await UFMReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const exam = await Exam.findById(report.examId).select("departmentId").lean();
    if (req.hodDepartmentId && String(exam?.departmentId) !== String(req.hodDepartmentId)) {
      return res.status(403).json({
        success: false,
        message: "This report is outside your department.",
      });
    }

    await AuditLog.create({
      entity: "UFMReport",
      entityId: report._id,
      action: "UPDATE_DECISION",
      userId: req.user?._id,
      previousValue: { status: report.status, decision: report.committeeDecision },
      newValue: { status, decision: committeeDecision },
    });

    report.committeeDecision = committeeDecision;
    report.status = status;
    await report.save();

    res.status(200).json({ success: true, message: "UFM decision updated.", data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReEvaluationsForHod = async (req, res) => {
  try {
    const examIds = await deptExamIds(req);
    const results = await ExamResult.find({ examId: { $in: examIds } })
      .select("_id")
      .lean();
    const resultIds = results.map((r) => r._id);

    const appeals = await ReEvaluation.find({ resultId: { $in: resultIds } })
      .populate({
        path: "studentId",
        select: "personalInfo studentId",
        populate: { path: "personalInfo", select: "fullName" },
      })
      .populate({
        path: "resultId",
        populate: {
          path: "examId",
          populate: { path: "courseId", select: "title code" },
        },
      })
      .sort({ requestDate: -1 });

    res.status(200).json({ success: true, data: appeals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewReEvaluationAsHod = async (req, res) => {
  try {
    const { id } = req.params;
    const { newMarks, decisionNote, status } = req.body;

    const appeal = await ReEvaluation.findById(id);
    if (!appeal) {
      return res.status(404).json({ success: false, message: "Appeal not found" });
    }

    const result = await ExamResult.findById(appeal.resultId).select("examId").lean();
    const exam = result
      ? await Exam.findById(result.examId).select("departmentId").lean()
      : null;
    if (req.hodDepartmentId && String(exam?.departmentId) !== String(req.hodDepartmentId)) {
      return res.status(403).json({
        success: false,
        message: "This appeal is outside your department.",
      });
    }

    await AuditLog.create({
      entity: "ReEvaluation",
      entityId: appeal._id,
      action: "UPDATE_MARKS",
      userId: req.user?._id,
      previousValue: { status: appeal.status, marks: appeal.newMarks },
      newValue: { status, marks: newMarks },
    });

    appeal.newMarks = newMarks;
    appeal.decisionNote = decisionNote;
    appeal.status = status;
    await appeal.save();

    res.status(200).json({ success: true, message: "Appeal updated.", data: appeal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};