import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import EducationHistory from "../models/EducationHistory.js";
import StudentDocuments from "../models/StudentDocuments.js";
import Enrollment from "../models/Enrollment.js";
import StudentAuth from "../models/StudentAuth.js";
import generateStudentId from "../../core/utils/studentIdGenerator.js";

// The actual "accept this admission" work — turns an Admission application
// into a real, enrolled student: StudentProfile, LMS auth, PersonalInfo,
// FamilyInfo, EducationHistory, StudentDocuments, Enrollment, then marks
// the admission itself accepted. Extracted out of promotionController.js's
// promoteStudent so the exact same logic can also run automatically from
// manualAdmissionController.js (walk-in registrations auto-accept in the
// same request/transaction) without the two ever drifting apart.
//
// Caller is responsible for: pre-checks (duplicate promotion, duplicate
// CNIC), loading `admission` (with `userId` populated far enough to read
// `.email`), and wrapping this in the same `session` transaction as any
// other writes it wants atomic with.
export async function promoteAdmissionToStudent(
  admission,
  { departmentId, programId, semesterId, sessionId, remark, proofFileUrl, actorUserId, session, knownEmail },
) {
  // 1. Generate student ID
  const studentIdNumber = await generateStudentId(departmentId, sessionId);

  // 2. Create StudentProfile (remarks & proof saved here for lifetime storage)
  const studentProfile = new StudentProfile({
    studentId: studentIdNumber,
    programId,
    termId: sessionId,
    // Set once, here, at first admission — never overwritten by later
    // semester promotion (see StudentProfile.js's own comment on this field).
    admissionTermId: sessionId,
    departmentId,
    semesterId,
    status: "active",
    remark: remark || "",
    promotionRemarks: remark
      ? [
          {
            remark,
            proofDoc: proofFileUrl || null,
            date: new Date(),
            by: actorUserId || null,
            status: "Admitted",
          },
        ]
      : [],
    // Null for students registered directly by staff (no Admission record).
    createdFromApplicationId: admission._id || null,
    promotionDate: new Date(),
    promotedBy: actorUserId || null,
    // Not visible in other modules until the first fee is paid.
    feeActivated: false,
  });
  await studentProfile.save({ session });

  // 3. Create LMS Auth
  const safeEmail = (
    knownEmail ||
    admission.userId?.email ||
    admission.email ||
    `${studentIdNumber}@student.edu`
  ).toLowerCase();

  const newStudentAuth = new StudentAuth({
    studentProfileId: studentProfile._id,
    email: safeEmail,
    rollNumber: studentIdNumber,
    password: "12345678",
  });
  await newStudentAuth.save({ session });

  // 4. Create PersonalInfo
  const personalInfo = new PersonalInfo({
    studentId: studentProfile._id,
    fullName: admission.fullName,
    cnic: admission.cnic,
    phone: admission.phone,
    email: safeEmail,
    dob: admission.dob,
    gender: admission.gender,
    registrationNumber: studentIdNumber,
    currentAddress: {
      address: admission.currentAddress,
      district: admission.currentDistrict,
      province: admission.currentProvince,
      country: admission.currentCountry,
    },
    permanentAddress: {
      address: admission.permanentAddress,
      district: admission.permanentDistrict,
      province: admission.permanentProvince,
      country: admission.permanentCountry,
    },
  });
  await personalInfo.save({ session });

  // 5. Create FamilyInfo
  const familyInfo = new FamilyInfo({
    studentId: studentProfile._id,
    fatherName: admission.fatherName,
    fatherCnic: admission.fathernic,
    motherName: admission.motherName,
    motherCnic: admission.motherCnic,
    guardianStatus: admission.gardianStatus || admission.guardianStatus,
    guardianPhone: admission.guardianPhone,
    fathersProfession: admission.fathersProfession,
    guardianDesignation: admission.guardianDesignation,
    incomeBracket: admission.incomeBracket,
  });
  await familyInfo.save({ session });

  // 6. Create EducationHistory
  const educationData = admission.educationDetails || [];
  if (educationData.length > 0) {
    const educationRecords = educationData.map((edu) => ({
      studentId: studentProfile._id,
      educationProgram: edu.educationProgram,
      startDate: edu.startDate,
      endDateOrResultAwaited: edu.endDateOrResultAwaited,
      obtainedMarks: edu.obtainedMarks,
      totalMarks: edu.totalMarks,
      percentage: edu.percentage,
      institution: edu.institution,
      board: edu.board,
    }));
    await EducationHistory.insertMany(educationRecords, { session });
  }

  // 7. Create StudentDocuments
  const studentDocuments = new StudentDocuments({
    studentId: studentProfile._id,
    profilePhoto: admission.profilePhoto || admission.photoFile || null,
    cnicFront: admission.cnicDoc_front || null,
    cnicBack: admission.cnicDoc_back || null,
    matricCertificate: admission.matricCertificate || null,
    fscCertificate: admission.interCertificate || admission.fscCertificate || null,
    domicileDoc: admission.domicileDoc || null,
    otherDocuments: proofFileUrl ? [proofFileUrl] : [],
  });
  await studentDocuments.save({ session });

  // 8. Create Enrollment
  const enrollment = new Enrollment({
    studentId: studentProfile._id,
    programId,
    termId: sessionId,
    semesterId,
    departmentId,
    status: "enrolled",
    enrollmentDate: new Date(),
    academicYear: new Date().getFullYear(),
  });
  await enrollment.save({ session });

  // 9. Update Admission status — only when there is a saved Admission
  // application. A student registered directly by staff passes plain data
  // and has no application record to update.
  if (typeof admission.save === "function") {
    admission.status = "accepted";
    if (admission.application) {
      admission.application.status = "Submitted";
    }
    admission.updatedAt = new Date();
    admission.promotedStudentId = studentProfile._id;
    admission.promotionDate = new Date();
    await admission.save({ session });
  }

  return { studentProfile, safeEmail };
}
