// user/routes/userRoutes.js
import express from "express";
import {
  registerApplicant,
  login,
  logoutUser,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRoles,
  verifyEmail,
  createUserByAdmin,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  completeRegistration,
} from "../controller/userController.js";
import { protect } from "../../core/middleware/auth.js";

const router = express.Router();

// Public Routes
router.post("/register-applicant", registerApplicant);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

// Signup — email-verify-first flow (email -> OTP -> create account)
router.post("/register/send-otp", sendRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/register/complete", completeRegistration);

// Protected Routes
router.post("/logout", protect, logoutUser);
router.get("/:id", protect, getUserById);
router.patch("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);
router.post("/by-roles", protect, getUsersByRoles);
router.post("/admin/create", protect, createUserByAdmin);

export default router;