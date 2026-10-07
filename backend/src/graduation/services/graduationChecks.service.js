import DisciplinaryFile from "../../registrar/models/DisciplinaryFile.js";
import UFMReport from "../../exam/models/UFMReport.js";
import ReEvaluation from "../../exam/models/ReEvaluation.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";
import TransportAllocation from "../../transport/models/TransportAllocation.js";
import HostelAllocation from "../../hostel/models/HostelAllocation.js";

const check = (key, label, status, detail) => ({ key, label, status, detail });

// Facts only the Examination Office cares about. An absent case is itself a
// fact (pass), so these are never "unverified".
export async function buildExamOfficeChecks(studentId) {
  const [discipline, ufm, reevaluations] = await Promise.all([
    DisciplinaryFile.find({ studentId, status: { $in: ["Under Review", "Suspended"] } })
      .select("incident severity status")
      .lean(),
    UFMReport.find({ studentId, status: { $in: ["Reported", "Under Review"] } })
      .select("violationType status")
      .lean(),
    ReEvaluation.find({ studentId, status: { $in: ["Applied", "Under Review"] } })
      .select("status")
      .lean(),
  ]);

  return [
    discipline.length
      ? check(
          "discipline",
          "No open disciplinary case",
          "fail",
          `${discipline.length} open disciplinary case(s): ${discipline
            .map((d) => `${d.severity} — ${d.incident}`)
            .join("; ")}.`,
        )
      : check("discipline", "No open disciplinary case", "pass", "No disciplinary case is open."),
    ufm.length
      ? check(
          "ufm",
          "No unresolved cheating / unfair-means report",
          "fail",
          `${ufm.length} unresolved report(s): ${ufm.map((u) => u.violationType).join(", ")}.`,
        )
      : check("ufm", "No unresolved cheating / unfair-means report", "pass", "No unfair-means report is pending."),
    reevaluations.length
      ? check(
          "reevaluation",
          "No pending result re-evaluation",
          "fail",
          `${reevaluations.length} re-evaluation request(s) still open.`,
        )
      : check("reevaluation", "No pending result re-evaluation", "pass", "No re-evaluation request is pending."),
  ];
}

// Live outstanding dues, straight from the student's challans — the same
// rule the old clearance screen used (issued / partial / overdue, not
// deleted), summed on the remaining amount.
export async function getFinanceSnapshot(studentId) {
  const challans = await StudentChallan.find({
    studentId,
    isDeleted: false,
    status: { $in: ["issued", "partial", "overdue"] },
  })
    .select("challanNo challanType dueDate remainingAmount status")
    .sort({ dueDate: 1 })
    .lean();
  const outstanding = challans.reduce((s, c) => s + (c.remainingAmount || 0), 0);
  return {
    outstanding,
    count: challans.length,
    challans: challans.map((c) => ({
      _id: c._id,
      challanNo: c.challanNo,
      challanType: c.challanType,
      dueDate: c.dueDate,
      remainingAmount: c.remainingAmount,
      status: c.status,
    })),
  };
}

// For offices backed by allocation data (transport / hostel). "clear" means
// approval may proceed; "blocked" means an allocation is still active.
export async function getOfficeAutoCheck(autoCheck, studentId) {
  if (autoCheck !== "transport" && autoCheck !== "hostel") {
    return { kind: "none", state: "manual", detail: "", allocations: [] };
  }
  const isTransport = autoCheck === "transport";
  const Model = isTransport ? TransportAllocation : HostelAllocation;
  const rows = await Model.find({ studentId }).sort({ allocationDate: -1 }).lean();
  const label = isTransport ? "transport" : "hostel";
  const allocations = rows.map((r) => ({
    status: r.status,
    allocationDate: r.allocationDate,
    vacatedDate: r.vacatedDate,
    place: isTransport ? r.stopName : `${r.hostelName} — Room ${r.roomNumber}`,
  }));
  const active = rows.filter((r) => r.status === "ALLOCATED");
  if (active.length) {
    return {
      kind: autoCheck,
      state: "blocked",
      detail: `The student still has an active ${label} allocation (${allocations[0].place}). It must be vacated first.`,
      allocations,
    };
  }
  if (!rows.length) {
    return {
      kind: autoCheck,
      state: "none",
      detail: `The student has never been allocated ${label}; nothing to clear.`,
      allocations,
    };
  }
  return {
    kind: autoCheck,
    state: "clear",
    detail: `All ${label} allocations were vacated.`,
    allocations,
  };
}
