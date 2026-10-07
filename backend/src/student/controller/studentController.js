import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import Enrollment from "../models/Enrollment.js";
import StudentDocuments from "../models/StudentDocuments.js";
import EducationHistory from "../models/EducationHistory.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";
import Department from "../../catalog/model/Department.js";
import Program from "../../catalog/model/Program.js";
import Admission from "../../admissions/model/Admission.js";
import { sendAdmissionEmailForStudent } from "../../accountant/services/admissionEmailService.js";
// ============================================================================
// 1. GET ALL STUDENTS (Optimized Pagination for Large Datasets)
// ============================================================================
export const getAllStudents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    departmentId,
    programId,
    semesterId,
    sessionId,
    status,
    admissionLifecycleStatus,
    onlyAcceptedAdmission,
    excludeCollege,
    excludeWithdrawn,
    includeAll,
  } = req.query;

  // 1. Build Filter
  const filter = { isTrashed: { $ne: true } };
  if (search) {
    if (mongoose.Types.ObjectId.isValid(search)) {
      filter._id = search;
    } else {
      // `studentId` (registration number) matches directly on
      // StudentProfile, but the student's NAME lives on the separate
      // PersonalInfo collection — searching by name alone used to match
      // nothing at all, since only the reg-no branch existed here. A
      // student without a registration number assigned yet can still be
      // found by name this way.
      const matchingProfiles = await PersonalInfo.find({
        fullName: { $regex: search, $options: "i" },
      })
        .select("studentId")
        .lean();
      filter.$or = [
        { studentId: { $regex: search, $options: "i" } },
        { _id: { $in: matchingProfiles.map((p) => p.studentId) } },
      ];
    }
  }
  if (departmentId) filter.departmentId = departmentId;
  if (programId) {
    filter.programId = programId;
  } else if (excludeCollege === "true" || excludeCollege === true) {
    // Opt-in only (the Admission side's own Student Management screen
    // passes this — college students are managed elsewhere and shouldn't
    // clutter this directory). Skipped entirely when a specific program
    // is already selected, and never applied to any other caller of this
    // endpoint (Registrar/HOD/Teacher, etc. don't pass it).
    const collegePrograms = await Program.find({ level: "HSSC" }).select("_id").lean();
    filter.programId = { $nin: collegePrograms.map((p) => p._id) };
  }
  if (semesterId) filter.semesterId = semesterId;
  if (sessionId) filter.termId = sessionId;
  if (status) {
    filter.status = status;
  } else if (excludeWithdrawn === "true" || excludeWithdrawn === true) {
    // Opt-in only — withdrawn students get their own dedicated tab (see
    // the Admission side's Student Management screen), so its main
    // directory excludes them by default. Only applies when no specific
    // status is already being filtered on.
    filter.status = { $ne: "withdrawn" };
  }
  if (admissionLifecycleStatus)
    filter.admissionLifecycleStatus = admissionLifecycleStatus;

  // Restrict to students whose originating admission application was
  // actually "accepted" (set by the promotion flow) — excludes students
  // created outside the normal admission portal (e.g. direct/legacy
  // registration) with no accepted application behind them. Note:
  // StudentProfile.createdFromApplicationId has a `ref: "Application"`
  // that doesn't match any real model — the field actually stores an
  // Admission _id (see promotionController.js) — so this is looked up
  // manually instead of via .populate().
  const wantsAcceptedAdmissionView =
    onlyAcceptedAdmission === "true" || onlyAcceptedAdmission === true;

  // Opt-in escape hatch for lookups that must find a student regardless of
  // where they sit in the admission/fee-activation funnel (e.g. the Exam
  // module's Student Academic History quick search — a student already
  // visible in a batch list via getStudentsForRegistration, which applies
  // no such gate, must not silently vanish from the search box for the same
  // student). Every existing caller omits this and is unaffected.
  const bypassVisibilityGate = includeAll === "true" || includeAll === true;

  if (wantsAcceptedAdmissionView) {
    const acceptedApplications = await Admission.find({ status: "accepted" })
      .select("_id")
      .lean();
    filter.createdFromApplicationId = {
      $in: acceptedApplications.map((a) => a._id),
    };
  } else if (!bypassVisibilityGate) {
    // Every other module (Registrar Directory, HOD, Teacher, etc.) — a
    // student who came through the Admission Process but hasn't paid a
    // single fee yet stays invisible here. Callers that DO need to see
    // those (the Admission/Accountant "New Admissions" screens) always
    // pass onlyAcceptedAdmission, so they skip this branch entirely.
    // `$ne: false` (not `: true`) so students unrelated to this flow —
    // which never got a feeActivated value written — are unaffected.
    filter.feeActivated = { $ne: false };
  }

  // 2. Pagination Calculations (FIXED FOR UNLIMITED)
  const pageNum = Math.max(1, parseInt(page));
  const parsedLimit = parseInt(limit);
  
  // If limit is exactly 0, use 0 (unlimited). Otherwise, ensure it's at least 1.
  const limitNum = parsedLimit === 0 ? 0 : Math.max(1, parsedLimit);
  
  // If limit is 0, skip is 0 (fetch all). Otherwise, calculate standard skip.
  const skip = limitNum === 0 ? 0 : (pageNum - 1) * limitNum;

  // 3. Fetch Core Student Profiles
  const students = await StudentProfile.find(filter)
    .select(
      "studentId departmentId programId semesterId termId status createdAt admissionLifecycleStatus cancelledAt cancelledReason reAdmittedAt createdFromApplicationId remark"
    )
    .populate("departmentId", "name code")
    .populate("programId", "name code")
    .populate("semesterId", "number")
    .populate("termId", "name startDate")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum) // Mongoose treats .limit(0) as NO LIMIT
    .lean();

  // 4. Get Total Count
  const total = await StudentProfile.countDocuments(filter);

  // 5. Efficiently Fetch Related Data
  const studentIds = students.map((s) => s._id);

  const [personalInfos, familyInfos, enrollments] = await Promise.all([
    PersonalInfo.find({ studentId: { $in: studentIds } })
      .select("studentId fullName email phone")
      .lean(),
    FamilyInfo.find({ studentId: { $in: studentIds } })
      .select("studentId fatherName guardianPhone")
      .lean(),
    Enrollment.find({ studentId: { $in: studentIds } })
      .select("studentId status createdAt")
      .lean(),
  ]);

  // 6. Merge Data in Memory
  const studentsWithDetails = students.map((student) => {
    const pInfo = personalInfos.find(
      (p) => p.studentId.toString() === student._id.toString()
    );
    const fInfo = familyInfos.find(
      (f) => f.studentId.toString() === student._id.toString()
    );
    const enroll = enrollments.find(
      (e) => e.studentId.toString() === student._id.toString()
    );

    return {
      ...student,
      personalInfo: pInfo || {},
      familyInfo: fInfo || {},
      enrollment: enroll || {},
      department: student.departmentId,
      program: student.programId,
      semester: student.semesterId,
      session: student.termId,
    };
  });

  res.json({
    success: true,
    data: {
      students: studentsWithDetails,
      pagination: {
        page: pageNum,
        limit: limitNum === 0 ? "All" : limitNum,
        total,
        // Prevent division by zero if limitNum is 0
        pages: limitNum === 0 ? 1 : Math.ceil(total / limitNum),
      },
    },
  });
});

// ============================================================================
// 2. GET SINGLE STUDENT DETAILS
// ============================================================================
export const getStudentDetails = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await StudentProfile.findById(studentId)
    .populate("departmentId", "name code")
    .populate("programId", "name code")
    .populate("semesterId", "number")
    .populate("termId", "name startDate")
    .lean();

  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }

  const [personalInfo, familyInfo, educationHistory, enrollment, documents] =
    await Promise.all([
      PersonalInfo.findOne({ studentId }).lean(),
      FamilyInfo.findOne({ studentId }).lean(),
      EducationHistory.find({ studentId }).lean(),
      Enrollment.findOne({ studentId }).lean(),
      StudentDocuments.findOne({ studentId }).lean(),
    ]);

  res.json({
    success: true,
    data: {
      student: {
        ...student,
        personalInfo,
        familyInfo,
        educationHistory,
        enrollment,
        documents,
        department: student.departmentId,
        program: student.programId,
        semester: student.semesterId,
        session: student.termId,
      },
    },
  });
});

// ============================================================================
// RESEND ADMISSION EMAIL — re-sends the same congratulations letter (+
// challan, if one exists) that promoteStudent() sends automatically at
// acceptance time and the StudentChallan post-save hook sends again once a
// challan is generated. Delegates to admissionEmailService so all three
// triggers build the exact same email instead of drifting apart.
// ============================================================================
export const resendAdmissionEmail = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await StudentProfile.findById(studentId).select("_id").lean();
  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }

  const personalInfo = await PersonalInfo.findOne({ studentId })
    .select("email")
    .lean();
  if (!personalInfo?.email) {
    return res
      .status(400)
      .json({ success: false, error: "This student has no email on record." });
  }

  // sendAdmissionEmailForStudent looks up the first admission challan
  // itself, so by resend time (unlike right at promotion) it's often
  // already been generated and gets attached automatically.
  const sent = await sendAdmissionEmailForStudent(studentId);

  if (!sent) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to send email. Please try again." });
  }

  res.json({
    success: true,
    message: `Admission email resent to ${personalInfo.email}.`,
  });
});

// ============================================================================
// UPDATE STUDENT REMARK — a small, dedicated PATCH so the Admission
// Process pipeline (Accepted/Challan Generated/Fee Paid/Fee Overdue tabs)
// can edit a student's remark without going through the full multipart
// updateStudent form below.
// ============================================================================
export const updateStudentRemark = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { remark } = req.body;

  const student = await StudentProfile.findByIdAndUpdate(
    studentId,
    { remark: remark || "" },
    { new: true }
  ).select("remark");

  if (!student) {
    return res.status(404).json({ success: false, error: "Student not found" });
  }

  res.json({ success: true, data: { id: student._id, remark: student.remark } });
});

// ============================================================================
// 3. UPDATE STUDENT
// ============================================================================
// ============================================================================
// 3. UPDATE STUDENT
// ============================================================================
export const updateStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!req.body)
    return res
      .status(400)
      .json({ success: false, error: "Request body is empty." });

  const { section, data } = req.body;
  if (!section)
    return res
      .status(400)
      .json({ success: false, error: "Missing 'section' field." });

  let parsedData = {};
  try {
    parsedData = data ? JSON.parse(data) : {};
  } catch (e) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid JSON format." });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // --- A. Personal & Address ---
      if (
        section === "Personal Information" ||
        section === "Address Information"
      ) {
        const updatePayload = {};
        if (parsedData.fullName) updatePayload.fullName = parsedData.fullName;
        if (parsedData.phone) updatePayload.phone = parsedData.phone;
        if (parsedData.email) updatePayload.email = parsedData.email;
        if (parsedData.dob) updatePayload.dob = parsedData.dob;
        if (parsedData.gender) updatePayload.gender = parsedData.gender;
        if (parsedData.currentAddress)
          updatePayload.currentAddress = parsedData.currentAddress;
        if (parsedData.permanentAddress)
          updatePayload.permanentAddress = parsedData.permanentAddress;

        // Normalized to a plain 13-digit string regardless of how it
        // arrived (dashes, spaces, etc.) — matches the format every
        // existing record already uses, and re-validated here even though
        // the frontend already enforces it, since this endpoint can be
        // called directly.
        if (parsedData.cnic !== undefined) {
          const digitsOnly = String(parsedData.cnic).replace(/\D/g, "");
          if (digitsOnly.length !== 13) {
            throw new Error("CNIC must be exactly 13 digits.");
          }
          updatePayload.cnic = digitsOnly;
        }

        // `cnic` has a unique index — checked explicitly here (rather than
        // letting the E11000 duplicate-key error bubble up raw) so a typo
        // that collides with another student's CNIC surfaces as a clear
        // message instead of a Mongo error string.
        if (updatePayload.cnic) {
          const cnicOwner = await PersonalInfo.findOne({
            cnic: updatePayload.cnic,
            studentId: { $ne: studentId },
          })
            .select("_id")
            .session(session);
          if (cnicOwner) {
            throw new Error(
              "This CNIC is already registered to another student.",
            );
          }
        }

        if (Object.keys(updatePayload).length > 0) {
          await PersonalInfo.findOneAndUpdate(
            { studentId },
            { $set: updatePayload },
            { new: true, session }
          );
        }
      }

      // --- B. Family Info ---
      if (section === "Family Information") {
        await FamilyInfo.findOneAndUpdate(
          { studentId },
          { $set: parsedData },
          { new: true, upsert: true, session }
        );
      }

      // --- C. Documents ---
      if (section === "Documents") {
        const docUpdates = {};
        const fileFields = [
          "profilePhoto",
          "cnicFront",
          "cnicBack",
          "matricCertificate",
          "fscCertificate",
          "domicileDoc",
        ];
        if (req.files) {
          for (const field of fileFields) {
            if (req.files[field] && req.files[field][0]) {
              const url = await uploadToR2(
                req.files[field][0],
                `students/${studentId}/documents`
              );
              docUpdates[field] = url;
            }
          }
        }
        if (Object.keys(docUpdates).length > 0) {
          await StudentDocuments.findOneAndUpdate(
            { studentId },
            { $set: docUpdates },
            { new: true, upsert: true, session }
          );
        }
      }

      // --- D. Education History ---
      if (section === "Education History") {
        await EducationHistory.deleteMany({ studentId }, { session });
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const educationRecords = parsedData.map((edu) => ({
            studentId,
            educationProgram: edu.educationProgram,
            institution: edu.institution,
            board: edu.board,
            startDate: edu.startDate ? new Date(edu.startDate) : null,
            endDateOrResultAwaited: edu.endDateOrResultAwaited
              ? new Date(edu.endDateOrResultAwaited)
              : null,
            obtainedMarks: Number(edu.obtainedMarks) || 0,
            totalMarks: Number(edu.totalMarks) || 0,
            percentage: Number(edu.percentage) || 0,
          }));
          await EducationHistory.insertMany(educationRecords, { session });
        }
      }

      // --- E. Academic Info ---
      if (section === "Academic Information") {
        const profileUpdates = {};
        
        // ✅ THE FIX: Map all academic fields, including ID conversions
        if (parsedData.status) profileUpdates.status = parsedData.status;
        if (parsedData.departmentId) profileUpdates.departmentId = parsedData.departmentId;
        if (parsedData.programId) profileUpdates.programId = parsedData.programId;
        if (parsedData.semesterId) profileUpdates.semesterId = parsedData.semesterId;
        
        // Frontend sends "sessionId", backend schema calls it "termId"
        if (parsedData.sessionId) profileUpdates.termId = parsedData.sessionId;

        if (Object.keys(profileUpdates).length > 0) {
          await StudentProfile.findByIdAndUpdate(
            studentId, 
            { $set: profileUpdates }, 
            { session, new: true }
          );
        }
      }
    });

    res.json({ success: true, message: `${section} updated successfully` });
  } catch (error) {
    const isDuplicateKeyCnic =
      error.code === 11000 && error.message?.includes("cnic");
    const isCnicValidationError =
      error.message === "CNIC must be exactly 13 digits." ||
      error.message === "This CNIC is already registered to another student.";
    res.status(isDuplicateKeyCnic || isCnicValidationError ? 400 : 500).json({
      success: false,
      error: isDuplicateKeyCnic
        ? "This CNIC is already registered to another student."
        : error.message,
    });
  } finally {
    session.endSession();
  }
});

// ============================================================================
// GET ALL STUDENTS FOR EXCEL EXPORT (Hierarchical Data)
// ============================================================================
export const getAllStudentsForPrint = asyncHandler(async (req, res) => {
  const { departmentId, programId, semesterId, sessionId, search } = req.query;

  // 1. Build Filter
  const filter = { isTrashed: { $ne: true } };
  if (departmentId) filter.departmentId = departmentId;
  if (programId) filter.programId = programId;
  if (semesterId) filter.semesterId = semesterId;
  if (sessionId) filter.termId = sessionId;
  if (search) filter.studentId = { $regex: search, $options: "i" };

  // 2. Fetch Core Profiles
  const students = await StudentProfile.find(filter)
    .populate("departmentId", "name code") 
    .populate("programId", "name code") 
    .populate("termId", "name")
    .populate("semesterId", "name number")
    .sort({ createdAt: -1 })
    .lean();

  if (!students.length) return res.json({ success: true, count: 0, data: [] });

  const studentIds = students.map((s) => s._id);

  // 3. Parallel Fetch from Related Collections
  const [personalInfos, familyInfos, documents, educationHistories] = await Promise.all([
    PersonalInfo.find({ studentId: { $in: studentIds } }).lean(),
    FamilyInfo.find({ studentId: { $in: studentIds } }).lean(),
    StudentDocuments.find({ studentId: { $in: studentIds } }).lean(),
    EducationHistory.find({ studentId: { $in: studentIds } }).lean(),
  ]);

  // 4. Create Lookup Maps
  const pInfoMap = new Map(personalInfos.map((p) => [p.studentId.toString(), p]));
  const fInfoMap = new Map(familyInfos.map((f) => [f.studentId.toString(), f]));
  const docMap = new Map(documents.map((d) => [d.studentId.toString(), d]));
  
  // Group Education by Student ID
  const eduMap = new Map();
  educationHistories.forEach((edu) => {
    const sId = edu.studentId.toString();
    if (!eduMap.has(sId)) eduMap.set(sId, []);
    eduMap.get(sId).push(edu);
  });

  // 5. Construct Nested Data Structure (One by One)
  const fullData = students.map((student) => {
    const sId = student._id.toString();
    
    return {
      // Core Profile
      profile: student,
      
      // Related Data (Returned as distinct objects/arrays)
      personalInfo: pInfoMap.get(sId) || null,
      familyInfo: fInfoMap.get(sId) || null,
      documents: docMap.get(sId) || null,
      educationHistory: eduMap.get(sId) || []
    };
  });

  res.json({ success: true, count: fullData.length, data: fullData });
});

// ============================================================================
// 4. GET STATS
// ============================================================================
export const getStudentStats = asyncHandler(async (req, res) => {
  // This endpoint is only ever called by the Admission side's own Student
  // Management screen, which is University-only (see excludeCollege on
  // getAllStudents above) — these counts need the same scope, or the stat
  // cards disagree with the very list they sit above.
  const collegePrograms = await Program.find({ level: "HSSC" }).select("_id").lean();
  const nonCollegeProgramIds = { $nin: collegePrograms.map((p) => p._id) };
  const baseFilter = { isTrashed: { $ne: true }, programId: nonCollegeProgramIds };

  const totalStudents = await StudentProfile.countDocuments(baseFilter);
  const activeStudents = await StudentProfile.countDocuments({
    ...baseFilter,
    status: "active",
  });
  const graduatedStudents = await StudentProfile.countDocuments({
    ...baseFilter,
    status: "graduated",
  });

  const departmentStats = await StudentProfile.aggregate([
    { $match: baseFilter },
    {
      $lookup: {
        from: "departments",
        localField: "departmentId",
        foreignField: "_id",
        as: "department",
      },
    },
    { $unwind: "$department" },
    {
      $group: {
        _id: "$departmentId",
        departmentName: { $first: "$department.name" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      total: totalStudents,
      active: activeStudents,
      graduated: graduatedStudents,
      byDepartment: departmentStats,
    },
  });
});


// ============================================================================
// 5. GET STUDENTS BY DEPARTMENT NAME
// ============================================================================
export const getStudentsByDepartmentName = asyncHandler(async (req, res) => {
  const { deptName } = req.query;

  if (!deptName) return res.status(400).json({ success: false, error: "Department name is required" });

  // 1. Find the department dynamically
  const Department = mongoose.model("Department");
  const department = await Department.findOne({
    name: { $regex: new RegExp(`^${deptName}$`, "i") }
  });

  if (!department) {
    return res.json({ success: true, count: 0, data: [] });
  }

  // 2. Fetch all students in this department
  const students = await StudentProfile.find({
    departmentId: department._id,
    isTrashed: { $ne: true },
  })
    .select("studentId")
    .lean();

  if (!students.length) return res.json({ success: true, count: 0, data: [] });

  const studentIds = students.map((s) => s._id);

  const personalInfos = await PersonalInfo.find({ studentId: { $in: studentIds } })
    .select("studentId fullName")
    .lean();

  // 3. Merge their names with their Registration Numbers
  const result = students.map((student) => {
    const pInfo = personalInfos.find((p) => p.studentId.toString() === student._id.toString());
    return {
      studentId: student.studentId,
      personalInfo: pInfo || { fullName: "Unknown" },
    };
  });

  res.json({ success: true, count: result.length, data: result });
});