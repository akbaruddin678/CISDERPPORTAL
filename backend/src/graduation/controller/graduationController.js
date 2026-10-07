import mongoose from "mongoose";
import StudentProfile, { transitionStatus } from "../../student/models/StudentProfile.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import Program from "../../catalog/model/Program.js";
import User from "../../user/model/User.js";
import GraduationClearance from "../models/GraduationClearance.js";
import ClearanceOffice from "../models/ClearanceOffice.js";
import {
  buildAcademicReport,
  evaluateGate,
} from "../services/graduationAcademic.service.js";
import {
  buildExamOfficeChecks,
  getFinanceSnapshot,
  getOfficeAutoCheck,
} from "../services/graduationChecks.service.js";
import {
  canActStage,
  canCancelClearance,
  canViewClearance,
  getActorName,
  resolveViewer,
} from "../services/graduationAccess.js";

// ============================================================================
// Errors thrown by the workflow are FlowErrors so every guard reads as a
// plain `throw` (also inside a transaction) and still maps to a clean 4xx.
// ============================================================================
class FlowError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof FlowError) {
      return res.status(err.status).json({ success: false, message: err.message, ...err.extra });
    }
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That record already exists or was changed by someone else. Refresh and try again.",
      });
    }
    next(err);
  }
};

const isId = (v) => mongoose.isValidObjectId(v);
const text = (v) => String(v ?? "").trim();

const requireRemarks = (v, what = "A remark") => {
  const t = text(v);
  if (!t) throw new FlowError(400, `${what} is required.`);
  return t;
};

const OPEN_STAGE_LABEL = {
  hod: "the HOD",
  exam: "the Examination Office",
  offices: "the auxiliary offices",
  finance: "Accounts & Finance",
  registrar: "the Registrar",
};

const requireStage = (clearance, stage) => {
  if (clearance.status !== "in_progress") {
    throw new FlowError(409, `This clearance is ${clearance.status.replace("_", " ")}.`);
  }
  if (clearance.currentStage !== stage) {
    throw new FlowError(
      409,
      `This clearance is currently with ${OPEN_STAGE_LABEL[clearance.currentStage] || clearance.currentStage}, not ${OPEN_STAGE_LABEL[stage]}.`,
    );
  }
};

const log = (clearance, actor, entry) => {
  clearance.history.push({
    at: new Date(),
    by: actor.user._id,
    byName: actor.name,
    remarks: "",
    ...entry,
  });
};

const stamp = (actor) => ({
  actedBy: actor.user._id,
  actedByName: actor.name,
  actedAt: new Date(),
});

async function getActor(req) {
  return { user: req.user, name: await getActorName(req.user) };
}

async function loadClearance(id, session) {
  if (!isId(id)) throw new FlowError(404, "Clearance not found.");
  const q = GraduationClearance.findById(id);
  if (session) q.session(session);
  const clearance = await q;
  if (!clearance) throw new FlowError(404, "Clearance not found.");
  return clearance;
}

// ---------- shaping helpers ----------

async function studentSummaries(studentIds) {
  const ids = [...new Set(studentIds.map(String))];
  const [profiles, infos] = await Promise.all([
    StudentProfile.find({ _id: { $in: ids } }).select("studentId status").lean(),
    PersonalInfo.find({ studentId: { $in: ids } }).select("studentId fullName cnic phone email").lean(),
  ]);
  const infoMap = new Map(infos.map((i) => [String(i.studentId), i]));
  return new Map(
    profiles.map((p) => {
      const info = infoMap.get(String(p._id)) || {};
      return [
        String(p._id),
        {
          _id: p._id,
          regNo: p.studentId,
          status: p.status,
          fullName: info.fullName || "Unnamed student",
          cnic: info.cnic || "",
          phone: info.phone || "",
          email: info.email || "",
        },
      ];
    }),
  );
}

const stepView = (s) =>
  s && {
    status: s.status,
    actedByName: s.actedByName || "",
    actedAt: s.actedAt || null,
    remarks: s.remarks || "",
    confirmations: s.confirmations || [],
  };

const clearanceView = (c, student) => ({
  _id: c._id,
  status: c.status,
  currentStage: c.currentStage,
  student: student || null,
  program: c.programId && typeof c.programId === "object" ? { _id: c.programId._id, name: c.programId.name } : null,
  department:
    c.departmentId && typeof c.departmentId === "object"
      ? { _id: c.departmentId._id, name: c.departmentId.name }
      : null,
  semesterNumber: c.semesterId?.number ?? null,
  startedByName: c.startedByName || "",
  startedAt: c.createdAt,
  updatedAt: c.updatedAt,
  stages: {
    hod: stepView(c.stages?.hod),
    exam: stepView(c.stages?.exam),
    finance: stepView(c.stages?.finance),
    registrar: stepView(c.stages?.registrar),
  },
  offices: (c.offices || []).map((o) => ({
    key: o.key,
    name: o.name,
    autoCheck: o.autoCheck,
    ...stepView(o),
  })),
  feeReceived: !!c.feeReceived,
  cgpa: c.transcript?.cgpa ?? null,
  graduatedAt: c.graduatedAt || null,
  graduationYear: c.graduationYear || null,
  degreeSerial: c.degreeSerial || "",
  cancelReason: c.cancelReason || "",
  history: c.history || [],
});

const populateClearance = (q) =>
  q
    .populate("programId", "name code")
    .populate("departmentId", "name code")
    .populate("semesterId", "number");

// Sends the viewer's list scope as a Mongo filter (or throws when the caller
// has no graduation role at all).
function scopeFilter(viewer) {
  if (viewer.unscoped) return {};
  const or = [];
  if (viewer.hod && viewer.hodDepartmentId) or.push({ departmentId: viewer.hodDepartmentId });
  if (viewer.officeKeys.length) or.push({ "offices.key": { $in: viewer.officeKeys } });
  if (!or.length) throw new FlowError(403, "You don't have access to graduation clearance.");
  return { $or: or };
}

async function studentIdsMatching(q) {
  const term = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(term, "i");
  const [byReg, byInfo] = await Promise.all([
    StudentProfile.find({ studentId: rx }).select("_id").limit(200).lean(),
    PersonalInfo.find({ $or: [{ fullName: rx }, { cnic: rx }] }).select("studentId").limit(200).lean(),
  ]);
  return [...byReg.map((s) => s._id), ...byInfo.map((i) => i.studentId)];
}

const PERMISSIONS = (viewer, c) => {
  const open = c.status === "in_progress";
  const officeKeysActionable = open && c.currentStage === "offices"
    ? (c.offices || [])
        .filter((o) => viewer.officeKeys.includes(o.key) && ["pending", "rejected"].includes(o.status))
        .map((o) => o.key)
    : [];
  return {
    hod: open && c.currentStage === "hod" && canActStage(viewer, "hod", c),
    exam: open && c.currentStage === "exam" && canActStage(viewer, "exam", c),
    finance: open && c.currentStage === "finance" && canActStage(viewer, "finance", c),
    registrar: open && c.currentStage === "registrar" && canActStage(viewer, "registrar", c),
    officeKeys: officeKeysActionable,
    cancel: open && canCancelClearance(viewer, c),
  };
};

// ============================================================================
// Who am I (drives the front-end tabs)
// ============================================================================
export const getMe = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  res.json({
    success: true,
    data: {
      admin: viewer.admin,
      hod: viewer.hod,
      exam: viewer.exam,
      finance: viewer.finance,
      registrar: viewer.registrar,
      offices: viewer.offices,
    },
  });
});

// ============================================================================
// HOD: candidates + live eligibility
// ============================================================================
export const getCandidates = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  if (!viewer.admin && !viewer.hod) throw new FlowError(403, "Only a Head of Department can start clearance.");

  let departmentId = viewer.hodDepartmentId;
  if (viewer.admin) {
    departmentId = isId(req.query.departmentId) ? req.query.departmentId : null;
  } else if (!departmentId) {
    throw new FlowError(403, "Your staff profile is not linked to a department. Contact HR.");
  }

  const programQuery = departmentId ? { departmentId } : {};
  if (isId(req.query.programId)) programQuery._id = req.query.programId;
  const programs = await Program.find(programQuery).select("name durationStages").lean();
  const programMap = new Map(programs.map((p) => [String(p._id), p]));

  // Eligibility (CGPA/credits/curriculum) is decided once, up front, by the
  // Examination Office's Degree Audit (exam/controllers/degreeAuditController.js)
  // — a candidate here is simply any academically_completed student who
  // hasn't started a clearance yet. No live final-semester filtering needed
  // anymore; that check already happened when the audit ran.
  const students = await StudentProfile.find({
    programId: { $in: programs.map((p) => p._id) },
    status: "academically_completed",
    isTrashed: { $ne: true },
    feeActivated: { $ne: false },
  })
    .select("studentId programId semesterId")
    .populate("semesterId", "number")
    .lean();

  const running = await GraduationClearance.find({
    status: "in_progress",
    studentId: { $in: students.map((s) => s._id) },
  })
    .select("studentId")
    .lean();
  const runningSet = new Set(running.map((r) => String(r.studentId)));

  const infos = await PersonalInfo.find({ studentId: { $in: students.map((s) => s._id) } })
    .select("studentId fullName cnic")
    .lean();
  const infoMap = new Map(infos.map((i) => [String(i.studentId), i]));

  const q = text(req.query.q).toLowerCase();
  const rows = students
    .filter((s) => !runningSet.has(String(s._id)))
    .map((s) => {
      const program = programMap.get(String(s.programId));
      const info = infoMap.get(String(s._id)) || {};
      const semesterNumber = s.semesterId?.number ?? null;
      const durationStages = program?.durationStages ?? null;
      return {
        _id: s._id,
        regNo: s.studentId,
        fullName: info.fullName || "Unnamed student",
        cnic: info.cnic || "",
        programId: s.programId,
        programName: program?.name || "",
        semesterNumber,
        durationStages,
        isFinalSemester:
          semesterNumber !== null && durationStages ? semesterNumber >= durationStages : false,
      };
    });

  const data = rows
    .filter(
      (r) =>
        !q ||
        [r.fullName, r.regNo, r.cnic].some((v) => String(v).toLowerCase().includes(q)),
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  res.json({
    success: true,
    data: data.slice(0, 300),
    meta: {
      total: data.length,
      programs: programs.map((p) => ({ _id: p._id, name: p.name })),
    },
  });
});

// `strict` (used when starting a clearance) lets only admin bypass the
// department check; reads also let the university-wide desks through.
async function assertStudentInViewerScope(viewer, student, { strict = false } = {}) {
  if (viewer.admin) return;
  if (!strict && (viewer.registrar || viewer.exam)) return;
  if (!viewer.hod || !viewer.hodDepartmentId) {
    throw new FlowError(403, "You don't have access to this student.");
  }
  let deptId = student.departmentId;
  if (!deptId && student.programId) {
    const program = await Program.findById(student.programId).select("departmentId").lean();
    deptId = program?.departmentId;
  }
  if (String(deptId) !== String(viewer.hodDepartmentId)) {
    throw new FlowError(403, "This student is not in your department.");
  }
}

export const getEligibility = handle(async (req, res) => {
  const { studentId } = req.params;
  if (!isId(studentId)) throw new FlowError(404, "Student not found.");
  const viewer = await resolveViewer(req.user);
  const student = await StudentProfile.findById(studentId).select("departmentId programId").lean();
  if (!student) throw new FlowError(404, "Student not found.");
  await assertStudentInViewerScope(viewer, student);

  const [report, summaries] = await Promise.all([
    buildAcademicReport(studentId),
    studentSummaries([studentId]),
  ]);
  res.json({
    success: true,
    data: { student: summaries.get(String(studentId)), report },
  });
});

// ============================================================================
// Start
// ============================================================================
// Every guard for opening a clearance lives here, so starting one student and
// starting a whole batch can never follow different rules.
async function createClearanceFor({ studentId, viewer, actor, offices, userId }) {
  if (!isId(studentId)) throw new FlowError(400, "A valid studentId is required.");

  const student = await StudentProfile.findById(studentId).select("studentId status departmentId programId termId semesterId").lean();
  if (!student) throw new FlowError(404, "Student not found.");
  await assertStudentInViewerScope(viewer, student, { strict: true });

  if (student.status !== "academically_completed") {
    throw new FlowError(
      409,
      `Only students who have passed the degree audit can be cleared for graduation (this student is "${student.status}").`,
    );
  }
  const existing = await GraduationClearance.findOne({ studentId, status: "in_progress" }).select("_id").lean();
  if (existing) throw new FlowError(409, "This student already has a clearance in progress.");

  let departmentId = student.departmentId;
  if (!departmentId && student.programId) {
    const program = await Program.findById(student.programId).select("departmentId").lean();
    departmentId = program?.departmentId;
  }

  const clearance = new GraduationClearance({
    studentId,
    departmentId,
    programId: student.programId,
    termId: student.termId,
    semesterId: student.semesterId,
    startedBy: userId,
    startedByName: actor.name,
    offices: offices.map((o) => ({ officeId: o._id, key: o.key, name: o.name, autoCheck: o.autoCheck })),
  });
  log(clearance, actor, { action: "started", stage: "hod" });
  await clearance.save();

  // `student` above was loaded .lean() (read-only, for the eligibility
  // check) — a second, writable fetch is needed to record the transition.
  const studentDoc = await StudentProfile.findById(studentId);
  transitionStatus(studentDoc, "clearance_in_progress", {
    reason: "Graduation clearance started",
    by: userId,
    byName: actor.name,
  });
  await studentDoc.save();

  return clearance;
}

const loadStartContext = async (req) => {
  const viewer = await resolveViewer(req.user);
  if (!viewer.admin && !viewer.hod) throw new FlowError(403, "Only a Head of Department can start clearance.");
  const [offices, actor] = await Promise.all([
    ClearanceOffice.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    getActor(req),
  ]);
  return { viewer, offices, actor };
};

export const startClearance = handle(async (req, res) => {
  const { studentId } = req.body;
  if (!isId(studentId)) throw new FlowError(400, "A valid studentId is required.");

  const ctx = await loadStartContext(req);
  const clearance = await createClearanceFor({ studentId, ...ctx, userId: req.user._id });

  res.status(201).json({ success: true, message: "Graduation clearance started.", data: { _id: clearance._id } });
});

const BULK_LIMIT = 300;

// Start clearance for many students at once. Each student goes through the
// exact same checks as a single start; one failing (already in progress,
// not active, outside the HOD's department ...) never blocks the rest — it is
// reported back with its reason.
export const startClearanceBulk = handle(async (req, res) => {
  const raw = Array.isArray(req.body?.studentIds) ? req.body.studentIds : null;
  if (!raw || raw.length === 0) throw new FlowError(400, "Select at least one student.");
  const ids = [...new Set(raw.map(String))];
  if (ids.length > BULK_LIMIT) {
    throw new FlowError(400, `You can start at most ${BULK_LIMIT} clearances at a time.`);
  }

  const ctx = await loadStartContext(req);

  const infos = await PersonalInfo.find({ studentId: { $in: ids.filter(isId) } })
    .select("studentId fullName")
    .lean();
  const nameOf = new Map(infos.map((i) => [String(i.studentId), i.fullName]));

  const started = [];
  const skipped = [];
  for (const studentId of ids) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const clearance = await createClearanceFor({ studentId, ...ctx, userId: req.user._id });
      started.push({ studentId, clearanceId: clearance._id, fullName: nameOf.get(studentId) || "" });
    } catch (err) {
      let reason;
      if (err instanceof FlowError) reason = err.message;
      else if (err?.code === 11000) reason = "This student already has a clearance in progress.";
      else throw err;
      skipped.push({ studentId, fullName: nameOf.get(studentId) || "", reason });
    }
  }

  res.status(started.length ? 201 : 200).json({
    success: true,
    message: started.length
      ? `Started ${started.length} clearance${started.length === 1 ? "" : "s"}${skipped.length ? `, ${skipped.length} skipped` : ""}.`
      : "No clearances were started.",
    data: { started, skipped },
  });
});

// ============================================================================
// Lists
// ============================================================================
export const listClearances = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const scope = scopeFilter(viewer);
  const filter = { ...scope };

  const status = text(req.query.status) || "in_progress";
  if (status !== "all") filter.status = status;
  if (text(req.query.stage)) filter.currentStage = req.query.stage;
  if (text(req.query.q)) {
    const ids = await studentIdsMatching(text(req.query.q));
    filter.studentId = { $in: ids };
  }

  const [rows, counts] = await Promise.all([
    populateClearance(GraduationClearance.find(filter)).sort({ updatedAt: -1 }).limit(300).lean(),
    GraduationClearance.aggregate([
      { $match: scope },
      { $group: { _id: { status: "$status", stage: "$currentStage" }, n: { $sum: 1 } } },
    ]),
  ]);

  const summaries = await studentSummaries(rows.map((r) => r.studentId));
  const stageCounts = { hod: 0, exam: 0, offices: 0, finance: 0, registrar: 0, graduated: 0, cancelled: 0 };
  counts.forEach(({ _id, n }) => {
    if (_id.status === "in_progress") stageCounts[_id.stage] = (stageCounts[_id.stage] || 0) + n;
    else if (_id.status === "graduated") stageCounts.graduated += n;
    else if (_id.status === "cancelled") stageCounts.cancelled += n;
  });

  res.json({
    success: true,
    data: rows.map((r) => ({
      ...clearanceView(r, summaries.get(String(r.studentId))),
      permissions: PERMISSIONS(viewer, r),
    })),
    meta: { counts: stageCounts },
  });
});

export const listGraduates = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  if (!viewer.unscoped && !(viewer.hod && viewer.hodDepartmentId)) {
    throw new FlowError(403, "You don't have access to the graduate list.");
  }
  const filter = { status: "graduated" };
  if (!viewer.unscoped) filter.departmentId = viewer.hodDepartmentId;
  if (isId(req.query.programId)) filter.programId = req.query.programId;
  if (req.query.year && Number(req.query.year)) filter.graduationYear = Number(req.query.year);
  if (text(req.query.q)) {
    filter.studentId = { $in: await studentIdsMatching(text(req.query.q)) };
  }

  const rows = await populateClearance(GraduationClearance.find(filter))
    .sort({ graduatedAt: -1 })
    .limit(2000)
    .lean();
  const summaries = await studentSummaries(rows.map((r) => r.studentId));
  const years = await GraduationClearance.distinct("graduationYear", {
    status: "graduated",
    ...(viewer.unscoped ? {} : { departmentId: viewer.hodDepartmentId }),
  });

  res.json({
    success: true,
    data: rows.map((r) => {
      const v = clearanceView(r, summaries.get(String(r.studentId)));
      return {
        _id: v._id,
        student: v.student,
        program: v.program,
        department: v.department,
        cgpa: v.cgpa,
        earnedCredits: r.transcript?.earnedCredits ?? null,
        graduatedAt: v.graduatedAt,
        graduationYear: v.graduationYear,
        degreeSerial: v.degreeSerial,
      };
    }),
    meta: { years: years.filter(Boolean).sort((a, b) => b - a) },
  });
});

// ============================================================================
// Detail
// ============================================================================
export const getClearance = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const raw = await loadClearance(req.params.id);
  if (!canViewClearance(viewer, raw)) throw new FlowError(403, "You don't have access to this clearance.");

  const c = await populateClearance(GraduationClearance.findById(raw._id)).lean();
  const summaries = await studentSummaries([c.studentId]);
  const student = summaries.get(String(c.studentId));

  const data = { clearance: clearanceView(c, student), permissions: PERMISSIONS(viewer, c) };

  const open = c.status === "in_progress";
  const needsAcademic = ["hod", "exam"].includes(c.currentStage) || c.currentStage === "registrar";
  if (open && needsAcademic) {
    data.report = await buildAcademicReport(c.studentId);
    if (c.currentStage === "exam") data.examChecks = await buildExamOfficeChecks(c.studentId);
  }
  if (c.transcript) data.transcript = c.transcript;

  if (open && ["offices", "finance", "registrar"].includes(c.currentStage)) {
    const officeChecks = {};
    for (const o of c.offices) {
      if (o.autoCheck && o.autoCheck !== "none") {
        officeChecks[o.key] = await getOfficeAutoCheck(o.autoCheck, c.studentId);
      }
    }
    data.officeChecks = officeChecks;
  }
  if (open && ["finance", "registrar"].includes(c.currentStage)) {
    data.finance = await getFinanceSnapshot(c.studentId);
  }

  res.json({ success: true, data });
});

// ============================================================================
// HOD submit
// ============================================================================
export const submitHod = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  if (!canActStage(viewer, "hod", c)) throw new FlowError(403, "This clearance is not in your department.");
  requireStage(c, "hod");

  const report = await buildAcademicReport(c.studentId);
  if (!report) throw new FlowError(404, "Student not found.");
  const gate = evaluateGate(report.checks, req.body.confirmations);
  throwIfGateBlocked(gate);

  const actor = await getActor(req);
  c.stages.hod = {
    status: "approved",
    ...stamp(actor),
    remarks: text(req.body.remarks),
    confirmations: gate.accepted,
  };
  c.stages.exam = { status: "pending" };
  c.currentStage = "exam";
  log(c, actor, { action: "hod_submitted", stage: "hod", remarks: text(req.body.remarks) });
  await c.save();

  res.json({ success: true, message: "Submitted to the Examination Office." });
});

function throwIfGateBlocked(gate) {
  if (gate.blockers.length) {
    throw new FlowError(409, "Some requirements are not met, so this can't be approved.", {
      blockers: gate.blockers,
    });
  }
  if (gate.unconfirmed.length) {
    throw new FlowError(400, "Add a confirmation remark for every item the system could not verify.", {
      unconfirmed: gate.unconfirmed,
    });
  }
}

// ============================================================================
// Exam Office
// ============================================================================
export const approveExam = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  if (!canActStage(viewer, "exam", c)) throw new FlowError(403, "Only the Examination Office can do this.");
  requireStage(c, "exam");

  const [report, examChecks, summaries] = await Promise.all([
    buildAcademicReport(c.studentId),
    buildExamOfficeChecks(c.studentId),
    studentSummaries([c.studentId]),
  ]);
  if (!report) throw new FlowError(404, "Student not found.");
  const gate = evaluateGate([...report.checks, ...examChecks], req.body.confirmations);
  throwIfGateBlocked(gate);

  const actor = await getActor(req);
  const student = summaries.get(String(c.studentId));
  c.transcript = {
    generatedAt: new Date(),
    generatedBy: actor.name,
    student: { regNo: student?.regNo, fullName: student?.fullName, cnic: student?.cnic },
    programName: report.student.programName,
    cgpa: report.summary.cgpa,
    earnedCredits: report.summary.earnedCredits,
    requiredCredits: report.summary.requiredCredits,
    minCGPA: report.requirements.minCGPA,
    semesters: report.semesters.map((s) => ({
      number: s.number,
      name: s.name,
      term: s.term,
      sgpa: s.sgpa,
      courses: s.courses.map((x) => ({
        code: x.code,
        title: x.title,
        credits: x.credits,
        state: x.state,
        percentage: x.percentage ?? null,
        grade: x.grade,
        gradePoints: x.gradePoints,
        counted: x.counted,
      })),
    })),
  };

  c.stages.exam = {
    status: "approved",
    ...stamp(actor),
    remarks: text(req.body.remarks),
    confirmations: gate.accepted,
  };

  // Open the offices; an office backed by allocation data that the student
  // never used is cleared automatically.
  for (const office of c.offices) {
    let status = "pending";
    let remarks = "";
    if (office.autoCheck !== "none") {
      const auto = await getOfficeAutoCheck(office.autoCheck, c.studentId);
      if (auto.state === "none") {
        status = "not_applicable";
        remarks = auto.detail;
      }
    }
    office.status = status;
    office.remarks = remarks;
    if (status === "not_applicable") {
      office.actedByName = "System";
      office.actedAt = new Date();
    }
  }
  c.currentStage = "offices";
  advanceIfOfficesDone(c);
  log(c, actor, { action: "exam_approved", stage: "exam", remarks: text(req.body.remarks) });
  await c.save();

  res.json({ success: true, message: "Approved. The auxiliary offices can now clear the student." });
});

export const rejectExam = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  if (!canActStage(viewer, "exam", c)) throw new FlowError(403, "Only the Examination Office can do this.");
  requireStage(c, "exam");
  const remarks = requireRemarks(req.body.remarks, "A reason");

  const actor = await getActor(req);
  c.stages.exam = { status: "rejected", ...stamp(actor), remarks, confirmations: [] };
  c.stages.hod = { status: "pending", remarks: "", confirmations: [] };
  c.currentStage = "hod";
  log(c, actor, { action: "exam_rejected", stage: "exam", remarks });
  await c.save();

  res.json({ success: true, message: "Returned to the Head of Department." });
});

function advanceIfOfficesDone(c) {
  if (c.currentStage !== "offices") return;
  const done = c.offices.every((o) => ["approved", "not_applicable"].includes(o.status));
  if (done) {
    c.stages.finance = { status: "pending" };
    c.currentStage = "finance";
  }
}

// ============================================================================
// Offices
// ============================================================================
async function loadOfficeStep(req) {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  requireStage(c, "offices");
  const key = text(req.params.officeKey).toLowerCase();
  const step = c.offices.find((o) => o.key === key);
  if (!step) throw new FlowError(404, "That office is not part of this clearance.");
  if (!viewer.officeKeys.includes(key)) {
    throw new FlowError(403, `You are not an officer of ${step.name}.`);
  }
  if (!["pending", "rejected"].includes(step.status)) {
    throw new FlowError(409, `${step.name} has already been settled (${step.status.replace("_", " ")}).`);
  }
  return { c, step };
}

export const approveOffice = handle(async (req, res) => {
  const { c, step } = await loadOfficeStep(req);

  if (step.autoCheck !== "none") {
    const auto = await getOfficeAutoCheck(step.autoCheck, c.studentId);
    if (auto.state === "blocked") throw new FlowError(409, auto.detail, { autoCheck: auto });
  }

  const actor = await getActor(req);
  step.status = "approved";
  step.actedBy = actor.user._id;
  step.actedByName = actor.name;
  step.actedAt = new Date();
  step.remarks = text(req.body.remarks);
  log(c, actor, { action: "office_approved", stage: "offices", officeKey: step.key, remarks: text(req.body.remarks) });
  advanceIfOfficesDone(c);
  await c.save();

  res.json({ success: true, message: `${step.name} cleared.` });
});

export const rejectOffice = handle(async (req, res) => {
  const { c, step } = await loadOfficeStep(req);
  const remarks = requireRemarks(req.body.remarks, "A reason");

  const actor = await getActor(req);
  step.status = "rejected";
  step.actedBy = actor.user._id;
  step.actedByName = actor.name;
  step.actedAt = new Date();
  step.remarks = remarks;
  log(c, actor, { action: "office_rejected", stage: "offices", officeKey: step.key, remarks });
  await c.save();

  res.json({ success: true, message: `${step.name} marked as not cleared.` });
});

// ============================================================================
// Finance
// ============================================================================
// An allocation can be created after an office was auto-marked "not
// applicable" (or cleared), so Finance and the Registrar re-check it live.
async function assertAllocationsClear(c) {
  for (const office of c.offices) {
    if (office.autoCheck === "none") continue;
    const auto = await getOfficeAutoCheck(office.autoCheck, c.studentId);
    if (auto.state === "blocked") {
      throw new FlowError(409, `${office.name}: ${auto.detail}`, { autoCheck: auto });
    }
  }
}

function requireStageStatus(step, allowed, label) {
  if (!allowed.includes(step.status)) throw new FlowError(409, `${label} is not awaiting action.`);
}

export const approveFinance = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  if (!canActStage(viewer, "finance", c)) throw new FlowError(403, "Only Accounts & Finance can do this.");
  requireStage(c, "finance");
  requireStageStatus(c.stages.finance, ["pending", "rejected"], "Finance clearance");
  await assertAllocationsClear(c);

  const dues = await getFinanceSnapshot(c.studentId);
  if (dues.outstanding > 0) {
    throw new FlowError(
      409,
      `The student still owes Rs ${dues.outstanding.toLocaleString()} across ${dues.count} challan(s).`,
      { finance: dues },
    );
  }
  if (req.body.feeReceived !== true) {
    throw new FlowError(400, "Confirm that the degree issuance / convocation fee has been received.");
  }

  const actor = await getActor(req);
  c.feeReceived = true;
  c.stages.finance = {
    status: "approved",
    ...stamp(actor),
    remarks: text(req.body.remarks),
    confirmations: [],
  };
  c.stages.registrar = { status: "pending" };
  c.currentStage = "registrar";
  log(c, actor, { action: "finance_approved", stage: "finance", remarks: text(req.body.remarks) });
  await c.save();

  const studentDoc = await StudentProfile.findById(c.studentId);
  transitionStatus(studentDoc, "cleared", {
    reason: "Finance cleared; awaiting Registrar finalization",
    by: actor.user._id,
    byName: actor.name,
  });
  await studentDoc.save();

  res.json({ success: true, message: "Finance cleared. Sent to the Registrar." });
});

export const rejectFinance = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  if (!canActStage(viewer, "finance", c)) throw new FlowError(403, "Only Accounts & Finance can do this.");
  requireStage(c, "finance");
  requireStageStatus(c.stages.finance, ["pending", "rejected"], "Finance clearance");
  const remarks = requireRemarks(req.body.remarks, "A reason");

  const actor = await getActor(req);
  c.stages.finance = { status: "rejected", ...stamp(actor), remarks, confirmations: [] };
  log(c, actor, { action: "finance_rejected", stage: "finance", remarks });
  await c.save();

  res.json({ success: true, message: "Finance clearance withheld." });
});

// ============================================================================
// Registrar
// ============================================================================
async function nextDegreeSerial(year, session) {
  const prefix = `CISD-${year}-`;
  const last = await GraduationClearance.findOne({ degreeSerial: new RegExp(`^${prefix}`) })
    .sort({ degreeSerial: -1 })
    .select("degreeSerial")
    .session(session)
    .lean();
  const n = last ? Number(last.degreeSerial.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(5, "0")}`;
}

export const finalizeClearance = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const actor = await getActor(req);
  const remarks = text(req.body.remarks);

  const preview = await loadClearance(req.params.id);
  if (!canActStage(viewer, "registrar", preview)) throw new FlowError(403, "Only the Registrar can do this.");
  requireStage(preview, "registrar");
  await assertAllocationsClear(preview);

  // Dues can be re-issued after Finance signed off, so check again now.
  const dues = await getFinanceSnapshot(preview.studentId);
  if (dues.outstanding > 0) {
    throw new FlowError(
      409,
      `The student owes Rs ${dues.outstanding.toLocaleString()} again (${dues.count} challan(s)). Send it back to Finance.`,
      { finance: dues },
    );
  }

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const c = await loadClearance(req.params.id, session);
      requireStage(c, "registrar");
      requireStageStatus(c.stages.registrar, ["pending", "rejected"], "Final approval");

      const student = await StudentProfile.findById(c.studentId).session(session);
      if (!student) throw new FlowError(404, "Student not found.");
      if (student.status !== "cleared") {
        throw new FlowError(409, `The student's status is "${student.status}", so they can't be graduated.`);
      }

      const now = new Date();
      const year = now.getFullYear();
      c.degreeSerial = await nextDegreeSerial(year, session);
      c.graduatedAt = now;
      c.graduationYear = year;
      c.status = "graduated";
      c.currentStage = "completed";
      c.stages.registrar = { status: "approved", ...stamp(actor), remarks, confirmations: [] };
      log(c, actor, { action: "graduated", stage: "registrar", remarks });
      await c.save({ session });

      transitionStatus(student, "graduated", {
        reason: "Degree finalized by the Registrar",
        by: actor.user._id,
        byName: actor.name,
      });
      await student.save({ session });
      result = { degreeSerial: c.degreeSerial, graduationYear: year };
    });
  } finally {
    await session.endSession();
  }

  res.json({ success: true, message: "Student graduated and added to the graduate list.", data: result });
});

export const rejectRegistrar = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  if (!canActStage(viewer, "registrar", c)) throw new FlowError(403, "Only the Registrar can do this.");
  requireStage(c, "registrar");
  requireStageStatus(c.stages.registrar, ["pending", "rejected"], "Final approval");
  const remarks = requireRemarks(req.body.remarks, "A reason");

  const actor = await getActor(req);
  c.stages.registrar = { status: "rejected", ...stamp(actor), remarks, confirmations: [] };
  log(c, actor, { action: "registrar_rejected", stage: "registrar", remarks });
  await c.save();

  res.json({ success: true, message: "Final approval withheld." });
});

// ============================================================================
// Cancel
// ============================================================================
export const cancelClearance = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  const c = await loadClearance(req.params.id);
  if (!canCancelClearance(viewer, c)) throw new FlowError(403, "You can't cancel this clearance.");
  if (c.status !== "in_progress") throw new FlowError(409, "Only a clearance in progress can be cancelled.");
  const reason = requireRemarks(req.body.reason, "A reason");

  const actor = await getActor(req);
  c.status = "cancelled";
  c.currentStage = "cancelled";
  c.cancelledAt = new Date();
  c.cancelledBy = req.user._id;
  c.cancelReason = reason;
  log(c, actor, { action: "cancelled", remarks: reason });
  await c.save();

  // Revert to academically_completed regardless of which stage the
  // clearance was cancelled from — the whole attempt is void, so there is
  // exactly one "back to" state, and the student can be re-started later.
  const studentDoc = await StudentProfile.findById(c.studentId);
  if (studentDoc && studentDoc.status !== "academically_completed") {
    transitionStatus(studentDoc, "academically_completed", {
      reason: `Clearance cancelled: ${reason}`,
      by: req.user._id,
      byName: actor.name,
    });
    await studentDoc.save();
  }

  res.json({ success: true, message: "Clearance cancelled." });
});

// ============================================================================
// Bulk stage actions
// ============================================================================
// One shared remark, applied to many clearances. Each clearance is run through
// the SAME handler a single action uses (so every rule — sequence, scope,
// blockers, dues, allocations — is enforced exactly as before); a clearance
// that fails is reported with its reason and never stops the rest.
const BULK_ACTIONS = {
  hod_submit: { handler: submitHod, confirmable: true },
  exam_approve: { handler: approveExam, confirmable: true },
  exam_reject: { handler: rejectExam, remarkRequired: true },
  office_approve: { handler: approveOffice, perOffice: true },
  office_reject: { handler: rejectOffice, perOffice: true, remarkRequired: true },
  finance_approve: { handler: approveFinance, feeReceivedRequired: true },
  finance_reject: { handler: rejectFinance, remarkRequired: true },
  registrar_finalize: { handler: finalizeClearance },
  registrar_reject: { handler: rejectRegistrar, remarkRequired: true },
  cancel: { handler: cancelClearance, remarkRequired: true, remarkField: "reason" },
};
const BULK_ACTION_LIMIT = 50;

// Runs an Express-style handler without a real response object and returns
// what it would have sent.
const invokeHandler = (handler, user, params, body) =>
  new Promise((resolve, reject) => {
    const out = { status: 200, payload: null };
    const res = {
      status(code) {
        out.status = code;
        return res;
      },
      json(payload) {
        out.payload = payload;
        resolve(out);
      },
    };
    Promise.resolve(handler({ user, params, body }, res, reject)).catch(reject);
  });

export const bulkAction = handle(async (req, res) => {
  const { action } = req.body;
  const spec = BULK_ACTIONS[action];
  if (!spec) throw new FlowError(400, "Unknown action.");

  const ids = [...new Set((Array.isArray(req.body.ids) ? req.body.ids : []).map(String))];
  if (ids.length === 0) throw new FlowError(400, "Select at least one clearance.");
  if (ids.length > BULK_ACTION_LIMIT) {
    throw new FlowError(400, `At most ${BULK_ACTION_LIMIT} clearances can be processed per request.`);
  }

  const remark = text(req.body.remarks);
  if (spec.remarkRequired && !remark) throw new FlowError(400, "A remark is required for this action.");
  if (spec.feeReceivedRequired && req.body.feeReceived !== true) {
    throw new FlowError(400, "Confirm that the degree issuance / convocation fee has been received.");
  }
  const confirmUnverified = spec.confirmable && req.body.confirmUnverified === true;
  if (confirmUnverified && !remark) {
    throw new FlowError(400, "Add a remark — it is recorded as the confirmation for every unverified item.");
  }

  const viewer = await resolveViewer(req.user);
  const clearances = await GraduationClearance.find({ _id: { $in: ids.filter(isId) } })
    .select("studentId")
    .lean();
  const summaries = await studentSummaries(clearances.map((c) => c.studentId));
  const info = new Map(
    clearances.map((c) => {
      const st = summaries.get(String(c.studentId)) || {};
      return [String(c._id), { fullName: st.fullName || "", regNo: st.regNo || "" }];
    }),
  );

  const done = [];
  const failed = [];
  const fail = (id, reason, extra = {}) =>
    failed.push({ id, ...(info.get(id) || { fullName: "", regNo: "" }), reason, ...extra });

  for (const id of ids) {
    if (!info.has(id)) {
      fail(id, "Clearance not found.");
      continue;
    }
    // Office actions apply to every office of the caller (or the requested
    // ones); every other action is a single call.
    const officeKeys = spec.perOffice
      ? (Array.isArray(req.body.officeKeys) && req.body.officeKeys.length
          ? req.body.officeKeys.map((k) => text(k).toLowerCase()).filter((k) => viewer.officeKeys.includes(k))
          : viewer.officeKeys)
      : [null];
    let anyDone = false;
    let lastFailure = null;
    for (const officeKey of officeKeys) {
      const body = { [spec.remarkField || "remarks"]: remark };
      if (spec.feeReceivedRequired) body.feeReceived = true;
      const params = { id, ...(officeKey ? { officeKey } : {}) };
      try {
        // eslint-disable-next-line no-await-in-loop
        let out = await invokeHandler(spec.handler, req.user, params, body);
        // Unverified items block a stage until each has a remark; when the
        // caller opted in, the shared remark is that confirmation.
        if (confirmUnverified && out.status === 400 && Array.isArray(out.payload?.unconfirmed)) {
          const confirmations = Object.fromEntries(out.payload.unconfirmed.map((c) => [c.key, remark]));
          // eslint-disable-next-line no-await-in-loop
          out = await invokeHandler(spec.handler, req.user, params, { ...body, confirmations });
        }
        if (out.status < 300 && out.payload?.success) {
          anyDone = true;
          if (!spec.perOffice) done.push({ id, ...info.get(id), message: out.payload.message });
        } else {
          lastFailure = {
            reason: out.payload?.message || "Could not be processed.",
            blockers: (out.payload?.blockers || []).map((b) => b.label || b.key).filter(Boolean),
            unconfirmed: (out.payload?.unconfirmed || []).map((b) => b.label || b.key).filter(Boolean),
          };
        }
      } catch (err) {
        console.error("Bulk graduation action failed:", err);
        lastFailure = { reason: "Unexpected error while processing this clearance." };
      }
    }
    if (spec.perOffice && anyDone) done.push({ id, ...info.get(id), message: "Done." });
    else if (!anyDone) {
      const { reason, ...extra } = lastFailure || { reason: "You have nothing to act on for this clearance." };
      fail(id, reason, extra);
    }
  }

  res.json({
    success: true,
    message: `${done.length} done${failed.length ? `, ${failed.length} could not be processed` : ""}.`,
    data: { done, failed },
  });
});

// ============================================================================
// Office administration (admin)
// ============================================================================
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

async function grantOfficerRole(userIds) {
  if (userIds.length) {
    await User.updateMany({ _id: { $in: userIds } }, { $addToSet: { roles: "clearance_officer" } });
  }
}

async function cleanOfficerIds(raw) {
  const ids = [...new Set((Array.isArray(raw) ? raw : []).filter(isId).map(String))];
  const found = await User.find({ _id: { $in: ids }, status: "active" }).select("_id").lean();
  return found.map((u) => u._id);
}

const officeView = (o, officers = []) => ({
  _id: o._id,
  key: o.key,
  name: o.name,
  description: o.description || "",
  roles: o.roles || [],
  autoCheck: o.autoCheck,
  isActive: o.isActive,
  isSystem: o.isSystem,
  sortOrder: o.sortOrder,
  officers,
});

export const listOffices = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  if (!viewer.admin) throw new FlowError(403, "Only an administrator can manage offices.");
  const offices = await ClearanceOffice.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  const users = await User.find({
    _id: { $in: offices.flatMap((o) => o.officerUserIds || []) },
  })
    .select("email roles")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  res.json({
    success: true,
    data: offices.map((o) =>
      officeView(
        o,
        (o.officerUserIds || []).map((id) => userMap.get(String(id))).filter(Boolean).map((u) => ({ _id: u._id, email: u.email })),
      ),
    ),
  });
});

export const createOffice = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  if (!viewer.admin) throw new FlowError(403, "Only an administrator can manage offices.");
  const name = text(req.body.name);
  if (!name) throw new FlowError(400, "Office name is required.");

  let key = slugify(name) || "office";
  if (await ClearanceOffice.exists({ key })) key = `${key}_${Date.now().toString(36).slice(-4)}`;
  const officerUserIds = await cleanOfficerIds(req.body.officerUserIds);
  const last = await ClearanceOffice.findOne({}).sort({ sortOrder: -1 }).select("sortOrder").lean();

  const office = await ClearanceOffice.create({
    key,
    name,
    description: text(req.body.description),
    roles: [],
    officerUserIds,
    autoCheck: "none",
    sortOrder: (last?.sortOrder ?? 0) + 10,
  });
  await grantOfficerRole(officerUserIds);
  res.status(201).json({ success: true, message: "Office added.", data: officeView(office.toObject()) });
});

export const updateOffice = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  if (!viewer.admin) throw new FlowError(403, "Only an administrator can manage offices.");
  if (!isId(req.params.id)) throw new FlowError(404, "Office not found.");
  const office = await ClearanceOffice.findById(req.params.id);
  if (!office) throw new FlowError(404, "Office not found.");

  if (req.body.name !== undefined) {
    const name = text(req.body.name);
    if (!name) throw new FlowError(400, "Office name can't be empty.");
    office.name = name;
  }
  if (req.body.description !== undefined) office.description = text(req.body.description);
  if (req.body.isActive !== undefined) office.isActive = !!req.body.isActive;
  if (req.body.sortOrder !== undefined && Number.isFinite(Number(req.body.sortOrder))) {
    office.sortOrder = Number(req.body.sortOrder);
  }
  if (req.body.officerUserIds !== undefined) {
    office.officerUserIds = await cleanOfficerIds(req.body.officerUserIds);
    await grantOfficerRole(office.officerUserIds);
  }
  await office.save();
  res.json({ success: true, message: "Office updated.", data: officeView(office.toObject()) });
});

export const searchOfficerCandidates = handle(async (req, res) => {
  const viewer = await resolveViewer(req.user);
  if (!viewer.admin) throw new FlowError(403, "Only an administrator can manage offices.");
  const q = text(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (q.length < 2) return res.json({ success: true, data: [] });
  const users = await User.find({
    email: new RegExp(q, "i"),
    status: "active",
    roles: { $nin: ["student", "applicant"] },
  })
    .select("email roles")
    .limit(15)
    .lean();
  res.json({ success: true, data: users.map((u) => ({ _id: u._id, email: u.email, roles: u.roles })) });
});
