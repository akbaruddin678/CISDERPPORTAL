import UserSession from "../model/UserSession.js";

// "Online now" vs "idle" is inferred from lastSeenAt freshness — sessions
// are only ever touched by `protect` (see core/middleware/auth.js), so a
// stale lastSeenAt means the user simply hasn't made a request recently,
// not that anything is wrong with the session itself.
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export async function getActiveSessions(req, res, next) {
  try {
    const sessions = await UserSession.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastSeenAt: -1 })
      .populate("userId", "email roles status")
      .lean();

    const now = Date.now();
    const rows = sessions
      // A revoked/deleted user's session shouldn't be reported as "logged
      // in" even if the row itself hasn't expired/been cleaned up yet.
      .filter((s) => s.userId)
      .map((s) => ({
        _id: s._id,
        user: s.userId,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        loginAt: s.loginAt,
        lastSeenAt: s.lastSeenAt,
        expiresAt: s.expiresAt,
        online: now - new Date(s.lastSeenAt).getTime() <= ONLINE_THRESHOLD_MS,
      }));

    res.json({ sessions: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await UserSession.findByIdAndUpdate(
      id,
      { isActive: false, revokedAt: new Date(), revokedReason: "admin_revoked" },
      { new: true },
    );
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
}
