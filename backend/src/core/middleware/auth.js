import { verifyJwt } from "../utils/jwt.js";
import User from "../../user/model/User.js";
import UserSession from "../../user/model/UserSession.js";
import Role from "../models/Role.js";
import { enterCampusContext } from "./campusContext.js";

// How often a request is allowed to "touch" its session's lastSeenAt —
// avoids a DB write on every single authenticated request while still
// keeping "who's currently logged in" reasonably fresh.
const SESSION_TOUCH_THROTTLE_MS = 60 * 1000;

export async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";

    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token" });
    const payload = verifyJwt(token);
    const user = await User.findById(payload.sub).lean();
    if (!user || user.status !== "active")
      return res.status(401).json({ error: "Invalid user" });

    // Tokens issued before session tracking existed have no `jti` — let
    // those through untouched (they'll simply expire naturally) so this
    // doesn't force-logout everyone the moment it ships. Every token
    // issued going forward carries one, so the check applies from here on.
    if (payload.jti) {
      const session = await UserSession.findOne({
        jti: payload.jti,
      }).lean();
      if (!session || !session.isActive) {
        return res
          .status(401)
          .json({ error: "Session expired. Please log in again." });
      }
      const staleMs = Date.now() - new Date(session.lastSeenAt).getTime();
      if (staleMs > SESSION_TOUCH_THROTTLE_MS) {
        UserSession.updateOne(
          { _id: session._id },
          {
            lastSeenAt: new Date(),
            ipAddress: req.ip || req.headers["x-forwarded-for"],
            userAgent: req.headers["user-agent"],
          },
        ).catch(() => {});
      }
      req.sessionJti = payload.jti;
    }

    req.user = user;
    const campusBoundRole = user.roles?.some((role) => ["accountant", "admission"].includes(role));
    if (campusBoundRole && !user.campusId && !user.allCampuses) {
      return res.status(403).json({ error: "This account has not been assigned to a CISD campus. Contact the administrator." });
    }
    req.campus = enterCampusContext(user, req.headers["x-campus-id"]);
    const isCampusWrite = req.method !== "GET" && (/^\/api\/account\//.test(req.originalUrl) || /^\/api\/admissions\//.test(req.originalUrl));
    if (isCampusWrite && (user.roles?.includes("headofaccount") || user.allCampuses) && !user.roles?.includes("admin") && req.campus.allCampuses) {
      return res.status(400).json({ error: "Select a specific campus before creating or changing campus records." });
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.roles?.some((r) => roles.includes(r))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export async function requirePermission(permission) {
  return async (req, res, next) => {
    // optional: if using Role collection with permissions
    const userRoles = req.user.roles || [];
    const roles = await Role.find({ code: { $in: userRoles } }).lean();
    const granted = roles.some((r) =>
      (r.permissions || []).includes(permission)
    );
    if (!granted) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
