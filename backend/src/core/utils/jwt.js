import jwt from "jsonwebtoken";

export function signJwt(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
}

export function verifyJwt(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Reads a freshly-signed token's own `exp` claim, so callers (e.g. the
// login controller, when creating a UserSession row) don't need to
// duplicate the expiresIn duration parsing themselves.
export function getTokenExpiry(token) {
  const decoded = jwt.decode(token);
  return decoded?.exp ? new Date(decoded.exp * 1000) : null;
}
