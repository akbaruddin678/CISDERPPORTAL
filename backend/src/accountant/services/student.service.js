import mongoose from "mongoose";
import StudentProfile from "../../student/models/StudentProfile.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import FamilyInfo from "../../student/models/FamilyInfo.js";
import StudentFeePreference from "../model/StudentFeePreference.js";
import Admission from "../../admissions/model/Admission.js";
import { AppError } from "../middleware/errorHandler.js";
import { StudentChallanService } from "./studentChallan.service.js";
import { ScholarshipService } from "./scholarship.service.js";

// Shared by the Admission Process pipeline's "Admission Complete" bucket
// (client-side) and by admissionTrashController.js's completeAdmission
// (server-side, re-checked there rather than trusting the client) — one
// definition of "complete" so the two can never disagree. A student is
// complete once either:
//   - their admission fee was actually paid, or
//   - they have an approved scholarship and no admission fee was ever
//     set up/billed for them to begin with (scholarship applicants often
//     skip the admission-fee challan entirely, whether or not their
//     tuition fee structure has been configured yet — requiring one to
//     exist and be paid would leave them stuck in "Accepted" forever).
export function isAdmissionComplete({ challanStatus, hasScholarship }) {
  if (challanStatus === "paid") return true;
  return !!hasScholarship && challanStatus === "not_generated";
}

export class StudentService {
  static async getStudents(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      programId,
      semesterId,
      semesterNumber, // pulled out so it never leaks into the raw Mongo filter below — StudentProfile has no such field, resolved to semesterId below instead
      termId,
      status = "active",
      startDate, // ✅ NEW: Date From
      endDate, // ✅ NEW: Date To
      excludeLevel, // pulled out so it never leaks into the raw Mongo filter below — StudentProfile has no such field
      onlyAcceptedAdmission, // pulled out so it never leaks into the raw Mongo filter below — resolved via Admission lookup instead
      ...otherFilters
    } = filters;

    const skip = (page - 1) * limit;

    // Build filter object — isTrashed excludes soft-deleted records (see
    // admissionTrashController.js); onlyAcceptedAdmission restricts to
    // students who actually came through the Admission Process portal
    // (StudentProfile.createdFromApplicationId set on an accepted
    // Admission), matching the exact same convention already used by
    // getAllStudents (student/controller/studentController.js) and
    // useNewAdmissions.js — without this, "New Admissions" here silently
    // included every other active student too (bulk-imported, etc.),
    // producing counts far larger than the real admissions total.
    const filter = { status, isTrashed: { $ne: true } };
    if (onlyAcceptedAdmission === "true" || onlyAcceptedAdmission === true) {
      const acceptedApplications = await Admission.find({ status: "accepted" })
        .select("_id")
        .lean();
      filter.createdFromApplicationId = {
        $in: acceptedApplications.map((a) => a._id),
      };
    }
    if (departmentId)
      filter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (programId) filter.programId = new mongoose.Types.ObjectId(programId);
    if (semesterId) {
      filter.semesterId = new mongoose.Types.ObjectId(semesterId);
    } else if (semesterNumber) {
      // "Part 1"/"Part 2" filtering without an explicit program: every HSSC
      // program has its own Semester doc for each part, so resolve to every
      // matching Semester across the given program (or department's
      // programs, or all programs) instead of a single semesterId.
      const SemesterModel =
        mongoose.models.Semester || mongoose.model("Semester");
      const semQuery = { number: Number(semesterNumber) };
      if (programId) {
        semQuery.programId = new mongoose.Types.ObjectId(programId);
      } else if (departmentId) {
        const ProgramModel =
          mongoose.models.Program || mongoose.model("Program");
        const programsInDept = await ProgramModel.find({
          departmentId: new mongoose.Types.ObjectId(departmentId),
        })
          .select("_id")
          .lean();
        semQuery.programId = { $in: programsInDept.map((p) => p._id) };
      }
      const matchingSemesters = await SemesterModel.find(semQuery)
        .select("_id")
        .lean();
      filter.semesterId = { $in: matchingSemesters.map((s) => s._id) };
    }
    if (termId) filter.termId = new mongoose.Types.ObjectId(termId);

    // Exclude students in a program at this level (e.g. "HSSC" college
    // programs) — only when no explicit programId was already chosen, since
    // that program can only have come from an already-scoped catalog dropdown.
    if (excludeLevel && !programId) {
      const validProgramIds = await StudentChallanService.getValidUniversityProgramIds();
      // `null` also matches students with no program (e.g. school classes
      // imported with a department only), which would otherwise be hidden.
      filter.programId = { $in: [...validProgramIds, null] };
    }

    // ✅ NEW: Apply Date Range Filter for New Admissions
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of the day
        filter.createdAt.$lte = end;
      }
    }

    Object.keys(otherFilters).forEach((key) => {
      if (otherFilters[key]) {
        filter[key] = otherFilters[key];
      }
    });

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");

      const matchingPersonalInfos = await PersonalInfo.find({
        $or: [
          { fullName: searchRegex },
          { cnic: searchRegex },
          { email: searchRegex },
        ],
      })
        .select("studentId")
        .lean();

      const matchedStudentMongoIds = matchingPersonalInfos.map(
        (info) => info.studentId,
      );

      filter.$or = [
        { studentId: searchRegex },
        { _id: { $in: matchedStudentMongoIds } },
      ];
    }

    // 1. Get students (Academic Info)
    const students = await StudentProfile.find(filter)
      .populate("departmentId", "name code")
      .populate("programId", "name code level")
      .populate("semesterId", "name number")
      .populate("termId", "name code")
      .select(
        "studentId status remark departmentId programId semesterId termId createdAt admissionReviewCompleted admissionReviewCompletedAt admissionLifecycleStatus cancelledAt cancelledReason reAdmittedAt",
      )
      .sort({ createdAt: -1 }) // Sort newest first
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const studentIds = students.map((student) => student._id);

    // 2. Get Personal Info
    const personalInfos = await PersonalInfo.find(
      { studentId: { $in: studentIds } },
      "studentId fullName fatherName cnic phone email dob gender",
    ).lean();

    // 2.5 Get Family Info
    const familyInfos = await FamilyInfo.find(
      { studentId: { $in: studentIds } },
      "studentId fatherName",
    ).lean();

    // 3. GET FEE PREFERENCES
    const preferences = await StudentFeePreference.find({
      studentId: { $in: studentIds },
    }).lean();

    // 4. Create Maps for O(1) Lookup
    const personalInfoMap = new Map();
    personalInfos.forEach((info) => {
      personalInfoMap.set(info.studentId.toString(), info);
    });

    const familyInfoMap = new Map();
    familyInfos.forEach((info) => {
      familyInfoMap.set(info.studentId.toString(), info);
    });

    const preferenceMap = new Map();
    preferences.forEach((pref) => {
      preferenceMap.set(pref.studentId.toString(), pref);
    });

    // 5. Combine Data
    const studentsWithDetails = students
      .map((student) => {
        const personalInfo = personalInfoMap.get(student._id.toString());
        const familyInfo = familyInfoMap.get(student._id.toString());
        const feePreference = preferenceMap.get(student._id.toString());

        return {
          _id: student._id,
          studentId: student.studentId,
          status: student.status,
          remark: student.remark,
          departmentId: student.departmentId,
          programId: student.programId,
          semesterId: student.semesterId,
          termId: student.termId,
          admissionReviewCompleted: Boolean(student.admissionReviewCompleted),
          admissionReviewCompletedAt: student.admissionReviewCompletedAt || null,
          admissionLifecycleStatus: student.admissionLifecycleStatus || "active",
          cancelledAt: student.cancelledAt || null,
          cancelledReason: student.cancelledReason || null,
          reAdmittedAt: student.reAdmittedAt || null,

          personalInfo: personalInfo
            ? {
                fullName: personalInfo.fullName,
                fatherName: personalInfo.fatherName,
                cnic: personalInfo.cnic,
                phone: personalInfo.phone,
                email: personalInfo.email,
              }
            : null,

          familyInfo: familyInfo ? { fatherName: familyInfo.fatherName } : null,

          feePreference: feePreference
            ? {
                defaultInstallments: feePreference.defaultInstallments,
                autoSplit: feePreference.autoSplit,
                customPercentages: feePreference.customPercentages || [],
              }
            : {
                defaultInstallments: 1,
                autoSplit: false,
                customPercentages: [],
              },

          createdAt: student.createdAt,
        };
      })
      .filter((student) => student.personalInfo);

    const total = await StudentProfile.countDocuments(filter);

    return {
      data: studentsWithDetails,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    };
  }

  // Toggles/sets the accountant's "reviewed this new admission" flag.
  static async setAdmissionReviewStatus(studentId, completed, userId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError("Invalid student ID format", 400);
    }

    const student = await StudentProfile.findByIdAndUpdate(
      studentId,
      {
        admissionReviewCompleted: Boolean(completed),
        admissionReviewCompletedAt: completed ? new Date() : null,
        admissionReviewCompletedBy: completed ? userId || null : null,
      },
      { new: true },
    )
      .select(
        "studentId admissionReviewCompleted admissionReviewCompletedAt",
      )
      .lean();

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return student;
  }

  static async getDetails(studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError("Invalid student ID format", 400);
    }

    const student = await StudentProfile.findById(studentId)
      .populate("departmentId", "name code")
      .populate("programId", "name code level durationSemesters")
      .populate("semesterId", "name number")
      .populate("termId", "name code startDate endDate")
      .lean();

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const personalInfo = await PersonalInfo.findOne(
      { studentId },
      "fullName fatherName cnic phone email dob gender currentAddress permanentAddress emergencyContact",
    ).lean();

    if (!personalInfo) {
      throw new AppError("Student personal information not found", 404);
    }

    const activeScholarship = await ScholarshipService.getScholarshipPreview(
      student._id,
    );

    return {
      _id: student._id,
      studentId: student.studentId,
      status: student.status,
      remark: student.remark,
      // ✅ Same fix here for details route
      departmentId: student.departmentId,
      programId: student.programId,
      semesterId: student.semesterId,
      termId: student.termId,
      personalInfo,
      activeScholarship,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  static async getForChallanGeneration(filters = {}) {
    const {
      departmentId,
      programId,
      semesterId,
      termId,
      hasExistingChallan,
      ...otherFilters
    } = filters;

    const filter = { status: "active" };

    if (departmentId)
      filter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (programId) filter.programId = new mongoose.Types.ObjectId(programId);
    if (semesterId) filter.semesterId = new mongoose.Types.ObjectId(semesterId);
    if (termId) filter.termId = new mongoose.Types.ObjectId(termId);

    Object.keys(otherFilters).forEach((key) => {
      if (otherFilters[key]) {
        filter[key] = otherFilters[key];
      }
    });

    const students = await StudentProfile.find(filter)
      .populate("departmentId", "name code")
      .populate("programId", "name code level")
      .populate("semesterId", "name number")
      .populate("termId", "name code")
      .select("studentId departmentId programId semesterId termId")
      .lean();

    const studentIds = students.map((student) => student._id);
    const personalInfos = await PersonalInfo.find(
      { studentId: { $in: studentIds } },
      "studentId fullName cnic phone email fatherName",
    ).lean();

    const familyInfos = await FamilyInfo.find(
      { studentId: { $in: studentIds } },
      "studentId fatherName",
    ).lean();

    const personalInfoMap = new Map();
    personalInfos.forEach((info) => {
      personalInfoMap.set(info.studentId.toString(), info);
    });

    const familyInfoMap = new Map();
    familyInfos.forEach((info) => {
      familyInfoMap.set(info.studentId.toString(), info);
    });

    let studentsWithChallanInfo = students;

    if (hasExistingChallan !== undefined) {
      const StudentChallan = (await import("../models/StudentChallan.js"))
        .default;

      const existingChallans = await StudentChallan.find({
        studentId: { $in: studentIds },
        termId: termId
          ? new mongoose.Types.ObjectId(termId)
          : { $exists: true },
        status: { $in: ["issued", "partial"] },
      })
        .select("studentId status")
        .lean();

      const studentHasChallanMap = new Map();
      existingChallans.forEach((challan) => {
        studentHasChallanMap.set(challan.studentId.toString(), true);
      });

      studentsWithChallanInfo = students.filter((student) => {
        const hasChallan = studentHasChallanMap.get(student._id.toString());
        return hasExistingChallan === "true" ? hasChallan : !hasChallan;
      });
    }

    const result = studentsWithChallanInfo
      .map((student) => {
        const personalInfo = personalInfoMap.get(student._id.toString());
        const familyInfo = familyInfoMap.get(student._id.toString());

        return {
          _id: student._id,
          studentId: student.studentId,
          // ✅ FIX: Using proper keys
          departmentId: student.departmentId,
          programId: student.programId,
          semesterId: student.semesterId,
          termId: student.termId,
          personalInfo: personalInfo
            ? {
                fullName: personalInfo.fullName,
                cnic: personalInfo.cnic,
                phone: personalInfo.phone,
                email: personalInfo.email,
                fatherName: personalInfo.fatherName,
              }
            : null,
          familyInfo: familyInfo ? { fatherName: familyInfo.fatherName } : null,
        };
      })
      .filter((student) => student.personalInfo);

    return result;
  }

  static async getStudentsByProgram(programId, filters = {}) {
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      throw new AppError("Invalid program ID format", 400);
    }

    const { departmentId, semesterId, status = "active" } = filters;

    const filter = {
      programId: new mongoose.Types.ObjectId(programId),
      status,
    };

    if (departmentId)
      filter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (semesterId) filter.semesterId = new mongoose.Types.ObjectId(semesterId);

    const students = await StudentProfile.find(filter)
      .populate("departmentId", "name code")
      .populate("programId", "name code")
      .populate("semesterId", "name number")
      .select("studentId departmentId programId semesterId status")
      .lean();

    const studentIds = students.map((student) => student._id);
    const personalInfos = await PersonalInfo.find(
      { studentId: { $in: studentIds } },
      "studentId fullName fatherName",
    ).lean();

    const personalInfoMap = new Map();
    personalInfos.forEach((info) => {
      personalInfoMap.set(info.studentId.toString(), info);
    });

    return students
      .map((student) => {
        const personalInfo = personalInfoMap.get(student._id.toString());

        return {
          ...student,
          personalInfo: personalInfo
            ? {
                fullName: personalInfo.fullName,
                fatherName: personalInfo.fatherName,
              }
            : null,
        };
      })
      .filter((student) => student.personalInfo);
  }

  static async getStudentAcademicInfo(studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError("Invalid student ID format", 400);
    }

    const student = await StudentProfile.findById(studentId)
      .populate("departmentId", "name code headOfDepartment")
      .populate("programId", "name code level durationSemesters")
      .populate("semesterId", "number credits")
      .populate("termId", "name code startDate endDate")
      .select(
        "studentId departmentId programId semesterId termId status admissionDate",
      )
      .lean();

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return student;
  }

  static async validateStudentsForChallan(studentIds, academicFilters) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new AppError("Student IDs array is required", 400);
    }

    const validStudentIds = studentIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validStudentIds.length === 0) {
      throw new AppError("No valid student IDs provided", 400);
    }

    const { programId, departmentId, semesterId, termId } = academicFilters;

    const filter = {
      _id: { $in: validStudentIds },
      status: "active",
    };

    if (programId) filter.programId = new mongoose.Types.ObjectId(programId);
    if (departmentId)
      filter.departmentId = new mongoose.Types.ObjectId(departmentId);
    if (semesterId) filter.semesterId = new mongoose.Types.ObjectId(semesterId);
    if (termId) filter.termId = new mongoose.Types.ObjectId(termId);

    const validStudents = await StudentProfile.find(filter)
      .select("_id studentId programId departmentId semesterId termId")
      .lean();

    const invalidStudentIds = validStudentIds.filter(
      (id) => !validStudents.some((student) => student._id.toString() === id),
    );

    return {
      validStudents,
      invalidStudentIds,
      totalRequested: studentIds.length,
      totalValid: validStudents.length,
      totalInvalid: invalidStudentIds.length,
    };
  }
}
