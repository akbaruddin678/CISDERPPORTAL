import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Term from "../model/Term.js";

// Terms are one shared collection for both university semester sessions
// (termType "semester"/"short") and college annual sessions (termType
// "annual") — same excludeLevel/level scoping already used for this exact
// purpose in catalog.controller.js's getCompleteCatalog.
export const getAllTerms = asyncHandler(async (req, res) => {
  const { level, excludeLevel } = req.query;
  const query = {};
  if (level === "HSSC") {
    query.termType = "annual";
  } else if (excludeLevel === "HSSC" || (level && level !== "HSSC")) {
    query.termType = { $ne: "annual" };
  }
  const items = await Term.find(query).sort({ startDate: -1 }).lean();
  res.status(200).json({ success: true, count: items.length, data: items });
});

export const getActiveTerms = asyncHandler(async (req, res) => {
  const items = await Term.find({ isActive: true })
    .sort({ startDate: -1 })
    .lean();
  res.status(200).json({ success: true, count: items.length, data: items });
});

export const getTermById = asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id);
  if (!term)
    return res.status(404).json({ success: false, error: "Term not found" });
  res.status(200).json({ success: true, data: term });
});

export const createTerm = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, termType } = req.body;

  if (new Date(endDate) <= new Date(startDate)) {
    return res
      .status(400)
      .json({ success: false, error: "End date must be after start date" });
  }

  const generatedCode = name.replace(/\s+/g, "").toUpperCase();
  const exists = await Term.findOne({
    $or: [{ code: generatedCode }, { name: name.trim() }],
  });

  if (exists)
    return res
      .status(409)
      .json({ success: false, error: "Term already exists" });

  const term = await Term.create({
    name: name.trim(),
    code: generatedCode,
    termType,
    startDate,
    endDate,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
  });

  res.status(201).json({ success: true, message: "Term created", data: term });
});

export const updateTerm = asyncHandler(async (req, res) => {
  const term = await Term.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!term)
    return res.status(404).json({ success: false, error: "Term not found" });
  res.status(200).json({ success: true, message: "Term updated", data: term });
});

export const toggleTermStatus = asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id);
  if (!term)
    return res.status(404).json({ success: false, error: "Term not found" });

  term.isActive = !term.isActive;
  await term.save();
  res
    .status(200)
    .json({
      success: true,
      message: `Term ${term.isActive ? "activated" : "deactivated"}`,
      data: term,
    });
});

export const deleteTerm = asyncHandler(async (req, res) => {
  await Term.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Term deleted" });
});
