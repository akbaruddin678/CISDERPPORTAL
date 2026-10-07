import jwt from "jsonwebtoken";

export const verifyWebhookToken = (req, res, next) => {
  let token;

  // 1. Check for Authorization Header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from string "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_WEBHOOK_SECRET);

      // Check if it's our specific webhook token
      if (decoded.service !== "EzPay_Integration") {
        throw new Error("Invalid Token Scope");
      }

      // Success! Proceed to controller
      next();
    } catch (error) {
      console.error(
        "❌ [Webhook Auth] Token verification failed:",
        error.message,
      );
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};
