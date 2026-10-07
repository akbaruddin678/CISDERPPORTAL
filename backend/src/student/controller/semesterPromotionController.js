import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import EducationHistory from "../models/EducationHistory.js";
import StudentDocuments from "../models/StudentDocuments.js";
import Enrollment from "../models/Enrollment.js";
import Admission from "../../admissions/model/Admission.js";
import generateStudentId from "../../core/utils/studentIdGenerator.js";
import StudentAuth from "../models/StudentAuth.js";
import Semester from "../../catalog/model/Semester.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";

// ============================================================================
// 1. BULK SEMESTER PROMOTION (FEE CONSTRAINTS REMOVED)
// ============================================================================
export const bulkSemesterPromotion = asyncHandler(async (req, res) => {
  const { studentIds, targetSemesterId, targetSessionId, actionType } =
    req.body;

  if (!studentIds || !studentIds.length) {
    return res
      .status(400)
      .json({ success: false, error: "No students selected" });
  }

  if (!targetSemesterId || !targetSessionId) {
    return res
      .status(400)
      .json({ success: false, error: "Target Semester/Session required" });
  }

  // EXECUTE PROMOTION (Transaction)
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const targetSemester =
        await Semester.findById(targetSemesterId).session(session);

      if (!targetSemester) {
        throw new Error("Target Semester not found.");
      }

      // Update Student Profiles
      await StudentProfile.updateMany(
        { _id: { $in: studentIds } },
        {
          $set: {
            semesterId: targetSemesterId,
            termId: targetSessionId,
            status: "active",
          },
        },
      ).session(session);

      // Create Enrollment Records
      const enrollmentRecords = studentIds.map((stdId) => ({
        studentId: stdId,
        programId: targetSemester.programId,
        semesterId: targetSemesterId,
        termId: targetSessionId,
        status: actionType === "demote" ? "re-enrolled" : "enrolled",
        enrollmentDate: new Date(),
        remarks: `Bulk ${actionType} via System`,
      }));

      await Enrollment.insertMany(enrollmentRecords, { session });

      res.status(200).json({
        success: true,
        message: `Successfully ${
          actionType === "promote" ? "promoted" : "demoted"
        } ${studentIds.length} students.`,
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await session.endSession();
  }
});

// ============================================================================
// 2. INDIVIDUAL STUDENT PROMOTION (FROM ADMISSION)
// ============================================================================
export const promoteStudent = asyncHandler(async (req, res) => {
  const {
    admissionId,
    departmentId,
    programId,
    semesterId,
    sessionId,
    remark,
  } = req.body;

  if (!admissionId) {
    return res
      .status(400)
      .json({ success: false, error: "Admission ID is required" });
  }

  // 1. Handle File Upload
  let proofFileUrl = null;
  if (req.file) {
    proofFileUrl = await uploadToR2(
      req.file,
      `promotions/${admissionId}/proofs`,
    );
  }

  let studentProfile = null;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const admission = await Admission.findById(admissionId)
        .populate("userId")
        .session(session);

      if (!admission) throw new Error("Admission not found");

      // Duplicate Promotion Check
      if (
        admission.application?.status === "Submitted" ||
        admission.status === "accepted"
      ) {
        const existingStudent = await StudentProfile.findOne({
          createdFromApplicationId: admissionId,
        }).session(session);

        if (existingStudent) {
          return res.status(200).json({
            success: true,
            message: "Student already promoted",
            data: { alreadyPromoted: true, studentProfile: existingStudent },
          });
        }
      }

      // CNIC Check
      if (admission.cnic) {
        const personalInfo = await PersonalInfo.findOne({
          cnic: admission.cnic,
        }).session(session);

        if (personalInfo) {
          const studentByCnic = await StudentProfile.findById(
            personalInfo.studentId,
          ).session(session);

          if (studentByCnic) {
            throw new Error(
              `Student with CNIC ${admission.cnic} already exists. Student ID: ${studentByCnic.studentId}`,
            );
          }
        }
      }

      // 2. Generate student ID
      const studentIdNumber = await generateStudentId(departmentId, sessionId);

      // 3. Create StudentProfile
      studentProfile = new StudentProfile({
        studentId: studentIdNumber,
        programId,
        termId: sessionId,
        departmentId,
        semesterId,
        status: "active",
        remark: remark || "",
        promotionRemarks: remark
          ? [
              {
                remark: remark,
                proofDoc: proofFileUrl || null,
                date: new Date(),
                by: req.user?._id || null,
                status: "Admitted",
              },
            ]
          : [],
        createdFromApplicationId: admissionId,
        promotionDate: new Date(),
        promotedBy: req.user?._id || null,
      });
      await studentProfile.save({ session });

      // 4. Create LMS Auth
      const safeEmail = (
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

      // 5. Create PersonalInfo
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

      // 6. Create FamilyInfo
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

      // 7. Create EducationHistory
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

      // 8. Create StudentDocuments
      const studentDocuments = new StudentDocuments({
        studentId: studentProfile._id,
        profilePhoto: admission.profilePhoto || admission.photoFile || null,
        cnicFront: admission.cnicDoc_front || null,
        cnicBack: admission.cnicDoc_back || null,
        matricCertificate: admission.matricCertificate || null,
        fscCertificate:
          admission.interCertificate || admission.fscCertificate || null,
        domicileDoc: admission.domicileDoc || null,
        otherDocuments: proofFileUrl ? [proofFileUrl] : [],
      });
      await studentDocuments.save({ session });

      // 9. Create Enrollment
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

      // 10. Update Admission Status
      admission.status = "accepted";
      if (admission.application) {
        admission.application.status = "Submitted";
      }
      admission.updatedAt = new Date();
      admission.promotedStudentId = studentProfile._id;
      admission.promotionDate = new Date();

      await admission.save({ session });

      // Send success response
      res.json({
        success: true,
        message: "Student promoted successfully",
        data: {
          studentProfile: {
            _id: studentProfile._id,
            studentId: studentProfile.studentId,
            status: studentProfile.status,
            lmsEmail: safeEmail,
          },
          remark: remark || "",
          proofUrl: proofFileUrl,
          promotionDate: new Date(),
        },
      });
    });
  } catch (error) {
    console.error("Promotion error:", error);

    let statusCode = 500;
    let errorMessage = error.message;

    if (error.message.includes("already exists")) {
      statusCode = 409;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (error.message.includes("Missing required fields")) {
      statusCode = 400;
    }

    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        code: statusCode,
      });
    }
  } finally {
    await session.endSession();
  }
});
