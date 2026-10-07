import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import EducationHistory from "../models/EducationHistory.js";
import Enrollment from "../models/Enrollment.js";
import StudentDocuments from "../models/StudentDocuments.js";
import Program from "../../catalog/model/Program.js";
import Semester from "../../catalog/model/Semester.js";
import { assertProgramInScope } from "../../course/middleware/courseAssignmentScope.js";

// Same visibility rules the rest of the app applies outside the Admission/
// Accountant modules (see getAllStudents in studentController.js): withdrawn
// students are left out, and so is an admitted student who has never paid a
// single fee yet. `$ne: false` (not `: true`) because most existing students
// predate the feeActivated field and have it missing entirely.
const VISIBLE_STUDENT_FILTER = {
  status: { $ne: "withdrawn" },
  feeActivated: { $ne: false },
};

// ============================================================================
// HOD STUDENTS — read-only view of a department's students, scoped
// server-side to the caller's own department (req.hodDepartmentId is set by
// resolveHodDepartment; it is undefined for unscoped roles like admin).
// ============================================================================

// Programs of the HOD's department, each with its current visible-student
// count — drives the program tabs on the HOD Students screen.
export const getHodStudentPrograms = asyncHandler(async (req, res) => {
  const programQuery = {};
  if (req.hodDepartmentId) {
    programQuery.departmentId = req.hodDepartmentId;
  } else if (req.query.departmentId && mongoose.isValidObjectId(req.query.departmentId)) {
    programQuery.departmentId = req.query.departmentId;
  }

  const programs = await Program.find(programQuery)
    .populate("departmentId", "name code")
    .sort({ name: 1 })
    .lean();

  const counts = await StudentProfile.aggregate([
    {
      $match: {
        programId: { $in: programs.map((p) => p._id) },
        ...VISIBLE_STUDENT_FILTER,
      },
    },
    { $group: { _id: "$programId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = programs
    .map((p) => ({
      _id: p._id,
      name: p.name,
      code: p.code,
      departmentId: p.departmentId?._id || p.departmentId,
      departmentName: p.departmentId?.name || "",
      isActive: p.isActive !== false,
      studentCount: countMap.get(String(p._id)) || 0,
    }))
    // An inactive program with nobody in it is just noise on the tab bar.
    .filter((p) => p.isActive || p.studentCount > 0);

  res.json({ success: true, data });
});

// Students of ONE program (the caller's program tab). A program outside the
// HOD's own department is refused, same as getWithdrawableRegistrations.
export const getHodStudentsByProgram = asyncHandler(async (req, res) => {
  const { programId, semesterId, search = "" } = req.query;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 10), 100);
  if (!programId || !mongoose.isValidObjectId(programId)) {
    return res
      .status(400)
      .json({ success: false, message: "A valid programId is required." });
  }

  const inScope = await assertProgramInScope(req, programId);
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message: "That program is not part of your department.",
    });
  }

  const baseFilter = {
    programId,
    ...VISIBLE_STUDENT_FILTER,
  };
  const filter = { ...baseFilter };

  if (semesterId && semesterId !== "all") {
    if (!mongoose.isValidObjectId(semesterId)) {
      return res.status(400).json({ success: false, message: "Invalid semester filter." });
    }
    filter.semesterId = semesterId;
  }

  const normalizedSearch = String(search).trim();
  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matcher = new RegExp(escaped, "i");
    const matchingPeople = await PersonalInfo.find({
      $or: [{ fullName: matcher }, { phone: matcher }, { email: matcher }],
    })
      .select("studentId")
      .lean();
    filter.$or = [
      { studentId: matcher },
      { _id: { $in: matchingPeople.map((person) => person.studentId) } },
    ];
  }

  const [students, total, programTotal, activeTotal, semesterCounts] = await Promise.all([
    StudentProfile.find(filter)
    .select("studentId semesterId termId status")
    .populate("semesterId", "number")
    .populate("termId", "name")
      .sort({ studentId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    StudentProfile.countDocuments(filter),
    StudentProfile.countDocuments(baseFilter),
    StudentProfile.countDocuments({ ...baseFilter, status: "active" }),
    StudentProfile.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$semesterId", count: { $sum: 1 } } },
    ]),
  ]);

  const ids = students.map((s) => s._id);
  const personalInfos = await PersonalInfo.find({ studentId: { $in: ids } })
    .select("studentId fullName phone email gender")
    .lean();
  const infoMap = new Map(personalInfos.map((p) => [String(p.studentId), p]));

  const rows = students
    .map((s) => {
      const info = infoMap.get(String(s._id)) || {};
      return {
        _id: s._id,
        studentId: s.studentId,
        fullName: info.fullName || "Unnamed student",
        phone: info.phone || "",
        email: info.email || "",
        gender: info.gender || "",
        status: s.status,
        semester: { number: s.semesterId?.number ?? null },
        session: { name: s.termId?.name || "" },
      };
    });

  const semesterIds = semesterCounts.map((item) => item._id).filter(Boolean);
  const semesters = await Semester.find({ _id: { $in: semesterIds } })
    .select("name number")
    .sort({ number: 1 })
    .lean();
  const semesterCountMap = new Map(
    semesterCounts.map((item) => [String(item._id), item.count]),
  );
  const semesterOptions = semesters.map((semester) => ({
    _id: semester._id,
    number: semester.number,
    label: semester.name || `Semester ${semester.number}`,
    count: semesterCountMap.get(String(semester._id)) || 0,
  }));

  res.json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
    stats: { total: programTotal, active: activeTotal },
    semesterOptions,
  });
});

// One student's read-only profile. Deliberately leaves out admission-office
// internals (remark / promotionRemarks), all fee data, and the CNIC scan
// documents — only the profile photo is exposed from StudentDocuments.
export const getHodStudentProfile = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.isValidObjectId(studentId)) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  const student = await StudentProfile.findById(studentId)
    .select("studentId departmentId programId semesterId termId status createdAt")
    .populate("departmentId", "name code")
    .populate("programId", "name code")
    .populate("semesterId", "number")
    .populate("termId", "name startDate")
    .lean();

  if (!student) {
    return res.status(404).json({ success: false, message: "Student not found." });
  }

  if (
    req.hodDepartmentId &&
    String(student.departmentId?._id || student.departmentId) !==
      String(req.hodDepartmentId)
  ) {
    return res.status(403).json({
      success: false,
      message: "This student is not in your department.",
    });
  }

  const [personalInfo, familyInfo, educationHistory, enrollment, documents] =
    await Promise.all([
      PersonalInfo.findOne({ studentId })
        .select(
          "fullName cnic phone email dob gender currentAddress permanentAddress",
        )
        .lean(),
      FamilyInfo.findOne({ studentId })
        .select(
          "fatherName fatherCnic motherName motherCnic guardianStatus guardianPhone fathersProfession guardianDesignation incomeBracket",
        )
        .lean(),
      EducationHistory.find({ studentId })
        .select(
          "educationProgram institution board startDate endDateOrResultAwaited obtainedMarks totalMarks percentage",
        )
        .sort({ startDate: -1 })
        .lean(),
      Enrollment.findOne({ studentId })
        .select("status enrollmentDate academicYear")
        .lean(),
      StudentDocuments.findOne({ studentId }).select("profilePhoto").lean(),
    ]);

  res.json({
    success: true,
    data: {
      student: {
        _id: student._id,
        studentId: student.studentId,
        status: student.status,
        admittedOn: student.createdAt,
        department: student.departmentId,
        program: student.programId,
        semester: student.semesterId,
        session: student.termId,
        personalInfo: personalInfo || {},
        familyInfo: familyInfo || {},
        educationHistory: educationHistory || [],
        enrollment: enrollment || {},
        profilePhoto: documents?.profilePhoto || null,
      },
    },
  });
});
