import StaffProfile from "../../staff/models/StaffProfile.js";
import Person from "../../core/models/Person.js";
import ClearanceOffice from "../models/ClearanceOffice.js";

export const hasRole = (user, ...roles) => !!user?.roles?.some((r) => roles.includes(r));

// A user can work an office's desk if they hold one of its roles, are listed
// as one of its officers, or are an admin.
export const officeAccess = (user, office) =>
  hasRole(user, "admin") ||
  hasRole(user, ...(office.roles || [])) ||
  (office.officerUserIds || []).some((id) => String(id) === String(user._id));

export async function getActorName(user) {
  const person = await Person.findOne({ userId: user._id }).select("name").lean();
  return person?.name || user.email;
}

// Everything the graduation module needs to know about who is calling:
// which stage desks they hold, which HOD department they are scoped to, and
// which office desks they can work.
export async function resolveViewer(user) {
  const viewer = {
    admin: hasRole(user, "admin"),
    registrar: hasRole(user, "registrar"),
    exam: hasRole(user, "manager", "exam"),
    finance: hasRole(user, "accountant"),
    hod: hasRole(user, "hod"),
    hodDepartmentId: null,
    offices: [],
  };
  viewer.unscoped = viewer.admin || viewer.registrar || viewer.exam || viewer.finance;

  if (viewer.hod) {
    const staff = await StaffProfile.findOne({ userId: user._id }).select("departmentId").lean();
    viewer.hodDepartmentId = staff?.departmentId || null;
  }

  const offices = await ClearanceOffice.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  viewer.offices = offices
    .filter((o) => officeAccess(user, o))
    .map((o) => ({ _id: o._id, key: o.key, name: o.name, autoCheck: o.autoCheck, isActive: o.isActive }));
  viewer.officeKeys = viewer.offices.map((o) => o.key);
  return viewer;
}

// Accepts a raw ObjectId or a populated { _id } document.
const idOf = (v) => (v && v._id ? v._id : v);
const sameId = (a, b) => !!a && !!b && String(idOf(a)) === String(idOf(b));

export const canViewClearance = (viewer, clearance) =>
  viewer.unscoped ||
  (viewer.hod && sameId(viewer.hodDepartmentId, clearance.departmentId)) ||
  (clearance.offices || []).some((o) => viewer.officeKeys.includes(o.key));

export const canActStage = (viewer, stage, clearance) => {
  if (stage === "hod") {
    return viewer.admin || (viewer.hod && sameId(viewer.hodDepartmentId, clearance.departmentId));
  }
  if (stage === "exam") return viewer.admin || viewer.exam;
  if (stage === "finance") return viewer.admin || viewer.finance;
  if (stage === "registrar") return viewer.admin || viewer.registrar;
  return false;
};

export const canCancelClearance = (viewer, clearance) =>
  viewer.admin ||
  viewer.registrar ||
  (viewer.hod && sameId(viewer.hodDepartmentId, clearance.departmentId));
