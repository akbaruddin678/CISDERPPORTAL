import jwt from "jsonwebtoken";

export const authenticateStudent = (req, res, next) => {
  let token;

  // 1. Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Extract token
      token = req.headers.authorization.split(" ")[1];

      // 3. Verify token (MUST match JWT_SECRET in both .env files)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach decoded token to req.user (Do NOT search the Admin DB)
      req.user = decoded;

      return next();
    } catch (error) {
      console.error("Student Token Verification Failed:", error.message);
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, invalid token" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};
