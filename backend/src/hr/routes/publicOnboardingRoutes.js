import express from "express";
import multer from "multer";
import {
  submitOnboardingRequest,
  sendOnboardingOtp,
  verifyOnboardingOtp,
} from "../controller/publicOnboardingController.js";

// No `protect`/`requireRole` on this router at all — this is the one
// intentionally public, unauthenticated entry point for HR onboarding
// (/teacher-onboarding). Submission is gated by an email OTP verification
// (send-otp/verify-otp below) instead of a login. It only ever creates a
// pending JobApplication (source:"public_onboarding") — never a live
// User/StaffProfile, see publicOnboardingController.js.
const onboardingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const imageTypes = ["image/png", "image/jpeg", "image/jpg"];
    const docTypes = [...imageTypes, "application/pdf"];
    const allowed = file.fieldname === "profilePhoto" ? imageTypes : docTypes;
    if (!allowed.includes(file.mimetype)) return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
});

const router = express.Router();

router.post("/send-otp", sendOnboardingOtp);
router.post("/verify-otp", verifyOnboardingOtp);

router.post(
  "/",
  onboardingUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  submitOnboardingRequest,
);

export default router;
