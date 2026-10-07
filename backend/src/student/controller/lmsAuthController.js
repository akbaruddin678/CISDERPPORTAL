import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentAuth from "../models/StudentAuth.js";
import PersonalInfo from "../models/PersonalInfo.js"; 
import StudentDocuments from "../models/StudentDocuments.js"; 
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id, role: "student" },
    process.env.JWT_SECRET || "fallback_secret",
    {
      expiresIn: "7d", // LMS tokens usually last longer
    },
  );
};

export const studentLogin = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email/roll number and password" });
  }

  // 1. Find Auth Record and populate Program
  const studentAuth = await StudentAuth.findOne({
    $or: [{ email: identifier.toLowerCase() }, { rollNumber: identifier }],
  })
    .select("+password")
    .populate({
      path: "studentProfileId",
      populate: { path: "programId", select: "name code" },
    });

  if (!studentAuth) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 2. ✅ ENFORCE LMS STATUS CHECK (Matches Admin Management)
  if (studentAuth.status === "BLOCKED") {
    return res.status(403).json({
      message:
        "LMS access is currently blocked. Please contact the administration.",
    });
  }

  // 3. Check password
  const isMatch = await studentAuth.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 4. ✅ FETCH PERSONAL INFO AND PHOTO DIRECTLY
  const profileId = studentAuth.studentProfileId._id;

  const [personalInfo, documents] = await Promise.all([
    PersonalInfo.findOne({ studentId: profileId }).select("fullName"),
    StudentDocuments.findOne({ studentId: profileId }).select("profilePhoto"),
  ]);

  // 5. Update last login timestamp
  studentAuth.lastLogin = new Date();
  await studentAuth.save({ validateBeforeSave: false });

  // 6. Return token and safe user data to the React frontend
  res.status(200).json({
    success: true,
    token: generateToken(profileId),
    user: {
      profileId: profileId,
      name: personalInfo?.fullName || "Student",
      email: studentAuth.email,
      rollNumber: studentAuth.rollNumber,
      program: studentAuth.studentProfileId?.programId?.name || "N/A",
      profilePhoto: documents?.profilePhoto || null,
    },
  });
});

export const updateStudentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Ensure fields are provided
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Please provide current and new password." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "New password must be at least 8 characters long." });
  }

  // The JWT token contains { id, role } where id is the profileId.
  // Assuming your auth middleware sets req.user from the token.
  const profileId = req.user.id || req.user._id;

  // Find the student auth record using the profileId
  const studentAuth = await StudentAuth.findOne({
    studentProfileId: profileId,
  }).select("+password");

  if (!studentAuth) {
    return res.status(404).json({ message: "Account not found." });
  }

  // Verify the current password
  const isMatch = await studentAuth.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ message: "Incorrect current password." });
  }

  // Update to the new password (the pre-save hook in the model will hash it automatically)
  studentAuth.password = newPassword;
  await studentAuth.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});