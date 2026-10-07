// controllers/bulkImportController.js
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";
import EducationHistory from "../models/EducationHistory.js";
import Enrollment from "../models/Enrollment.js";
import StudentDocuments from "../models/StudentDocuments.js";
import User from "../../user/model/User.js"; // Import User model
import Department from "../../catalog/model/Department.js";
import Program from "../../catalog/model/Program.js";
import Semester from "../../catalog/model/Semester.js";
import Term from "../../catalog/model/Term.js";
import bcrypt from "bcryptjs";

export const bulkImportStudents = asyncHandler(async (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Students array is required and cannot be empty"
    });
  }

  // Validate batch size
  if (students.length > 100) {
    return res.status(400).json({
      success: false,
      error: "Batch size cannot exceed 100 students"
    });
  }

  const results = {
    successful: [],
    failed: [],
    total: students.length
  };

  // Get all reference data in bulk
  const [departments, programs, semesters, terms] = await Promise.all([
    Department.find().lean(),
    Program.find().lean(),
    Semester.find().lean(),
    Term.find().lean()
  ]);

  // Process students sequentially to avoid overwhelming the database
  for (const [index, studentData] of students.entries()) {
    try {
      // Validate required fields
      if (!studentData.personalInfo || !studentData.personalInfo.fullName || !studentData.personalInfo.email || !studentData.personalInfo.cnic || !studentData.personalInfo.phone) {
        results.failed.push({
          index,
          error: "Missing required personal information (fullName, email, cnic, phone)",
          data: studentData
        });
        continue;
      }

      // Validate and resolve references
      const department = departments.find(dept => 
        dept._id.toString() === studentData.departmentId || 
        dept.code === studentData.departmentCode
      );
      
      const program = programs.find(prog => 
        prog._id.toString() === studentData.programId || 
        prog.code === studentData.programCode
      );
      
      const semester = semesters.find(sem => 
        sem._id.toString() === studentData.semesterId || 
        sem.number === studentData.semesterNumber
      );
      
      const term = terms.find(t => 
        t._id.toString() === studentData.termId || 
        t.name === studentData.termName
      );

      if (!department) {
        results.failed.push({
          index,
          error: "Invalid department reference",
          data: studentData
        });
        continue;
      }

      if (!program) {
        results.failed.push({
          index,
          error: "Invalid program reference",
          data: studentData
        });
        continue;
      }

      // Step 1: Create or find User account
      let user;
      const userEmail = studentData.personalInfo.email.toLowerCase().trim();
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userEmail });
      
      if (existingUser) {
        user = existingUser;
      } else {
        // Create new user with default password and disabled status
        const defaultPassword = await bcrypt.hash("Welcome123!", 12);
        
        user = new User({
          email: userEmail,
          phone: studentData.personalInfo.phone,
          passwordHash: defaultPassword,
          roles: ["student"], // Set role as student
          status: "disabled", // Start as disabled for security
          emailVerified: false
        });

        await user.save();
      }

      // Step 2: Generate unique student ID
      const studentId = await generateStudentId(department.code, program.code);

      // Step 3: Create Student Profile connected to User
      const studentProfile = new StudentProfile({
        userId: user._id, // Connect to user
        studentId, // Essential student ID
        departmentId: department._id,
        programId: program._id,
        semesterId: semester?._id || null,
        termId: term?._id || null,
        status: studentData.status || "active",
        createdFromApplicationId: studentData.createdFromApplicationId || null
      });

      const savedStudent = await studentProfile.save();

      // Step 4: Create Personal Info
      const personalInfoData = {
        studentId: savedStudent._id,
        fullName: studentData.personalInfo.fullName,
        cnic: studentData.personalInfo.cnic,
        phone: studentData.personalInfo.phone,
        email: studentData.personalInfo.email,
        dob: new Date(studentData.personalInfo.dob),
        gender: studentData.personalInfo.gender,
        currentAddress: {
          address: studentData.personalInfo.currentAddress?.address || studentData.personalInfo.currentAddress,
          district: studentData.personalInfo.currentAddress?.district || studentData.personalInfo.city,
          province: studentData.personalInfo.currentAddress?.province || studentData.personalInfo.domicile,
          country: studentData.personalInfo.currentAddress?.country || studentData.personalInfo.country || "Pakistan"
        },
        permanentAddress: {
          address: studentData.personalInfo.permanentAddress?.address || studentData.personalInfo.permanentAddress || studentData.personalInfo.currentAddress?.address || studentData.personalInfo.currentAddress,
          district: studentData.personalInfo.permanentAddress?.district || studentData.personalInfo.city,
          province: studentData.personalInfo.permanentAddress?.province || studentData.personalInfo.domicile,
          country: studentData.personalInfo.permanentAddress?.country || studentData.personalInfo.country || "Pakistan"
        }
      };

      const personalInfo = new PersonalInfo(personalInfoData);

      // Step 5: Create Family Info (optional)
      let familyInfo = null;
      if (studentData.familyInfo) {
        familyInfo = new FamilyInfo({
          studentId: savedStudent._id,
          fatherName: studentData.familyInfo.fatherName,
          fatherCnic: studentData.familyInfo.fatherCnic,
          motherName: studentData.familyInfo.motherName,
          motherCnic: studentData.familyInfo.motherCnic,
          guardianStatus: studentData.familyInfo.guardianStatus || "alive",
          guardianPhone: studentData.familyInfo.guardianPhone,
          fathersProfession: studentData.familyInfo.fathersProfession,
          guardianDesignation: studentData.familyInfo.guardianDesignation,
          incomeBracket: studentData.familyInfo.incomeBracket
        });
      }

      // Step 6: Create Enrollment
      const enrollment = new Enrollment({
        studentId: savedStudent._id,
        programId: program._id,
        termId: term?._id || null,
        semesterId: semester?._id || null,
        status: "enrolled"
      });

      // Step 7: Create Education History (optional)
      let educationHistory = [];
      if (studentData.educationHistory && Array.isArray(studentData.educationHistory)) {
        educationHistory = await EducationHistory.insertMany(
          studentData.educationHistory.map(edu => ({
            studentId: savedStudent._id,
            educationProgram: edu.educationProgram,
            startDate: new Date(edu.startDate),
            endDateOrResultAwaited: edu.endDateOrResultAwaited ? new Date(edu.endDateOrResultAwaited) : null,
            obtainedMarks: edu.obtainedMarks,
            totalMarks: edu.totalMarks,
            percentage: edu.percentage,
            institution: edu.institution,
            board: edu.board,
            grade: edu.grade
          }))
        );
      }

      // Step 8: Save all related records
      const savePromises = [
        personalInfo.save(),
        enrollment.save()
      ];

      if (familyInfo) savePromises.push(familyInfo.save());

      await Promise.all(savePromises);

      results.successful.push({
        index,
        studentId: savedStudent.studentId,
        profileId: savedStudent._id,
        userId: user._id,
        email: user.email,
        name: personalInfoData.fullName,
        status: user.status,
        roles: user.roles
      });


    } catch (error) {
      console.error(`❌ Error creating student at index ${index}:`, error);
      results.failed.push({
        index,
        error: error.message,
        data: studentData
      });
    }
  }

  res.json({
    success: true,
    data: results,
    summary: {
      total: results.total,
      successful: results.successful.length,
      failed: results.failed.length
    }
  });
});

export const getBulkImportTemplate = asyncHandler(async (req, res) => {
  const template = {
    students: [
      {
        // References
        departmentCode: "DP001",
        programCode: "BSDP001", 
        semesterNumber: 1,
        termName: "Fall 2024",
        status: "active",

        // Personal Information (required)
        personalInfo: {
          fullName: "Ali Khan",
          cnic: "12345-6789012-3",
          phone: "+923001234567",
          email: "ali.khan@university.edu.pk",
          dob: "2000-05-15",
          gender: "male",
          currentAddress: {
            address: "123 Main Street, Lahore",
            district: "Lahore",
            province: "Punjab",
            country: "Pakistan"
          },
          permanentAddress: {
            address: "123 Main Street, Lahore",
            district: "Lahore",
            province: "Punjab", 
            country: "Pakistan"
          }
        },

        // Family Information (optional)
        familyInfo: {
          fatherName: "Ahmed Khan",
          fatherCnic: "12345-6789012-4",
          motherName: "Fatima Khan",
          motherCnic: "12345-6789012-5",
          guardianStatus: "alive",
          guardianPhone: "+923001234568",
          fathersProfession: "Business",
          guardianDesignation: "Business Owner",
          incomeBracket: "100000-200000"
        },

        // Education History (optional)
        educationHistory: [
          {
            educationProgram: "Matriculation",
            startDate: "2015-04-01",
            endDateOrResultAwaited: "2017-03-31",
            obtainedMarks: 850,
            totalMarks: 1100,
            percentage: 77.27,
            institution: "ABC School Lahore",
            board: "Lahore Board",
            grade: "A"
          }
        ]
      }
    ]
  };

  res.json({
    success: true,
    data: template,
    instructions: [
      "Each student will automatically get a User account created",
      "User accounts start as 'disabled' for security",
      "Default password: 'Welcome123!' (users should change this)",
      "User role is automatically set to 'student'",
      "Student ID is automatically generated",
      "All personal info fields are required",
      "Family info and education history are optional"
    ]
  });
});

// Helper function to generate unique student ID
async function generateStudentId(departmentCode, programCode) {
  const year = new Date().getFullYear().toString().slice(-2);
  const baseId = `${departmentCode}${programCode || 'GEN'}${year}`;
  
  const lastStudent = await StudentProfile.findOne(
    { studentId: new RegExp(`^${baseId}`) },
    {},
    { sort: { createdAt: -1 } }
  );

  if (!lastStudent) {
    return `${baseId}001`;
  }

  const lastNumber = parseInt(lastStudent.studentId.slice(-3)) || 0;
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  
  return `${baseId}${nextNumber}`;
}