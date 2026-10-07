import StaffProfile from "../../staff/models/StaffProfile.js";
import Program from "../../catalog/model/Program.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

// ============================================================================
// Resolves the caller's own department when they are an HOD, so that reads
// and writes on course assignments can be scoped to it. Admin/manager
// accounts are treated as unscoped (full cross-department access).
// ============================================================================
export const resolveHodDepartment = asyncHandler(async (req, res, next) => {
  const roles = req.user?.roles || [];
  // Registrar and the VC's office are university-wide (like admin/manager)
  // — only an actual HOD gets scoped down to their own department.
  if (
    roles.includes("admin") ||
    roles.includes("manager") ||
    roles.includes("registrar") ||
    roles.includes("vc") ||
    roles.includes("vice_vc")
  ) {
    return next();
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("departmentId")
    .lean();

  if (!staffProfile?.departmentId) {
    return res.status(403).json({
      success: false,
      message:
        "Your staff profile is not linked to a department. Contact HR to update your record.",
    });
  }

  req.hodDepartmentId = staffProfile.departmentId;
  next();
});

// Returns true if the given program belongs to the caller's department
// (or the caller is unscoped, i.e. admin/manager).
export const assertProgramInScope = async (req, programId) => {
  if (!req.hodDepartmentId) return true;
  if (!programId) return false;

  const program = await Program.findById(programId).select("departmentId").lean();
  if (!program) return false;

  return String(program.departmentId) === String(req.hodDepartmentId);
};

// Same as assertProgramInScope but for a batch of program IDs at once.
export const assertProgramsInScope = async (req, programIds) => {
  if (!req.hodDepartmentId) return true;

  const uniqueIds = [...new Set(programIds.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) return false;

  const count = await Program.countDocuments({
    _id: { $in: uniqueIds },
    departmentId: req.hodDepartmentId,
  });

  return count === uniqueIds.length;
};
