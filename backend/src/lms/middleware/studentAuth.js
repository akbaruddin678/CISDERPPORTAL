import jwt from "jsonwebtoken";
import { asyncHandler } from "../../accountant/middleware/asyncHandler.js"; 
import StudentAuth from "../../student/models/StudentAuth.js";

export const protectStudent = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }

  try {
    // Verify the LMS token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );

    // In our lmsAuthController, we signed the token with the StudentProfile ID as `id`
    req.studentProfileId = decoded.id;

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token failed" });
  }
});
