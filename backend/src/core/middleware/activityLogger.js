import ActivityLog from "../models/ActivityLog.js";

const SKIP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "oldpassword",
  "confirmpassword",
  "token",
  "otp",
  "secret",
]);

function sanitize(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 4) return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  }
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase())
      ? "[REDACTED]"
      : sanitize(val, depth + 1);
  }
  return out;
}

function deriveModule(url) {
  const segments = url.split("?")[0].split("/").filter(Boolean);
  // segments[0] is always "api" for every mounted router in this app.
  return segments[1] || "unknown";
}

function deriveAction(method, url) {
  const segments = url.split("?")[0].split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const isIdLike =
    last && (/^[0-9a-fA-F]{24}$/.test(last) || /^\d+$/.test(last));
  if (last && !isIdLike && /[a-zA-Z-]/.test(last) && last.length > 2) {
    return last.replace(/-/g, " ").toLowerCase();
  }
  const methodMap = {
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };
  return methodMap[method] || method.toLowerCase();
}

// Logs every mutating request (POST/PUT/PATCH/DELETE) made anywhere in the
// app. Mounted once, globally, before the domain routers — but it only
// READS req.user inside the res "finish" callback, by which point
// whichever router's own `protect` middleware has already attached it, so
// this doesn't need to run after auth or be duplicated into every router.
// GET/HEAD/OPTIONS are skipped by design: this is a change log, not a
// page-view tracker.
export function activityLogger(req, res, next) {
  if (SKIP_METHODS.has(req.method)) return next();

  const start = Date.now();
  res.on("finish", () => {
    const user = req.user || null;
    ActivityLog.create({
      userId: user?._id || null,
      userEmail: user?.email || req.body?.email || "anonymous",
      userRoles: user?.roles || [],
      method: req.method,
      action: deriveAction(req.method, req.originalUrl),
      module: deriveModule(req.originalUrl),
      route: req.originalUrl,
      statusCode: res.statusCode,
      success: res.statusCode < 400,
      durationMs: Date.now() - start,
      ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress,
      userAgent: req.headers["user-agent"],
      requestBody: sanitize(req.body),
      entityId: req.params?.id || null,
    }).catch((err) => {
      console.error("[activityLogger] failed to write log:", err.message);
    });
  });

  next();
}
