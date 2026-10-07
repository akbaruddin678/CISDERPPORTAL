// One source of truth for the roles HR can assign to an employee. Ids match
// the backend User.roles enum; `needsDept` roles are only meaningful inside a
// department (the backend rejects them without one).
export const ROLE_GROUPS = {
  "Teaching & Academic": [
    { id: "teacher", label: "Teacher / Faculty", hint: "Teaches courses, marks attendance and enters marks", needsDept: true },
    { id: "hod", label: "Head of Department", hint: "Runs a department: students, courses, teachers", needsDept: true },
    { id: "course coordinator", label: "Course Coordinator", hint: "Coordinates course delivery" },
    { id: "head_of_academia", label: "Head of Academia", hint: "University-wide academic oversight" },
  ],
  "Administration & Finance": [
    { id: "vc", label: "Vice Chancellor", hint: "Executive dashboard and reports" },
    { id: "vice_vc", label: "Pro / Vice VC", hint: "Deputy to the Vice Chancellor" },
    { id: "registrar", label: "Registrar", hint: "Records, compliance, graduation approval" },
    { id: "accountant", label: "Accountant", hint: "Fees, challans, scholarships" },
    { id: "admission", label: "Admission Office", hint: "Applications and admission process" },
    { id: "hr", label: "HR Manager", hint: "Employees, payroll, leave" },
    { id: "exam", label: "Examination Dept", hint: "Exams, results, transcripts" },
    { id: "manager", label: "General Manager", hint: "Office / exam-office management access" },
  ],
  "Clearance & Services": [
    { id: "library", label: "Library Officer", hint: "Library clearance desk" },
    { id: "transport", label: "Transport Officer", hint: "Transport allocation and clearance" },
    { id: "hostel", label: "Hostel Officer", hint: "Hostel allocation and clearance" },
    { id: "it_labs", label: "IT & Labs Officer", hint: "IT and labs clearance desk" },
    { id: "clearance_officer", label: "Other Clearance Officer", hint: "Any additional clearance office" },
  ],
  "General": [
    { id: "staff", label: "General Staff", hint: "Class-IV, guards and other support staff" },
    { id: "viwer", label: "Viewer (read-only)", hint: "Can look but not change" },
  ],
};

export const ALL_ROLES = Object.values(ROLE_GROUPS).flat();
const BY_ID = Object.fromEntries(ALL_ROLES.map((r) => [r.id, r]));

export const isKnownRole = (id) => Boolean(BY_ID[id]);
export const roleLabel = (id) => BY_ID[id]?.label || String(id).replace(/_/g, " ");
export const needsDepartment = (roleIds) =>
  roleIds.some((id) => BY_ID[id]?.needsDept);
export const groupOfRole = (id) =>
  Object.entries(ROLE_GROUPS).find(([, roles]) => roles.some((r) => r.id === id))?.[0];

// Dedicated HR dashboard modules — Teacher / HOD / VC / Head of Academia each
// get their own locked-to-that-role management screen, with everyone else
// falling into "Other". `roles: null` marks the complement bucket. Membership
// is live (computed from User.roles at render time), not a stored
// assignment — a staff member with multiple roles appears in every module
// that matches, and changing their roles moves them between modules on the
// next render.
export const STAFF_MODULES = [
  { key: "teacher", label: "Teacher Management", roles: ["teacher"] },
  { key: "hod", label: "HOD Management", roles: ["hod"] },
  { key: "vc", label: "VC Management", roles: ["vc", "vice_vc"] },
  { key: "head_of_academia", label: "Head of Academia Management", roles: ["head_of_academia"] },
  { key: "other", label: "Other Staff Management", roles: null },
];
const NAMED_MODULE_ROLE_IDS = STAFF_MODULES.filter((m) => m.roles).flatMap((m) => m.roles);

export const getStaffModule = (key) => STAFF_MODULES.find((m) => m.key === key) || null;

export const staffMatchesModule = (staff, moduleDef) => {
  const roleIds = staff.userId?.roles || [];
  if (!moduleDef.roles) return roleIds.some((r) => !NAMED_MODULE_ROLE_IDS.includes(r));
  return roleIds.some((r) => moduleDef.roles.includes(r));
};
