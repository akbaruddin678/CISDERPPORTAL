import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import Admission from "../../admissions/model/Admission.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";
import { sendAdmissionEmailForStudent } from "../../accountant/services/admissionEmailService.js";
import { promoteAdmissionToStudent } from "../services/promotionService.js";

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

      const result = await promoteAdmissionToStudent(admission, {
        departmentId,
        programId,
        semesterId,
        sessionId,
        remark,
        proofFileUrl,
        actorUserId: req.user?._id || null,
        session,
      });
      studentProfile = result.studentProfile;
      const safeEmail = result.safeEmail;

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

    // Congratulations email — sent AFTER the transaction has actually
    // committed (not from inside the callback above), since MongoDB can
    // retry a withTransaction callback on a transient error, which would
    // otherwise risk sending the email/PDF more than once. A failure here
    // must never fail the promotion itself, which has already succeeded
    // and already responded to the client — so this is best-effort only.
    // Admission fee challans are usually generated some time AFTER
    // promotion (a separate accountant step), so at this point there's
    // normally nothing yet to attach — that's expected, not an error. The
    // StudentChallan post-save hook (see accountant/model/StudentChallan.js)
    // is what sends this same email again, WITH the challan attached, the
    // moment that challan actually gets generated.
    if (studentProfile) {
      sendAdmissionEmailForStudent(studentProfile._id).catch((emailErr) => {
        console.error("Admission acceptance email failed:", emailErr);
      });
    }
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
