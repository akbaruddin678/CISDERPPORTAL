import mongoose from "mongoose";
import crypto from "crypto";
import User from "../../user/model/User.js";
import Person from "../../core/models/Person.js";
import Admission from "../model/Admission.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import Semester from "../../catalog/model/Semester.js";
import { hashPassword } from "../../core/utils/password.js";
import { sendWelcomeSetPasswordEmail } from "../../core/utils/email.js";
import { sendAdmissionEmailForStudent } from "../../accountant/services/admissionEmailService.js";
import { promoteAdmissionToStudent } from "../../student/services/promotionService.js";

// Converts empty strings from the frontend into null so Mongoose doesn't
// crash casting an ObjectId field — same helper admissionsController.js
// already uses for the self-service draft-save path.
const sanitizeId = (id) => {
  if (!id) return null;
  return mongoose.isValidObjectId(id) ? id : null;
};

// Same format rules the self-service wizard enforces client-side
// (admissionValidation.jsx) — enforced here too so a manual entry can't
// save a CNIC/phone shape that later breaks exact-match lookups/reports,
// and so a direct API call (bypassing the form) can't skip them either.
const CNIC_REGEX = /^[0-9]{13}$/;
const PHONE_REGEX = /^[0-9]{11}$/;
const GENDER_VALUES = ["male", "female", "other"];
const GUARDIAN_STATUS_VALUES = ["alive", "deceased", "other"];

// ============================================================================
// MANUAL ADMISSION — an admission-office staff member registers a walk-in
// student directly: creates the login (User), the unified Person record and
// the real StudentProfile/PersonalInfo/FamilyInfo/EducationHistory/
// StudentDocuments/Enrollment/LMS-auth records in one transaction, via the
// `promoteAdmissionToStudent` shared service. NO Admission application
// record is created, so these students do not appear in the Admission
// lists — they are plain students from the start. A staff member keying
// this in has already vetted the walk-in student in person, so there is no
// review step — see student/services/promotionService.js.
//
// `status:"active", emailVerified:true` on the User are set directly at
// creation, the exact same proven pattern completeRegistration/
// createUserByAdmin/HR's createStaff already use for admin-initiated
// account creation. Mirrors hrStaffController.createStaff's transaction +
// temp-password + resetToken + best-effort welcome-email shape.
//
// Uses `session.withTransaction()` (not manual start/commit/abort) so a
// failure after a successful commit can never call abortTransaction on an
// already-committed session (that throws its own error, masking the real
// one) — the same safer pattern promoteStudent already used.
// ============================================================================
export const createManualAdmission = async (req, res) => {
  const session = await mongoose.startSession();
  let created = null;

  try {
    await session.withTransaction(async () => {
      const b = req.body;
      const {
        fullName,
        email,
        phone,
        cnic,
        dob,
        gender,
        academicDepartment,
        applyingForProgram,
        applyingSession,
        currentAddress,
        currentDistrict,
        currentProvince,
        currentCountry,
        permanentAddress,
        permanentDistrict,
        permanentProvince,
        permanentCountry,
        fatherName,
        fathernic,
        motherName,
        motherCnic,
        guardianStatus,
        guardianPhone,
        fathersProfession,
        guardianDesignation,
        incomeBracket,
        educationDetails,
        remark,
      } = b;

      if (
        !fullName ||
        !email ||
        !phone ||
        !cnic ||
        !dob ||
        !gender ||
        !fatherName ||
        !guardianStatus ||
        !academicDepartment ||
        !applyingForProgram ||
        !applyingSession
      ) {
        throw new Error(
          "Full name, email, phone, CNIC, date of birth, gender, father's name, guardian status, department, program and session are required.",
        );
      }

      if (!CNIC_REGEX.test(cnic)) {
        throw new Error("CNIC must be exactly 13 digits, no dashes or spaces.");
      }
      if (!PHONE_REGEX.test(phone)) {
        throw new Error("Phone must be exactly 11 digits.");
      }
      if (!GENDER_VALUES.includes(gender)) {
        throw new Error("Gender must be male, female, or other.");
      }
      if (!GUARDIAN_STATUS_VALUES.includes(guardianStatus)) {
        throw new Error("Guardian status must be alive, deceased, or other.");
      }
      if (Number.isNaN(new Date(dob).getTime())) {
        throw new Error("Date of birth is not a valid date.");
      }

      if (Array.isArray(educationDetails)) {
        for (const edu of educationDetails) {
          const hasAnyValue = edu.educationProgram || edu.institution || edu.board || edu.startDate;
          if (!hasAnyValue) continue;
          if (!edu.educationProgram || !edu.startDate) {
            throw new Error("Each education entry needs at least a qualification and a start date.");
          }
          for (const numField of ["obtainedMarks", "totalMarks", "percentage"]) {
            if (edu[numField] !== undefined && edu[numField] !== "" && Number.isNaN(Number(edu[numField]))) {
              throw new Error(`Education ${numField} must be a number.`);
            }
          }
        }
      }

      const emailNorm = String(email).trim().toLowerCase();
      const exists = await User.findOne({ email: emailNorm }).session(session);
      if (exists) throw new Error("This email is already registered.");

      const cnicExists = await Admission.findOne({ cnic }).session(session);
      if (cnicExists) throw new Error("This CNIC is already registered on another application.");

      // Since this application is about to be auto-accepted, also guard
      // against a CNIC that already belongs to an existing student — the
      // same check promoteStudent does, but done up front here so a
      // genuine duplicate fails cleanly before any User/Admission is
      // created, instead of registering a login that can never actually
      // be promoted.
      const existingPersonalInfo = await PersonalInfo.findOne({ cnic }).session(session);
      if (existingPersonalInfo) {
        const existingStudent = await StudentProfile.findById(existingPersonalInfo.studentId).session(session);
        if (existingStudent) {
          throw new Error(
            `A student with CNIC ${cnic} already exists. Student ID: ${existingStudent.studentId}`,
          );
        }
      }

      // A walk-in registrant is always a brand-new student, so promotion
      // always targets semester 1 of the chosen program — no semester
      // picker needed on the form. Fails the whole request (nothing
      // created) if that program has no Semester 1 configured yet, rather
      // than silently leaving the application unaccepted.
      const semesterOne = await Semester.findOne({
        programId: applyingForProgram,
      })
        .sort({ number: 1 })
        .session(session);
      if (!semesterOne) {
        throw new Error(
          "This class has no section yet — add a section in Academic Management before registering students for it.",
        );
      }

      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
      const passwordHash = await hashPassword(tempPassword);

      // Same "set your own password" fallback link mechanism as HR
      // onboarding — the temp password above still works on its own if the
      // link is never used (e.g. staff hands it to the student in person).
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const newUser = await User.create(
        [
          {
            email: emailNorm,
            passwordHash,
            roles: ["applicant"],
            status: "active",
            emailVerified: true,
            resetToken,
            resetTokenExpires,
          },
        ],
        { session },
      );
      const userId = newUser[0]._id;

      await Person.create([{ userId, name: fullName.trim() }], { session });

      // The student is created directly — no Admission application record
      // is saved, so the student never shows up in the Admission lists.
      // These are the same details an application would hold, passed as
      // plain data for the shared student-creation service below.
      const applicantData = {
        _id: null,
        userId,
        fullName: fullName.trim(),
        dob: dob || null,
        gender: gender || undefined,
        cnic,
        phone,
        currentAddress,
        currentDistrict,
        currentProvince,
        currentCountry,
        permanentAddress,
        permanentDistrict,
        permanentProvince,
        permanentCountry,
        fatherName,
        fathernic,
        motherName,
        motherCnic,
        guardianStatus,
        guardianPhone,
        fathersProfession,
        guardianDesignation,
        incomeBracket,
        academicDepartment: sanitizeId(academicDepartment),
        applyingForProgram: sanitizeId(applyingForProgram),
        applyingSession: sanitizeId(applyingSession),
        educationDetails: Array.isArray(educationDetails) ? educationDetails : [],
      };

      const { studentProfile } = await promoteAdmissionToStudent(applicantData, {
        departmentId: sanitizeId(academicDepartment),
        programId: sanitizeId(applyingForProgram),
        semesterId: semesterOne._id,
        sessionId: sanitizeId(applyingSession),
        remark,
        proofFileUrl: null,
        actorUserId: req.user._id,
        session,
        // `admission.userId` isn't populated here (we already know the
        // email — no need for the extra round-trip), so pass it directly
        // instead of leaving promoteAdmissionToStudent to fall through to
        // its synthetic-email fallback.
        knownEmail: emailNorm,
      });

      created = {
        student: { fullName: fullName.trim(), email: emailNorm },
        tempPassword,
        emailNorm,
        resetToken,
        fullName: fullName.trim(),
        studentProfile: {
          _id: studentProfile._id,
          studentId: studentProfile.studentId,
          status: studentProfile.status,
        },
      };
    });

    res.status(201).json({
      success: true,
      message: "Student registered.",
      data: {
        student: created.student,
        tempPassword: created.tempPassword,
        studentProfile: created.studentProfile,
      },
    });

    // Both best-effort, sent AFTER the transaction has actually committed
    // (not from inside the withTransaction callback, which MongoDB can
    // retry on a transient error — sending from in there would risk
    // duplicate emails) and after the response, since neither should ever
    // block or fail the registration itself, which has already succeeded.
    sendWelcomeSetPasswordEmail(created.emailNorm, {
      name: created.fullName,
      setPasswordUrl: `https://cisd.cisdportal.online/set-password?email=${encodeURIComponent(created.emailNorm)}&token=${created.resetToken}`,
    }).catch((err) => console.error("Manual admission welcome email failed:", err));

    sendAdmissionEmailForStudent(created.studentProfile._id).catch((err) =>
      console.error("Manual admission acceptance email failed:", err),
    );
  } catch (error) {
    if (!res.headersSent) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      console.error("Manual admission post-commit error:", error);
    }
  } finally {
    await session.endSession();
  }
};
