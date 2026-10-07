import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { hashPassword } from "../../core/utils/password.js";
import User from "../../user/model/User.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import Role from "../../core/models/Role.js";
import Department from "../../catalog/model/Department.js";
import Program from "../../catalog/model/Program.js";
import Term from "../../catalog/model/Term.js";
import Semester from "../../catalog/model/Semester.js";

// Create staff (no public self-registration)
export const createStaffUser = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    departmentId,
    designation,
    roles = ["staff"],
    permissions = [],
    campusId,
  } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already in use" });
  if (roles.includes("headofaccount") && await User.exists({ roles: "headofaccount" })) {
    return res.status(409).json({ error: "A general Head of Accounts login already exists" });
  }
  if (roles.some((role) => ["accountant", "admission"].includes(role)) && !campusId) {
    return res.status(400).json({ error: "A school must be assigned to account and admission users" });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    roles: Array.from(new Set(["staff", ...roles])),
    status: "active",
    campusId: roles.includes("headofaccount") ? null : (campusId || null),
  });
  const staff = await StaffProfile.create({
    userId: user._id,
    departmentId,
    designation,
    roles,
    permissions,
  });

  res.status(201).json({ userId: user._id, staffId: staff._id });
});

// Assign role to existing user (e.g., promote to admin)
export const assignRoles = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body; // ["admin"] or ["staff","admissions"]
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.roles = Array.from(new Set([...(user.roles || []), ...roles]));
  await user.save();

  res.json({ ok: true, roles: user.roles });
});

// (Optional) Manage Role collection (permissions registry)
export const createRole = asyncHandler(async (req, res) => {
  const { code, name, permissions = [] } = req.body;
  const role = await Role.create({ code, name, permissions });
  res.status(201).json(role);
});

// Catalog helpers (Department/Program/Term/Semester)
export const createDepartment = asyncHandler(async (req, res) => {
  const dep = await Department.create(req.body);
  res.status(201).json(dep);
});
export const createProgram = asyncHandler(async (req, res) => {
  
  
  try {
    const { durationSemesters, ...programData } = req.body;
    
    // Create the program
    const prog = await Program.create({
      ...programData,
      durationSemesters: durationSemesters || 8
    });
    
 
    
    // Create semesters based on duration (fire and forget - don't wait for response)
    const duration = durationSemesters || 8;
    
    for (let i = 1; i <= duration; i++) {
      Semester.create({
        programId: prog._id,
        number: i
      }).then(sem => {
      }).catch(err => {
        console.error(`Failed to create semester ${i}:`, err);
      });
    }
    
    
    // Return the program immediately
    res.status(201).json({
      success: true,
      data: prog,
      message: `Program created successfully. Creating ${duration} semesters...`
    });
    
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create program',
      details: error.message
    });
  }
});
export const createTerm = asyncHandler(async (req, res) => {

  const { name, startDate, endDate, status } = req.body;

  // --- 1. Validate Inputs ---
  if (!name || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Name, Start Date, and End Date are required" });
  }

  // --- 2. Generate the Required Code ---
  // Transforms "Fall 2025" -> "FALL2025"
  const generatedCode = name.replace(/\s+/g, "").toUpperCase();

  // --- 3. Convert Status to Boolean ---
  // Transforms "active" -> true, anything else -> false
  const isStatusBoolean = status === "active";


  // --- 4. Check for Duplicates ---
  const exists = await Term.findOne({
    $or: [{ code: generatedCode }, { name: name.trim() }],
  });

  if (exists) {
    return res
      .status(409)
      .json({ error: "A session with this name already exists" });
  }

  // --- 5. Create in Database ---
  // We pass the PROCESSED variables, not the raw req.body variables
  const term = await Term.create({
    name: name.trim(),
    code: generatedCode, // Fixes 'Path `code` is required'
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: isStatusBoolean, // Fixes 'Cast to Boolean failed'
  });

  res.status(201).json({
    success: true,
    message: "Academic session created successfully",
    data: term,
  });
});

export const createSemester = asyncHandler(async (req, res) => {
  try {
    const sem = await Semester.create(req.body);
    res.status(201).json(sem);
  } catch (error) {
    res.status(400).json({
      error: "Failed to create semester",
      details: error.message,
    });
  }
});
export const getTermById = asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id);
  if (!term) return res.status(404).json({ error: "Session not found" });
  res.json({ success: true, data: term });
});

// UPDATE Term (Handles Info Updates & Status Toggles)
export const updateTerm = asyncHandler(async (req, res) => {

  const { id } = req.params;
  const { name, startDate, endDate, status } = req.body;

  const term = await Term.findById(id);
  if (!term) return res.status(404).json({ error: "Session not found" });

  // 1. Update Name & Code (Only if changed)
  if (name && name !== term.name) {
    const generatedCode = name.replace(/\s+/g, "").toUpperCase();
    const exists = await Term.findOne({
      _id: { $ne: id }, // Exclude current doc
      $or: [{ code: generatedCode }, { name: name.trim() }],
    });

    if (exists)
      return res.status(409).json({ error: "Session name already exists" });

    term.name = name.trim();
    term.code = generatedCode;
  }

  // 2. Update Dates
  if (startDate) term.startDate = new Date(startDate);
  if (endDate) term.endDate = new Date(endDate);

  // Validate Date Logic
  if (term.endDate <= term.startDate) {
    return res.status(400).json({ error: "End date must be after start date" });
  }

  // 3. Update Status (Handle String "active"/"inactive" OR Boolean)
  if (status !== undefined) {
    if (status === "active") term.status = true;
    else if (status === "inactive") term.status = false;
    else term.status = Boolean(status);
  }

  await term.save();
  res.json({
    success: true,
    message: "Session updated successfully",
    data: term,
  });
});

// DELETE Term
export const deleteTerm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const term = await Term.findById(id);

  if (!term) return res.status(404).json({ error: "Session not found" });

  await Term.findByIdAndDelete(id);
  res.json({ success: true, message: "Session deleted successfully" });
});

export const listAllTermsAdmin = asyncHandler(async (req, res) => {
  // .find() with empty brackets returns EVERYTHING
  const terms = await Term.find()
    .sort({ startDate: -1 }) // Sort by newest first
    .lean();

  res.json({
    success: true,
    data: terms,
    count: terms.length,
  });
});
