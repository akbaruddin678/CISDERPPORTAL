import express from "express";
import { recordBiometricPunch } from "../controller/staffAttendanceDeviceController.js";

const router = express.Router();

// Gates a real biometric device/agent's push AND the in-app Kiosk page —
// neither carries a user JWT, so this is a shared-secret header check
// instead of the normal protect() flow. Unlike collegeSyncRoutes.js's
// precedent, there is NO insecure hardcoded fallback: if the secret isn't
// configured, every request is rejected, never silently accepted.
const verifyBiometricSecret = (req, res, next) => {
  const configuredSecret = process.env.BIOMETRIC_DEVICE_SECRET;
  if (!configuredSecret) {
    return res.status(500).json({
      success: false,
      message: "Biometric attendance is not configured on this server.",
    });
  }
  if (req.headers["x-biometric-secret"] !== configuredSecret) {
    return res.status(403).json({ success: false, message: "Invalid or missing device secret." });
  }
  next();
};

router.post("/punch", verifyBiometricSecret, recordBiometricPunch);

export default router;
