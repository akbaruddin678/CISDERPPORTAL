import crypto from "crypto";
import mongoose from "mongoose";
import User from "../model/User.js";
import UserSession from "../model/UserSession.js";
import PendingRegistration from "../model/PendingRegistration.js";
import Person from "../../core/models/Person.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import { hashPassword, comparePassword } from "../../core/utils/password.js";
import { signJwt, getTokenExpiry } from "../../core/utils/jwt.js";
import {
  sendVerificationEmail,
  sendPasswordResetOtpEmail,
  sendRegistrationOtpEmail,
} from "../../core/utils/email.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import School from "../../school/model/School.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- SIGNUP — STEP 1: send a 6-digit code to the email, before any
// account exists (User.passwordHash is required, so we can't create even
// a placeholder User yet — the OTP state lives on PendingRegistration
// instead, keyed by email, until the account is actually created in
// completeRegistration). Re-calling this (Resend) just overwrites the
// same pending record via upsert. ---
export const sendRegistrationOtp = async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "").trim().toLowerCase();
    if (!emailNorm) return res.status(400).json({ error: "Email is required" });
    if (!EMAIL_REGEX.test(emailNorm)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists. Please log in instead.",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await hashPassword(otp);

    await PendingRegistration.findOneAndUpdate(
      { email: emailNorm },
      {
        email: emailNorm,
        otpHash,
        otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
        otpAttempts: 0,
        verifyToken: undefined,
        verifyTokenExpires: undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const sent = await sendRegistrationOtpEmail(emailNorm, otp);
    if (!sent) {
      return res.status(500).json({ error: "Failed to send verification code. Please try again." });
    }

    res.json({
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
};

// --- SIGNUP — STEP 2: verify the OTP, issue a short-lived verifyToken
// that gates the actual account-creation step below. ---
export const verifyRegistrationOtp = async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "").trim().toLowerCase();
    const { otp } = req.body;
    if (!emailNorm || !otp) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const pending = await PendingRegistration.findOne({ email: emailNorm });
    if (!pending || !pending.otpHash || !pending.otpExpires) {
      return res
        .status(400)
        .json({ error: "No verification request found. Please start again." });
    }

    if (pending.otpExpires < Date.now()) {
      pending.otpHash = undefined;
      pending.otpExpires = undefined;
      pending.otpAttempts = 0;
      await pending.save();
      return res
        .status(400)
        .json({ error: "This code has expired. Please request a new one." });
    }

    // Cap guesses so a 6-digit code can't just be brute-forced online —
    // exhausting attempts invalidates the OTP entirely, same as expiry.
    if (pending.otpAttempts >= 5) {
      pending.otpHash = undefined;
      pending.otpExpires = undefined;
      pending.otpAttempts = 0;
      await pending.save();
      return res.status(400).json({
        error: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const ok = await comparePassword(String(otp), pending.otpHash);
    if (!ok) {
      pending.otpAttempts += 1;
      await pending.save();
      return res.status(400).json({ error: "Incorrect code. Please try again." });
    }

    // OTP consumed — issue a short-lived token for the actual account
    // creation so the same code can't be replayed against that step.
    const verifyToken = crypto.randomBytes(32).toString("hex");
    pending.verifyToken = verifyToken;
    pending.verifyTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    pending.otpHash = undefined;
    pending.otpExpires = undefined;
    pending.otpAttempts = 0;
    await pending.save();

    res.json({ success: true, verifyToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify code" });
  }
};

// --- SIGNUP — STEP 3: email is verified, now actually create the
// account with the chosen name/password. ---
export const completeRegistration = async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "").trim().toLowerCase();
    const { verifyToken, name, password, confirmPassword, campusId } = req.body;

    if (!emailNorm || !verifyToken || !name || !password || !confirmPassword || !campusId) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!mongoose.isValidObjectId(campusId) || !(await School.exists({ _id: campusId, isActive: true }))) {
      return res.status(400).json({ error: "Please select a valid CISD campus" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const pending = await PendingRegistration.findOne({
      email: emailNorm,
      verifyToken,
      verifyTokenExpires: { $gt: Date.now() },
    });
    if (!pending) {
      return res.status(400).json({
        error: "Verification session expired. Please verify your email again.",
      });
    }

    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(409).json({
        error: "An account with this email already exists. Please log in instead.",
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: emailNorm,
      passwordHash,
      roles: ["applicant"],
      status: "active",
      emailVerified: true,
      campusId,
    });
    await Person.create({ userId: user._id, name: name.trim() });

    await PendingRegistration.deleteOne({ _id: pending._id });

    res.status(201).json({
      success: true,
      message: "Account created successfully! You can now log in.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete registration" });
  }
};

export const registerApplicant = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await hashPassword(password);

    let userRoles = ["applicant"];
    if (role && req.user && req.user.roles.includes("admin")) {
      userRoles = [role];
    }

    // 1. Generate Token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    // Unverified registrations are purged by the applicant-cleanup cron
    // (see user/utils/applicantCleanupCron.js) once this passes, freeing
    // the email address up for a fresh signup attempt.
    const verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 2. Create Inactive User
    const user = await User.create({
      email: emailNorm,
      passwordHash,
      roles: userRoles,
      status: "pending_verification",
      emailVerified: false,
      verificationToken,
      verificationExpires,
    });

    await Person.create({ userId: user._id, name: name.trim() });

    // 3. Send Email
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message:
        "Account created! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// --- LOGIN (The Gatekeeper) ---
export const login = async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email: emailNorm });

    // Check User Existence
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found", type: "USER_NOT_FOUND" });
    }

    // BLOCK INACTIVE/DISABLED USERS
    if (user.status === "disabled" || user.status === "inactive") {
      return res.status(403).json({
        error:
          "Your account has been deactivated. Please contact the administrator.",
        type: "ACCOUNT_DISABLED",
      });
    }

    // BLOCK IF NOT VERIFIED
    if (user.status === "pending_verification" || !user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified. Please check your inbox.",
        type: "NOT_VERIFIED",
      });
    }

    // Check Password
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return res
        .status(401)
        .json({ error: "Invalid credentials", type: "INVALID_CREDENTIALS" });
    }

    // Success Logic: Fetch Person AND Staff details
    const person = await Person.findOne({ userId: user._id }).lean();

    // ✅ NEW: Fetch the staff profile to get the department ID
    const staffProfile = await StaffProfile.findOne({
      userId: user._id,
    }).lean();
    const campus = user.campusId ? await School.findById(user.campusId).lean() : null;

    const jti = crypto.randomUUID();
    const token = signJwt({
      sub: user._id.toString(),
      roles: user.roles,
      jti,
    });
    const expiresAt = getTokenExpiry(token) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Promise.all([
      User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }),
      UserSession.create({
        userId: user._id,
        jti,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"],
        expiresAt,
      }),
    ]);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        emailVerified: user.emailVerified,
        status: user.status,
        name: person ? person.name : null,
        // ✅ NEW: Send the department ID to the frontend
        departmentId: staffProfile ? staffProfile.departmentId : null,
        campusId: user.campusId || null,
        campusAccess: user.roles.includes("admin") || user.roles.includes("headofaccount") ? "all" : "assigned",
        campus: campus ? {
          id: campus._id,
          name: campus.name,
          code: campus.code,
          logoUrl: campus.logoUrl,
        } : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

// --- LOGOUT (revokes just this device's session) ---
export const logoutUser = async (req, res) => {
  try {
    if (req.sessionJti) {
      await UserSession.updateOne(
        { jti: req.sessionJti },
        { isActive: false, revokedAt: new Date(), revokedReason: "logout" },
      );
    }
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
};

// --- VERIFY EMAIL (The Unlocker) ---
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Missing token" });

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    // Unlock User
    user.status = "active";
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
};

// --- FORGOT PASSWORD — STEP 1: request an OTP ---
// Applicant accounts only: everyone else on this shared login page (staff,
// students, accountants, ...) is created/managed by an admin and must go
// through them to reset a password, not this self-service OTP flow.
export const forgotPassword = async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "")
      .trim()
      .toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with this email", type: "USER_NOT_FOUND" });
    }

    if (!user.roles.includes("applicant")) {
      return res.status(403).json({
        error:
          "Password reset via this page is only available for applicant accounts. Please contact the administrator.",
        type: "NOT_APPLICANT",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtpHash = await hashPassword(otp);
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetOtpAttempts = 0;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    const sent = await sendPasswordResetOtpEmail(user.email, otp);
    if (!sent) {
      return res.status(500).json({ error: "Failed to send OTP email. Please try again." });
    }

    res.json({ success: true, message: "A 6-digit code has been sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process request" });
  }
};

// --- FORGOT PASSWORD — STEP 2: verify the OTP, issue a reset token ---
export const verifyResetOtp = async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const { otp } = req.body;
    if (!emailNorm || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: emailNorm });
    if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
      return res
        .status(400)
        .json({ error: "No password reset request found. Please start again." });
    }

    if (user.resetOtpExpires < Date.now()) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      await user.save();
      return res
        .status(400)
        .json({ error: "This code has expired. Please request a new one." });
    }

    // Cap guesses so a 6-digit code can't just be brute-forced online —
    // exhausting attempts invalidates the OTP entirely, same as expiry.
    if (user.resetOtpAttempts >= 5) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      await user.save();
      return res.status(400).json({
        error: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const ok = await comparePassword(String(otp), user.resetOtpHash);
    if (!ok) {
      user.resetOtpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: "Incorrect code. Please try again." });
    }

    // OTP consumed — issue a short-lived token for the actual password
    // change so the same code can't be replayed against reset-password.
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    res.json({ success: true, resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify code" });
  }
};

// --- FORGOT PASSWORD — STEP 3: set the new password ---
export const resetPassword = async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const { resetToken, password, confirmPassword } = req.body;

    if (!emailNorm || !resetToken || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      email: emailNorm,
      resetToken,
      resetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Reset session expired. Please start again." });
    }

    user.passwordHash = await hashPassword(password);
    user.passwordChangedAt = new Date();
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    // Successfully receiving and using the OTP is itself proof of email
    // ownership — at least as strong as clicking the verification link —
    // so this also unblocks a still-unverified applicant instead of
    // leaving them able to reset their password but still locked out at
    // login afterward.
    if (!user.emailVerified) {
      user.emailVerified = true;
      user.status = "active";
      user.verificationToken = undefined;
      user.verificationExpires = undefined;
    }

    await user.save();

    await UserSession.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false, revokedAt: new Date(), revokedReason: "password_reset" },
    );

    res.json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Helper for permissions
function canActOn(reqUser, targetUserId) {
  const isSelf = reqUser?._id?.toString() === targetUserId?.toString();
  const isAdmin = (reqUser?.roles || []).includes("admin");
  return isSelf || isAdmin;
}

// ==========================================
// 3. GET USER BY ID (Fixed for updates/viewing)
// ==========================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid user id" });

    if (!canActOn(req.user, id)) return res.status(403).json({ error: "Forbidden" });

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ FIX: Determine Name
    let finalName = null;
    if (user.roles.includes("student") || user.roles.includes("applicant")) {
      const studentInfo = await PersonalInfo.findOne({ email: user.email }).lean();
      finalName = studentInfo?.fullName;
    } else {
      const person = await Person.findOne({ userId: id }).lean();
      finalName = person?.name;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        status: user.status,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
      },
      person: finalName ? { name: finalName } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch user" });
  }
};

// PATCH /api/user/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid user id" });

    if (!canActOn(req.user, id))
      return res.status(403).json({ error: "Forbidden" });

    // Extract fields
    const { email, name, password, confirmPassword, currentPassword, status, role, campusId } =
      req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // --- 1. Status Update (Admin Only) ---
    if (status) {
      if (!req.user.roles.includes("admin")) {
        return res
          .status(403)
          .json({ error: "Only admins can change user status" });
      }
      user.status = status; // active, inactive, suspended
    }

    // --- 1b. Role Update (Admin Only) ---
    // The User Management form is a single "Primary Role" select, and
    // creating a user already stores it the same way (`roles: [role]`) —
    // this mirrors that here. Previously this whole block was missing, so
    // the "Save Changes" button on an edit silently did nothing to the
    // role no matter what was picked, which is why roles like VC could
    // never actually be assigned to an existing user from this screen.
    if (role) {
      if (!req.user.roles.includes("admin")) {
        return res
          .status(403)
          .json({ error: "Only admins can change user roles" });
      }
      if (user._id.toString() === req.user._id.toString()) {
        return res
          .status(400)
          .json({ error: "You cannot change your own role. Ask another admin." });
      }
      if (role === "headofaccount" && await User.exists({ _id: { $ne: user._id }, roles: "headofaccount" })) {
        return res.status(409).json({ error: "A general Head of Accounts login already exists" });
      }
      user.roles = [role];
    }

    if (campusId !== undefined) {
      if (!req.user.roles.includes("admin")) return res.status(403).json({ error: "Only admins can assign schools" });
      if (campusId && !mongoose.isValidObjectId(campusId)) return res.status(400).json({ error: "Invalid school id" });
      if (campusId && !(await School.exists({ _id: campusId, isActive: true }))) return res.status(400).json({ error: "School not found or inactive" });
      user.campusId = campusId || null;
    }
    if (user.roles.some((value) => ["accountant", "admission"].includes(value)) && !user.campusId) {
      return res.status(400).json({ error: "A school must be assigned to account and admission users" });
    }

    // --- 2. Update Email ---
    if (email && email !== user.email) {
      const emailNorm = String(email).trim().toLowerCase();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm);
      if (!emailOk)
        return res.status(400).json({ error: "Invalid email format" });

      const exists = await User.findOne({ email: emailNorm, _id: { $ne: id } });
      if (exists)
        return res.status(409).json({ error: "Email already in use" });

      user.email = emailNorm;
    }

    // --- 3. Update Password ---
    let passwordChanged = false;
    if (password || confirmPassword) {
      if (!password || !confirmPassword)
        return res.status(400).json({ error: "Both password fields required" });
      if (password !== confirmPassword)
        return res.status(400).json({ error: "Passwords do not match" });
      if (password.length < 8)
        return res.status(400).json({ error: "Password too short" });

      const isAdmin = (req.user?.roles || []).includes("admin");
      if (!isAdmin) {
        if (!currentPassword)
          return res.status(400).json({ error: "currentPassword is required" });
        const ok = await comparePassword(currentPassword, user.passwordHash);
        if (!ok)
          return res
            .status(401)
            .json({ error: "Current password is incorrect" });
      }
      user.passwordHash = await hashPassword(password);
      user.passwordChangedAt = new Date();
      passwordChanged = true;
    }

    await user.save();

    // Force-logout: the moment a password changes — self-service or an
    // admin resetting someone else's — every session that user had open
    // (any device, any tab) is revoked immediately. Their next request
    // with the old token gets rejected by `protect`'s session check, and
    // they'll see a "please log in again" prompt.
    if (passwordChanged) {
      await UserSession.updateMany(
        { userId: user._id, isActive: true },
        { isActive: false, revokedAt: new Date(), revokedReason: "password_changed" },
      );
    }

    // --- 4. Update Person Name ---
    if (typeof name === "string" && name.trim().length > 0) {
      await Person.updateOne(
        { userId: id },
        { $set: { name: name.trim() } },
        { upsert: true },
      );
    }

    const person = await Person.findOne({ userId: id }).lean();
    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        status: user.status,
        campusId: user.campusId,
      },
      person: person ? { name: person.name } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only Admin can delete
    if (!req.user.roles.includes("admin")) {
      return res
        .status(403)
        .json({ error: "Admin access required to delete users" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account" });
    }

    // Delete associated records
    await Person.deleteOne({ userId: id });
    await StaffProfile.deleteOne({ userId: id }); // Use the imported model
    await User.findByIdAndDelete(id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, campusId } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return res
        .status(400)
        .json({ error: "All fields including Role are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (!req.user || !req.user.roles.includes("admin")) {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const campusRequiredRoles = ["accountant", "admission"];
    if (campusRequiredRoles.includes(role) && !campusId) {
      return res.status(400).json({ error: "A school must be assigned to account and admission users" });
    }
    if (campusId && (!mongoose.isValidObjectId(campusId) || !(await School.exists({ _id: campusId, isActive: true })))) {
      return res.status(400).json({ error: "School not found or inactive" });
    }
    if (role === "headofaccount" && await User.exists({ roles: "headofaccount" })) {
      return res.status(409).json({ error: "A general Head of Accounts login already exists" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email: emailNorm,
      passwordHash,
      roles: [role],
      status: "active",
      emailVerified: true,
      campusId: role === "headofaccount" ? null : (campusId || null),
    });

    await Person.create({ userId: user._id, name: name.trim() });

    res.status(201).json({
      success: true,
      message: `User created successfully with role: ${role}`,
      user: { id: user._id, email: user.email, roles: user.roles, campusId: user.campusId },
    });
  } catch (err) {
    console.error("Admin Create User Error:", err);
    res
      .status(500)
      .json({ error: "Failed to create user", details: err.message });
  }
};

export const getUsersByRoles = async (req, res) => {
  try {
    const { roles, page = 1, limit = 10, search = "" } = req.body;

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ error: "Roles array is required" });
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const pipeline = [
      { $match: { roles: { $in: roles } } },

      {
        $lookup: {
          from: "people",
          localField: "_id",
          foreignField: "userId",
          as: "personDetails",
        },
      },
      { $unwind: { path: "$personDetails", preserveNullAndEmptyArrays: true } },

 
      {
        $lookup: {
          from: "personalinfos",
          localField: "email",
          foreignField: "email",
          as: "studentDetails",
        },
      },
      {
        $unwind: { path: "$studentDetails", preserveNullAndEmptyArrays: true },
      },
    ];

    if (search && search.trim() !== "") {
      pipeline.push({
        $match: {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { "personDetails.name": { $regex: search, $options: "i" } },
            { "studentDetails.fullName": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const paginatedPipeline = [
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNumber },
            { $project: { passwordHash: 0 } },
          ],
        },
      },
    ];

    const result = await User.aggregate(paginatedPipeline);
    const rawData = result[0]?.data || [];

    const formattedData = rawData.map((user) => {
      const finalName =
        user.personDetails?.name || user.studentDetails?.fullName || "N/A";

      return {
        user: {
          _id: user._id,
          email: user.email,
          roles: user.roles,
          status: user.status,
          emailVerified: user.emailVerified,
          campusId: user.campusId || null,
        },
        person: { name: finalName }, 
      };
    });

    const totalCount = result[0]?.metadata[0]?.total || 0;

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
      },
    });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
