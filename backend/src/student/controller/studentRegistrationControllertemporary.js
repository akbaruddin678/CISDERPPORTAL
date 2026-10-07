import mongoose from "mongoose"; // ✅ Needed for transactions
import bcrypt from "bcryptjs";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import EducationHistory from "../models/EducationHistory.js";
import Enrollment from "../models/Enrollment.js";
import Department from "../../catalog/model/Department.js";
import Program from "../../catalog/model/Program.js";
import Semester from "../../catalog/model/Semester.js";
import Term from "../../catalog/model/Term.js";
import User from "../../user/model/User.js";
import StudentAuth from "../models/StudentAuth.js";

// Helper: Generate ID
async function generateStudentId(departmentCode, programCode, session) {
  const year = new Date().getFullYear().toString().slice(-2);
  const baseId = `${departmentCode}${programCode || "GEN"}${year}`;

  // Notice the `.session(session)` added here
  const lastStudent = await StudentProfile.findOne(
    { studentId: new RegExp(`^${baseId}`) },
    {},
    { sort: { createdAt: -1 } },
  ).session(session);

  if (!lastStudent) return `${baseId}001`;

  const match = lastStudent.studentId.match(/(\d{3})$/);
  const lastNumber = match ? parseInt(match[0]) : 0;
  return `${baseId}${(lastNumber + 1).toString().padStart(3, "0")}`;
}

export const registerStudents = asyncHandler(async (req, res) => {
  let studentsToProcess = [];

  // --- 1. Input Normalization ---
  if (req.body.students && Array.isArray(req.body.students)) {
    studentsToProcess = req.body.students;
  } else if (req.body.personalInfo) {
    studentsToProcess = [req.body];
  } else {
    return res.status(400).json({
      success: false,
      error:
        "Invalid format. Provide a single student object or { 'students': [...] }",
    });
  }

  const results = {
    total: studentsToProcess.length,
    success: 0,
    failed: 0,
    details: [],
  };

  // --- 2. Processing Loop ---
  for (const [index, data] of studentsToProcess.entries()) {
    // ✅ 1. Start a MongoDB Session for THIS specific student
    const session = await mongoose.startSession();

    try {
      // ✅ 2. Wrap everything in a transaction
      await session.withTransaction(async () => {
        // Validation
        if (!data.personalInfo?.email || !data.personalInfo?.cnic) {
          throw new Error("Missing Email or CNIC");
        }

        // --- A. Resolve Department ---
        const department = await Department.findOne(
          data.departmentId
            ? { _id: data.departmentId }
            : { code: data.departmentCode },
        ).session(session);

        if (!department)
          throw new Error(
            `Department not found (Code: ${data.departmentCode})`,
          );

        // --- B. Resolve Program ---
        const program = await Program.findOne(
          data.programId ? { _id: data.programId } : { code: data.programCode },
        ).session(session);

        if (!program)
          throw new Error(`Program not found (Code: ${data.programCode})`);

        // --- C. Resolve Semester ---
        const semester = await Semester.findOne(
          data.semesterId
            ? { _id: data.semesterId }
            : { programId: program._id, number: data.semesterNumber },
        ).session(session);

        if (!semester && data.semesterNumber) {
          throw new Error(
            `Semester ${data.semesterNumber} not found for program ${program.code}`,
          );
        }

        // --- D. Resolve Term/Session ---
        const term = await Term.findOne(
          data.termId ? { _id: data.termId } : { name: data.termName },
        ).session(session);

        // Generate the new Roll Number (passing session)
        const studentId = await generateStudentId(
          department.code,
          program.code,
          session,
        );
        const safeEmail =
          data.personalInfo.email.toLowerCase() ||
          `${studentId.toLowerCase()}@student.edu`;

        // --- E. CREATE CENTRAL USER ---
        const existingUser = await User.findOne({ email: safeEmail }).session(
          session,
        );
        if (existingUser) {
          throw new Error(
            `Email ${safeEmail} is already registered in the system.`,
          );
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("Welcome123!", salt);

        // ✅ IMPORTANT: Notice we pass { session } as an array when creating inside a transaction
        const [newUser] = await User.create(
          [
            {
              email: safeEmail,
              passwordHash: passwordHash,
              roles: ["student"],
              status: "active",
              emailVerified: true,
            },
          ],
          { session },
        );

        // --- F. CREATE STUDENT PROFILE ---
        const [profile] = await StudentProfile.create(
          [
            {
              userId: newUser._id,
              studentId: studentId,
              departmentId: department._id,
              programId: program._id,
              semesterId: semester?._id,
              termId: term?._id,
              status: data.status || "active",
              remark: data.remark || "",
            },
          ],
          { session },
        );

        // --- G. CREATE LMS LOGIN CREDENTIALS ---
        const existingAuth = await StudentAuth.findOne({
          email: safeEmail,
        }).session(session);
        if (existingAuth) {
          throw new Error(
            `Email ${safeEmail} is already registered for LMS access.`,
          );
        }

        await StudentAuth.create(
          [
            {
              studentProfileId: profile._id,
              email: safeEmail,
              rollNumber: studentId,
              password: "Welcome123!",
              status: "ACTIVE",
            },
          ],
          { session },
        );

        // --- H. PERSONAL INFO ---
        await PersonalInfo.create(
          [
            {
              studentId: profile._id,
              ...data.personalInfo,
              dob: new Date(data.personalInfo.dob),
            },
          ],
          { session },
        );

        // --- I. ENROLLMENT ---
        await Enrollment.create(
          [
            {
              studentId: profile._id,
              programId: program._id,
              termId: term?._id,
              semesterId: semester?._id,
              status: "enrolled",
            },
          ],
          { session },
        );

        // --- J. FAMILY INFO (Optional) ---
        if (data.familyInfo) {
          await FamilyInfo.create(
            [
              {
                studentId: profile._id,
                ...data.familyInfo,
              },
            ],
            { session },
          );
        }

        // --- K. EDUCATION HISTORY (Optional) ---
        if (data.educationHistory?.length > 0) {
          const eduData = data.educationHistory.map((edu) => ({
            studentId: profile._id,
            ...edu,
            startDate: new Date(edu.startDate),
            endDateOrResultAwaited: new Date(edu.endDateOrResultAwaited),
          }));
          await EducationHistory.insertMany(eduData, { session });
        }

        // ✅ If code reaches here, the transaction was perfect and will be committed
        results.success++;
        results.details.push({
          index,
          status: "Success",
          studentId,
          name: data.personalInfo.fullName,
        });
      }); // End of transaction block
    } catch (error) {
      // ❌ If any error is thrown inside the transaction block, MongoDB automatically rolls back
      results.failed++;
      results.details.push({
        index,
        status: "Failed",
        error: error.message,
        name: data.personalInfo?.fullName,
      });
    } finally {
      // ✅ Always end the session to prevent memory leaks
      await session.endSession();
    }
  }

  // Final Response Logic
  if (results.total === 1) {
    if (results.success === 1) {
      return res.status(201).json({
        success: true,
        message: "Student registered successfully",
        data: results.details[0],
      });
    } else {
      return res
        .status(400)
        .json({ success: false, error: results.details[0].error });
    }
  } else {
    return res.json({ success: true, results });
  }
});
