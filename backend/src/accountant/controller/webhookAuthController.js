import jwt from "jsonwebtoken";
import { asyncHandler } from "../middleware/asyncHandler.js";

// POST /api/webhooks/login
export const loginWebhookUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // 1. Validate Input
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password required" });
  }

  // 2. Verify Credentials (from .env)
  if (
    username === process.env.EZPAY_API_USER &&
    password === process.env.EZPAY_API_PASS
  ) {
    // 3. Generate Token
    // Expires in 1 hour (EzPay must refresh token if it expires)
    const token = jwt.sign(
      { service: "EzPay_Integration", role: "webhook_client" },
      process.env.JWT_WEBHOOK_SECRET,
      { expiresIn: "1h" },
    );

  

    return res.status(200).json({
      success: true,
      access_token: token,
    
    });
  }

 
  return res
    .status(401)
    .json({ success: false, message: "Invalid credentials" });
});
