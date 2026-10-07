import ActivityLog from "../models/ActivityLog.js";

function buildFilterQuery(query) {
  const {
    module: moduleFilter,
    action,
    method,
    userId,
    search,
    success,
    reviewed,
    dateFrom,
    dateTo,
  } = query;

  const filter = {};
  if (moduleFilter) filter.module = moduleFilter;
  if (action) filter.action = action;
  if (method) filter.method = method.toUpperCase();
  if (userId) filter.userId = userId;
  if (success === "true") filter.success = true;
  if (success === "false") filter.success = false;
  if (reviewed === "true") filter.reviewed = true;
  if (reviewed === "false") filter.reviewed = false;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }
  if (search) {
    filter.$or = [
      { userEmail: { $regex: search, $options: "i" } },
      { route: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }
  return filter;
}

export async function getActivityLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(req.query.limit, 10) || 50),
    );
    const filter = buildFilterQuery(req.query);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("reviewedBy", "email")
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

// For client-side Excel export — same filters as the list, no pagination
// beyond a hard safety cap. This app generates documents client-side
// (see StudentReportController.jsx) rather than via a backend export
// route, so this just returns the raw filtered rows.
export async function exportActivityLogs(req, res, next) {
  try {
    const filter = buildFilterQuery(req.query);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

export async function getActivityLogMeta(req, res, next) {
  try {
    const [modules, actions] = await Promise.all([
      ActivityLog.distinct("module"),
      ActivityLog.distinct("action"),
    ]);
    res.json({ modules: modules.sort(), actions: actions.sort() });
  } catch (err) {
    next(err);
  }
}

export async function reviewActivityLog(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const log = await ActivityLog.findByIdAndUpdate(
      id,
      {
        reviewed: true,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        ...(note !== undefined ? { note } : {}),
      },
      { new: true },
    ).populate("reviewedBy", "email");
    if (!log) return res.status(404).json({ message: "Log entry not found" });
    res.json({ log });
  } catch (err) {
    next(err);
  }
}

export async function unreviewActivityLog(req, res, next) {
  try {
    const { id } = req.params;
    const log = await ActivityLog.findByIdAndUpdate(
      id,
      { reviewed: false, reviewedBy: null, reviewedAt: null },
      { new: true },
    );
    if (!log) return res.status(404).json({ message: "Log entry not found" });
    res.json({ log });
  } catch (err) {
    next(err);
  }
}
