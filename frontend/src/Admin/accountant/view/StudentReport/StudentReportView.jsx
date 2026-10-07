import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  Search,
  User,
  GraduationCap,
  Phone,
  FileText,
  Loader2,
  CheckCircle,
  ReceiptText,
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  BarChart3,
  Banknote,
  ShieldAlert,
  BookOpen,
  CreditCard,
  FileSpreadsheet,
  FileDown,
  Printer,
  Filter,
  Hash,
  Users,
  ChevronRight,
  Calendar,
  Home,
  Award,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────── */
const fmt = (v) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const FEE_TYPE_OPTIONS = [
  { key: "tuition", label: "Tuition" },
  { key: "admission", label: "Admission" },
  { key: "exam", label: "Exam" },
  { key: "misc", label: "Misc / General" },
];

// Small popover attached to the Master Data button — lets the accountant
// pick which fee type(s) the export's totals should be based on (Tuition
// only by default) instead of always summing every category together.
const MasterExportControl = ({ onExport, isExporting }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(["tuition"]);

  const toggleType = (key) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition-colors disabled:opacity-60"
      >
        {isExporting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Users size={12} />
        )}{" "}
        Master Data <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Include Fee Types
            </p>
            <div className="space-y-1.5 mb-3">
              {FEE_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.key)}
                    onChange={() => toggleType(opt.key)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                if (selected.length === 0) return;
                onExport(selected);
                setOpen(false);
              }}
              disabled={selected.length === 0 || isExporting}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-50 transition-colors"
            >
              Download Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Small popover attached to the "Student Directory" button — lets the
// accountant choose between the full roster and scholarship holders only
// before picking Excel or PDF, instead of two separate always-full-roster
// buttons with no way to isolate scholarship students.
const DirectoryExportControl = ({
  onExportExcel,
  onExportPDF,
  isExportingExcel,
  isExportingPDF,
}) => {
  const [open, setOpen] = useState(false);
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const isExporting = isExportingExcel || isExportingPDF;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60"
      >
        {isExporting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Users size={12} />
        )}{" "}
        Student Directory <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Include
            </p>
            <div className="space-y-1.5 mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="directory-scope"
                  checked={!scholarshipOnly}
                  onChange={() => setScholarshipOnly(false)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Full student record
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="directory-scope"
                  checked={scholarshipOnly}
                  onChange={() => setScholarshipOnly(true)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Scholarship students only
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onExportExcel(scholarshipOnly);
                  setOpen(false);
                }}
                disabled={isExporting}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-50 transition-colors"
              >
                Excel
              </button>
              <button
                onClick={() => {
                  onExportPDF(scholarshipOnly);
                  setOpen(false);
                }}
                disabled={isExporting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-50 transition-colors"
              >
                PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

const hueFromName = (name = "") =>
  [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

const formatAddress = (addr) => {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  return (
    [addr.address, addr.district, addr.province, addr.country]
      .filter(Boolean)
      .join(", ") || null
  );
};

const pctOf = (part, total) =>
  total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;

/* ─── Sub-components ──────────────────────────────────────── */

const StatusBadge = ({ status, small = false }) => {
  const styles = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    overdue: "bg-red-50    text-red-700    border-red-200",
    issued: "bg-blue-50   text-blue-700   border-blue-200",
    partial: "bg-amber-50  text-amber-700  border-amber-200",
    cancelled: "bg-slate-100 text-slate-500  border-slate-200",
    pending: "bg-orange-50 text-orange-700 border-orange-200",
    unpaid: "bg-orange-50 text-orange-700 border-orange-200",
    not_generated: "bg-slate-100 text-slate-400 border-slate-200",
    covered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const label = {
    paid: "Paid",
    overdue: "Overdue",
    issued: "Issued",
    partial: "Partial",
    cancelled: "Cancelled",
    pending: "Pending",
    unpaid: "Unpaid",
    not_generated: "Not Generated",
    covered: "Fully Covered",
  };
  const cls = styles[status] || styles.issued;
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-bold uppercase tracking-wide
        ${small ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1"} ${cls}`}
    >
      <span
        className={`rounded-full ${small ? "w-1 h-1" : "w-1.5 h-1.5"}`}
        style={{ background: "currentColor" }}
      />
      {label[status] || status}
    </span>
  );
};

const KpiCard = ({ label, value, icon: Icon, color, sub }) => {
  const colors = {
    blue: { ring: "ring-blue-100", icon: "bg-blue-500", text: "text-blue-600" },
    green: {
      ring: "ring-green-100",
      icon: "bg-emerald-500",
      text: "text-emerald-600",
    },
    red: { ring: "ring-red-100", icon: "bg-red-500", text: "text-red-600" },
    amber: {
      ring: "ring-amber-100",
      icon: "bg-amber-400",
      text: "text-amber-600",
    },
    purple: {
      ring: "ring-purple-100",
      icon: "bg-purple-500",
      text: "text-purple-600",
    },
    slate: {
      ring: "ring-slate-100",
      icon: "bg-slate-600",
      text: "text-slate-500",
    },
  };
  const c = colors[color] || colors.blue;
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 ring-1 ${c.ring} hover:shadow-sm transition-shadow`}
    >
      <div
        className={`w-8 h-8 rounded-lg ${c.icon} text-white flex items-center justify-center mb-3`}
      >
        <Icon size={15} strokeWidth={2.5} />
      </div>
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-1 ${c.text}`}
      >
        {label}
      </p>
      <p className="text-xl font-bold text-slate-900 font-mono leading-none">
        {value}
      </p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

const SectionCard = ({
  title,
  icon: Icon,
  accent = "text-blue-500",
  action,
  children,
}) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
      <div className="flex items-center gap-2.5">
        <Icon size={14} className={accent} strokeWidth={2.5} />
        <span className="text-sm font-bold text-slate-800">{title}</span>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow = ({ label, value, mono, badge }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 gap-4">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] shrink-0">
      {label}
    </span>
    {badge ? (
      badge
    ) : (
      <span
        className={`text-sm font-semibold text-right leading-snug break-all
          ${mono ? "font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs" : "text-slate-800"}`}
      >
        {value || "—"}
      </span>
    )}
  </div>
);

const BarRow = ({ label, value, total, colorClass }) => {
  const pct = pctOf(value, total);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-bold">
        <span className={colorClass}>{label}</span>
        <span className={`font-mono ${colorClass}`}>{fmt(value)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.includes("emerald") ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-400 text-right">
        {pct}% of total billed
      </div>
    </div>
  );
};

const DonutRing = ({ paid, pending, total }) => {
  const r = 52,
    cx = 68,
    cy = 68,
    sw = 13;
  const circ = 2 * Math.PI * r;
  const paidPct = pctOf(paid, total);
  const pendPct = pctOf(pending, total);
  const paidArc = (paidPct / 100) * circ;
  const pendArc = (pendPct / 100) * circ;
  const paidOffset = circ / 4;
  const pendOffset = paidOffset - paidArc;

  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={sw}
      />
      {pendArc > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#ef4444"
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${pendArc} ${circ - pendArc}`}
          strokeDashoffset={pendOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      {paidArc > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#10b981"
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${paidArc} ${circ - paidArc}`}
          strokeDashoffset={paidOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="#0f172a"
        fontFamily="ui-monospace,monospace"
      >
        {paidPct}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#94a3b8">
        paid
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="9" fill="#94a3b8">
        {fmt(total)}
      </text>
    </svg>
  );
};

const getCategoryLabel = (key) => {
  const labels = {
    ACADEMIC: "Academic / Tuition",
    ADMISSION: "Admission",
    READMISSION: "Re-Admission",
    EXAM: "Exams",
    HOSTEL_ADM: "Hostel Admission",
    HOSTEL_MONTHLY: "Hostel Monthly",
    MISC: "Misc / General",
  };
  return labels[key] || key;
};

// Renders ONE COMPLETE, self-contained report — Fee Setup, KPIs, Challan
// Statistics, Installment & Payment table, Monthly Fee Collected — used
// once for the Overall (all-semester) view and once per individual
// semester, so each semester's numbers stay properly separated instead of
// being blended into a single combined view.
const SemesterReportBlock = ({ report = {} }) => {
  const {
    configuredFees = {},
    configuredTotalFee = 0,
    challanStats = {},
    monthlyCollection = { tuition: [], hostelMonthly: [] },
    fullInstallmentPlan = [],
    isInstallmentConfigured = false,
    configuredInstallmentCount = 1,
    financialSummary = { breakdown: {} },
    previousDue = 0,
    totalOutstanding = financialSummary?.totalPending || 0,
    tuitionPaid = financialSummary?.breakdown?.ACADEMIC?.paid || 0,
    tuitionOutstanding = Math.max(
      0,
      (configuredFees.ACADEMIC || 0) -
        (financialSummary?.breakdown?.ACADEMIC?.paid || 0),
    ),
    effectiveScholarship = null,
  } = report;

  const netGen = financialSummary?.netGenerated || 1;
  const totPaid = financialSummary?.totalPaid || 0;
  const totPend = financialSummary?.totalPending || 0;

  // Whatever's already been billed (financialSummary.scholarships, a real
  // sum baked into past challans) takes priority — it's what actually
  // happened. Only fall back to the live active-plan preview
  // (effectiveScholarship) when nothing's been billed yet, so a scholarship
  // shows up the moment it's approved and the fee is set up, not only
  // after a challan happens to get generated.
  const scholarshipAmountDisplay =
    (financialSummary?.scholarships || 0) > 0
      ? financialSummary.scholarships
      : effectiveScholarship?.amount || 0;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Fee Setup"
        icon={Banknote}
        accent="text-emerald-500"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Tuition", val: configuredFees.ACADEMIC },
            { label: "Admission", val: configuredFees.ADMISSION },
            { label: "Exams", val: configuredFees.EXAM },
            { label: "Hostel Adm.", val: configuredFees.HOSTEL_ADM },
            { label: "Hostel Monthly", val: configuredFees.HOSTEL_MONTHLY },
            {
              label: "Misc / Other",
              val: (configuredFees.MISC || 0) + (configuredFees.READMISSION || 0),
            },
            { label: "Total", val: configuredTotalFee, highlight: true },
          ].map(({ label, val, highlight }) => (
            <div
              key={label}
              className={`p-3 rounded-xl border ${highlight ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-slate-50 border-slate-100"}`}
            >
              <p
                className={`text-[9px] font-bold uppercase tracking-wider ${highlight ? "text-blue-600" : "text-slate-400"}`}
              >
                {label}
              </p>
              <p
                className={`font-mono font-bold text-base mt-1 ${highlight ? "text-blue-800" : "text-slate-800"}`}
              >
                {fmt(val)}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {previousDue > 0 && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <p className="text-xs font-bold text-amber-800">
            Previous Semester Due carried forward: {fmt(previousDue)} — added
            into this semester's Total Outstanding below.
          </p>
        </div>
      )}

      <SectionCard
        title="Tuition Outstanding"
        icon={AlertTriangle}
        accent="text-red-500"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border bg-slate-50 border-slate-100">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Tuition Fee Setup
            </p>
            <p className="font-mono font-bold text-base mt-1 text-slate-800">
              {fmt(configuredFees.ACADEMIC)}
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-100">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
              Tuition Paid
            </p>
            <p className="font-mono font-bold text-base mt-1 text-emerald-800">
              {fmt(tuitionPaid)}
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-red-50 border-red-200 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-red-600">
              Tuition Outstanding
            </p>
            <p className="font-mono font-bold text-base mt-1 text-red-800">
              {fmt(tuitionOutstanding)}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">
              Tuition Fee Setup − Tuition Paid
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Net Billed"
          value={fmt(financialSummary?.netGenerated)}
          icon={FileText}
          color="blue"
        />
        <KpiCard
          label="Total Paid"
          value={fmt(financialSummary?.totalPaid)}
          icon={BadgeCheck}
          color="green"
        />
        <KpiCard
          label="Outstanding (This Semester)"
          value={fmt(financialSummary?.totalPending)}
          icon={AlertTriangle}
          color="red"
        />
        <KpiCard
          label="Total Outstanding (Incl. Previous)"
          value={fmt(totalOutstanding)}
          icon={AlertTriangle}
          color="amber"
          sub={previousDue > 0 ? `+ ${fmt(previousDue)} carried` : undefined}
        />
        <KpiCard
          label="Scholarships"
          value={fmt(scholarshipAmountDisplay)}
          icon={GraduationCap}
          color="purple"
          sub={effectiveScholarship?.name ? effectiveScholarship.name : undefined}
        />
        <KpiCard
          label="Fines Paid"
          value={fmt(financialSummary?.finesPaid)}
          icon={ShieldAlert}
          color="slate"
        />
      </div>

      <SectionCard title="Challan Statistics" icon={Hash} accent="text-blue-500">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: "Total Generated",
              count: challanStats.totalCount,
              amount: challanStats.totalAmount,
              color: "text-slate-800",
              bg: "bg-slate-50 border-slate-100",
            },
            {
              label: "Paid",
              count: challanStats.paidCount,
              amount: challanStats.paidAmount,
              color: "text-emerald-700",
              bg: "bg-emerald-50 border-emerald-100",
            },
            {
              label: "Unpaid",
              count: challanStats.unpaidCount,
              amount: challanStats.unpaidAmount,
              color: "text-orange-700",
              bg: "bg-orange-50 border-orange-100",
            },
            {
              label: "Overdue",
              count: challanStats.overdueCount,
              amount: challanStats.overdueAmount,
              color: "text-red-700",
              bg: "bg-red-50 border-red-100",
            },
            {
              label: "Fines on Challans",
              count: null,
              amount: challanStats.totalFines,
              color: "text-amber-700",
              bg: "bg-amber-50 border-amber-100",
            },
          ].map(({ label, count, amount, color, bg }) => (
            <div key={label} className={`p-3 rounded-xl border ${bg}`}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className={`font-mono font-bold text-base mt-1 ${color}`}>
                {fmt(amount)}
              </p>
              {count !== null && (
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  {count} challan{count === 1 ? "" : "s"}
                </p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Detailed Installment & Payment Record"
        icon={Hash}
        accent="text-indigo-500"
      >
        <p className="text-[10px] text-slate-400 -mt-2 mb-3">
          {isInstallmentConfigured
            ? `${configuredInstallmentCount}-part installment plan`
            : "Standard single payment (1 Part)"}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-[10px] uppercase text-slate-400">
                <th className="px-4 py-3 font-bold">Inst #</th>
                <th className="px-4 py-3 font-bold">Month</th>
                <th className="px-4 py-3 font-bold text-right">
                  Expected Fee
                </th>
                <th className="px-4 py-3 font-bold text-center">
                  Challan Status
                </th>
                <th className="px-4 py-3 font-bold text-center">
                  Payment Status
                </th>
                <th className="px-4 py-3 font-bold text-right">
                  Paid Amount
                </th>
                <th className="px-4 py-3 font-bold text-center">
                  Paid Date
                </th>
                <th className="px-4 py-3 font-bold">Challan Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fullInstallmentPlan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No tuition fee configured for this scope yet.
                  </td>
                </tr>
              ) : (
                fullInstallmentPlan.map((plan) => (
                  <tr key={plan.number} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">
                        No. {plan.number}
                      </span>
                      <span className="ml-1.5 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {plan.percentage?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {plan.month || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-semibold text-slate-700">
                        {fmt(plan.netAmount)}
                      </span>
                      {plan.scholarshipAmount > 0 && (
                        <span className="block text-[9px] text-emerald-600 font-semibold mt-0.5">
                          {fmt(plan.expectedAmount)} − {fmt(plan.scholarshipAmount)} scholarship
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {plan.generationStatus === "Generated" ? (
                        <span className="text-[9px] font-bold uppercase text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          Generated
                        </span>
                      ) : plan.generationStatus === "Fully Covered" ? (
                        <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Fully Covered
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Not Generated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={plan.paymentStatus} small />
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                      {fmt(plan.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-500">
                      {fmtDate(plan.paidDate)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                      {plan.challanNo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Monthly Fee Collected"
        icon={Calendar}
        accent="text-indigo-500"
      >
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tuition{" "}
              {isInstallmentConfigured
                ? `(${configuredInstallmentCount}-part plan)`
                : "(Standard single payment)"}
            </p>
            {monthlyCollection.tuition.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No tuition fee configured for this scope yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {monthlyCollection.tuition.map((m) => (
                  <div
                    key={m.installmentNumber}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <p className="text-[10px] font-bold text-slate-600">
                      {m.month}
                    </p>
                    <p className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                      {fmt(m.amount)}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={m.status} small />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Home size={11} /> Hostel Monthly
            </p>
            {monthlyCollection.hostelMonthly.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No hostel monthly challans for this scope.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {monthlyCollection.hostelMonthly.map((m, i) => (
                  <div
                    key={`${m.month}-${i}`}
                    className="p-2.5 rounded-lg border border-purple-100 bg-purple-50/40"
                  >
                    <p className="text-[10px] font-bold text-slate-600">
                      {m.month}
                    </p>
                    <p className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                      {fmt(m.amount)}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={m.status} small />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Financial Health"
        icon={BarChart3}
        accent="text-slate-500"
      >
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-2 flex items-center gap-4">
              <DonutRing paid={totPaid} pending={totPend} total={netGen} />
              <div className="space-y-2 flex-1">
                {[
                  {
                    dot: "bg-emerald-500",
                    label: "Paid",
                    pct: pctOf(totPaid, netGen),
                  },
                  {
                    dot: "bg-red-500",
                    label: "Outstanding",
                    pct: pctOf(totPend, netGen),
                  },
                ].map(({ dot, label, pct }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-slate-500 font-medium">
                        {label}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="xl:col-span-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Actual Bills Generated vs Paid
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(financialSummary?.breakdown || {}).map(
                  ([cat, stats]) => {
                    if (!stats || (stats.generated === 0 && stats.configured === 0))
                      return null;
                    return (
                      <div
                        key={cat}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded-lg"
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {getCategoryLabel(cat)}
                        </span>
                        <div className="text-right">
                          <p className="font-mono text-[11px] font-bold text-slate-800">
                            Gen: {fmt(stats.generated)}
                          </p>
                          <p className="text-[9px] text-emerald-600 font-bold">
                            Paid: {fmt(stats.paid)}
                          </p>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </SectionCard>
    </div>
  );
};

// One semester's transaction table — extracted so the Ledger tab can
// render a properly separate table per semester instead of one flat list
// mixing every semester's challans together.
const LedgerTable = ({ challans = [] }) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 bg-white">
            <th className="px-5 py-3 font-bold">Challan Ref</th>
            <th className="px-5 py-3 font-bold">Type</th>
            <th className="px-5 py-3 font-bold">Generated</th>
            <th className="px-5 py-3 font-bold">Due Date</th>
            <th className="px-5 py-3 font-bold text-right">Base Amount</th>
            <th className="px-5 py-3 font-bold text-right">Fine</th>
            <th className="px-5 py-3 font-bold text-right">Net Total</th>
            <th className="px-5 py-3 font-bold text-right">Paid</th>
            <th className="px-5 py-3 font-bold text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {challans.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-16 text-center">
                <ReceiptText size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">
                  No matching records
                </p>
              </td>
            </tr>
          ) : (
            challans.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-mono font-bold text-slate-800">
                    {c.challanNo}
                  </p>
                  {c.isInstallment && (
                    <span className="text-[9px] bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      Inst. {c.installmentNumber}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {(c.challanType || "").replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">
                  {c.isImplied ? (
                    <span className="italic text-slate-400">Legacy</span>
                  ) : (
                    fmtDate(c.createdAt)
                  )}
                </td>
                <td
                  className={`px-5 py-3.5 font-mono text-[10px] ${c.status === "overdue" ? "text-red-500 font-bold" : "text-slate-500"}`}
                >
                  {fmtDate(c.dueDate)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-700">
                  {fmt(c.originalTotal)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-amber-600">
                  {c.fineAmount > 0 ? (
                    fmt(c.fineAmount)
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                  {fmt(c.netAmount)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-semibold text-emerald-600">
                  {fmt(c.paidAmount)}
                </td>
                <td className="px-5 py-3.5 text-center">
                  {c.isImplied ? (
                    <span className="text-[9px] uppercase font-bold bg-emerald-50 text-emerald-600 border border-dashed border-emerald-300 px-2 py-0.5 rounded-full">
                      Assumed
                    </span>
                  ) : (
                    <StatusBadge status={c.status} small />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {challans.length > 0 && (
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-6 text-xs font-bold">
        <span className="text-slate-500">
          Net Total:{" "}
          <span className="font-mono text-slate-900 ml-1">
            {fmt(challans.reduce((a, c) => a + (c.netAmount || 0), 0))}
          </span>
        </span>
        <span className="text-emerald-600">
          Total Paid:{" "}
          <span className="font-mono ml-1">
            {fmt(challans.reduce((a, c) => a + (c.paidAmount || 0), 0))}
          </span>
        </span>
      </div>
    )}
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const StudentReportView = ({
  filters = {},
  handleFilterChange = () => {},
  terms = [],
  departments = [],
  programs = [],
  semesters = [],
  studentsList = [],
  loadMoreStudents = () => {},
  hasMore = false,
  isSearching = false,
  selectedStudentId = null,
  handleSelectStudent = () => {},
  studentDetails = null,
  financialSummary = {},
  safeFullName = "Unknown",
  safeFatherName = "N/A",
  safeRegNo = "N/A",
  safeCnic = "N/A",
  safePhone = "N/A",
  safeEmail = "N/A",
  safeDob = null,
  safeAddress = null,
  isLoadingDetails = false,
  activeTab = "overview",
  setActiveTab = () => {},
  isMasterExporting = false,
  handleExportMasterExcel = () => {},
  handleExportStudentPDF = () => {},
  handleExportStudentExcel = () => {},
  isPdfExporting = false,
  isStudentExcelExporting = false,
  isDirectoryExcelExporting = false,
  isDirectoryPdfExporting = false,
  handleExportDirectoryExcel = () => {},
  handleExportDirectoryPDF = () => {},
  overallReport = {},
  semesterReports = [],
  activeScholarship = null,
}) => {
  const sentinelRef = useRef(null);
  const [ledgerFilter, setLedgerFilter] = useState("ALL");
  const [activeSemesterId, setActiveSemesterId] = useState(null);

  // Default to the student's most recent (current) semester whenever the
  // selection changes or the list first loads, instead of leaving the
  // dropdown on a stale/blank value.
  useEffect(() => {
    if (semesterReports.length === 0) return;
    const stillValid = semesterReports.some(
      (s) => String(s.semesterId) === String(activeSemesterId),
    );
    if (!activeSemesterId || !stillValid) {
      setActiveSemesterId(semesterReports[semesterReports.length - 1].semesterId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterReports, selectedStudentId]);

  const activeSemesterReport =
    semesterReports.find(
      (s) => String(s.semesterId) === String(activeSemesterId),
    ) || semesterReports[semesterReports.length - 1];

  const loaderCb = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && !isSearching && hasMore)
        loadMoreStudents();
    },
    [isSearching, hasMore, loadMoreStudents],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCb, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCb]);

  useEffect(() => {
    setLedgerFilter("ALL");
  }, [activeTab, selectedStudentId]);

  const pDept = studentDetails?.departmentId?.name || "N/A";
  const pProg = studentDetails?.programId?.name || "N/A";
  const pSem = studentDetails?.semesterId?.number
    ? `Semester ${studentDetails.semesterId.number}`
    : "N/A";
  const pTerm = studentDetails?.termId?.name || "N/A";

  // Scoped to whichever semester is active in the Dashboard tab's dropdown
  // (same activeSemesterId) — the Ledger tab shows THAT semester's
  // challans only, not every semester's history mixed together.
  const activeLedger = activeSemesterReport?.ledger || [];

  const filteredLedger = activeLedger.filter((c) => {
    if (ledgerFilter === "ALL") return true;
    const t = (c.challanType || "").toUpperCase();
    if (ledgerFilter === "ACADEMIC")
      return t === "ACADEMIC_FEE" || t === "INSTALLMENT" || c.isInstallment;
    if (ledgerFilter === "ADMISSION")
      return t === "ADMISSION_FEE" || t === "READMISSION_FEE";
    if (ledgerFilter === "EXAM") return t === "EXAM_FEE";
    if (ledgerFilter === "HOSTEL_ADM")
      return t.includes("HOSTEL") && t.includes("ADMISSION");
    if (ledgerFilter === "HOSTEL_MONTHLY")
      return t.includes("HOSTEL") && !t.includes("ADMISSION");
    if (ledgerFilter === "MISC")
      return t === "MISC" || t === "MISC_FEE" || t === "GENERAL";
    return true;
  });

  const TABS = [
    { key: "overview", label: "Dashboard", icon: BarChart3 },
    { key: "history", label: "Ledger", icon: ReceiptText },
    { key: "profile", label: "Profile", icon: User },
  ];

  const LEDGER_FILTERS = [
    { val: "ALL", label: "All transactions" },
    { val: "ACADEMIC", label: "Academic / Tuition" },
    { val: "ADMISSION", label: "Admission" },
    { val: "EXAM", label: "Exams" },
    { val: "HOSTEL_ADM", label: "Hostel Admission" },
    { val: "HOSTEL_MONTHLY", label: "Hostel Monthly" },
    { val: "MISC", label: "Miscellaneous" },
  ];


  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-slate-900 leading-none">
              Student Financial Reports
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              University Academic & Financial Dossier System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DirectoryExportControl
            onExportExcel={handleExportDirectoryExcel}
            onExportPDF={handleExportDirectoryPDF}
            isExportingExcel={isDirectoryExcelExporting}
            isExportingPDF={isDirectoryPdfExporting}
          />
          <MasterExportControl
            onExport={handleExportMasterExcel}
            isExporting={isMasterExporting}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={filters?.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/60 space-y-1.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Filter size={9} /> Filters
            </p>
            {[
              { key: "termId", placeholder: "All Sessions", opts: terms },
              {
                key: "departmentId",
                placeholder: "All Departments",
                opts: departments,
              },
              {
                key: "programId",
                placeholder: "All Programs",
                opts: programs,
                disabled: !filters.departmentId,
              },
              {
                key: "semesterId",
                placeholder: "All Semesters",
                opts: semesters,
                disabled: !filters.programId,
              },
            ].map(({ key, placeholder, opts, disabled }) => (
              <div key={key} className="relative">
                <select
                  disabled={disabled}
                  value={filters?.[key] || ""}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full pl-2.5 pr-7 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-700 font-medium appearance-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer transition-all"
                >
                  <option value="">{placeholder}</option>
                  {opts?.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name ||
                        (o.number ? `Semester ${o.number}` : "Unknown")}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={10}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {isSearching && studentsList.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-blue-400" />
              </div>
            )}
            {studentsList.length === 0 && !isSearching && (
              <div className="text-center py-8 px-4 text-xs text-slate-400">
                No students found.
              </div>
            )}
            {studentsList.map((student) => {
              const name =
                student?.personalInfo?.fullName ||
                student?.fullName ||
                "Unknown";
              const isSel = selectedStudentId === student?._id;
              const hue = hueFromName(name);
              return (
                <button
                  key={student._id}
                  onClick={() => handleSelectStudent(student._id)}
                  className={`w-full px-3 py-2.5 text-left flex items-center gap-2.5 border-l-2 transition-all ${isSel ? "bg-blue-50 border-blue-500" : "border-transparent hover:bg-slate-50/80"}`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0"
                    style={{
                      background: `hsl(${hue},50%,91%)`,
                      color: `hsl(${hue},50%,32%)`,
                    }}
                  >
                    {getInitials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold truncate ${isSel ? "text-blue-700" : "text-slate-800"}`}
                    >
                      {name}
                    </p>
                    <p
                      className={`text-[9px] font-mono mt-0.5 ${isSel ? "text-blue-500" : "text-slate-400"}`}
                    >
                      {student?.studentId}
                    </p>
                  </div>
                  {isSel && (
                    <ChevronRight
                      size={12}
                      className="text-blue-500 shrink-0"
                    />
                  )}
                </button>
              );
            })}
            <div ref={sentinelRef} className="h-3" />
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedStudentId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ReceiptText size={28} className="text-slate-400" />
              </div>
              <div className="text-center">
                <h2 className="text-base font-bold text-slate-700">
                  Select a student
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose from the directory to view financial details
                </p>
              </div>
            </div>
          ) : isLoadingDetails ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{
                        background: `hsl(${hueFromName(safeFullName)},50%,91%)`,
                        color: `hsl(${hueFromName(safeFullName)},50%,32%)`,
                      }}
                    >
                      {getInitials(safeFullName)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {safeFullName}
                      </h2>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {pProg} · {pSem} · {pTerm} ·{" "}
                        <span className="text-blue-500">{safeRegNo}</span>
                      </p>
                      {semesterReports.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            Semester:
                          </span>
                          <div className="relative">
                            <select
                              value={activeSemesterId || ""}
                              onChange={(e) => setActiveSemesterId(e.target.value)}
                              className="text-[11px] font-bold pl-2.5 pr-6 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 appearance-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                            >
                              {semesterReports.map((s) => (
                                <option key={s.semesterId} value={s.semesterId}>
                                  Semester {s.number ?? "—"}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={11}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportStudentExcel}
                      disabled={isStudentExcelExporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
                    >
                      {isStudentExcelExporting ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <FileSpreadsheet size={11} />
                      )}{" "}
                      Excel
                    </button>
                    <button
                      onClick={handleExportStudentPDF}
                      disabled={isPdfExporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
                    >
                      {isPdfExporting ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <FileDown size={11} />
                      )}{" "}
                      PDF
                    </button>
                    <button
                      onClick={() => window.print?.()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Printer size={11} /> Print
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border-b border-slate-200 px-6 shrink-0">
                <div className="flex gap-1">
                  {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all ${activeTab === key ? "border-blue-500 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"}`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
                {activeTab === "overview" && (
                  <div className="space-y-5 max-w-6xl mx-auto">
                    {activeSemesterReport ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                            Semester {activeSemesterReport.number ?? "—"}
                          </h3>
                        </div>
                        <SemesterReportBlock report={activeSemesterReport} />
                      </>
                    ) : (
                      <div className="text-center py-16 text-slate-400 text-sm">
                        No semester-specific data recorded for this student
                        yet.
                      </div>
                    )}
                  </div>
                )}

                {/* ── LEDGER TAB ── */}
                {activeTab === "history" && (
                  <div className="max-w-6xl mx-auto space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                        <p className="text-sm font-bold text-slate-800">
                          Transaction Ledger — Semester{" "}
                          {activeSemesterReport?.number ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter size={12} className="text-slate-400" />
                        <select
                          value={ledgerFilter}
                          onChange={(e) => setLedgerFilter(e.target.value)}
                          className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 outline-none cursor-pointer"
                        >
                          {LEDGER_FILTERS.map(({ val, label }) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <span className="text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-lg">
                          {filteredLedger.length} records
                        </span>
                      </div>
                    </div>

                    <LedgerTable challans={filteredLedger} />
                  </div>
                )}

                {/* ── PROFILE TAB ── */}
                {activeTab === "profile" && (
                  <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SectionCard
                      title="Personal Information"
                      icon={User}
                      accent="text-purple-500"
                    >
                      <InfoRow label="Full Name" value={safeFullName} />
                      <InfoRow label="Father's Name" value={safeFatherName} />
                      <InfoRow label="CNIC" value={safeCnic} mono />
                      <InfoRow label="Date of Birth" value={fmtDate(safeDob)} />
                    </SectionCard>
                    <SectionCard
                      title="Contact Details"
                      icon={Phone}
                      accent="text-emerald-500"
                    >
                      <InfoRow label="Phone" value={safePhone} mono />
                      <InfoRow label="Email" value={safeEmail} />
                      <InfoRow
                        label="Address"
                        value={formatAddress(safeAddress) || "Not provided"}
                      />
                    </SectionCard>
                    <SectionCard
                      title="Academic Details"
                      icon={GraduationCap}
                      accent="text-amber-500"
                    >
                      <InfoRow label="Program" value={pProg} />
                      <InfoRow label="Department" value={pDept} />
                      <InfoRow label="Semester" value={pSem} />
                      <InfoRow label="Session" value={pTerm} />
                    </SectionCard>
                    <SectionCard
                      title="Fee Configuration"
                      icon={CreditCard}
                      accent="text-blue-500"
                    >
                      <InfoRow
                        label="Total Base Setup"
                        value={fmt(overallReport.configuredTotalFee)}
                      />
                      <InfoRow
                        label="Payment Mode (Current Semester)"
                        value={
                          overallReport.isInstallmentConfigured
                            ? `${overallReport.configuredInstallmentCount} Installments`
                            : "Standard Payment"
                        }
                      />
                      <InfoRow
                        label="Net Billed (All)"
                        value={fmt(financialSummary?.netGenerated)}
                      />
                      <InfoRow
                        label="Total Outstanding"
                        value={fmt(financialSummary?.totalPending)}
                      />
                    </SectionCard>
                    <SectionCard
                      title="Scholarship"
                      icon={Award}
                      accent="text-emerald-500"
                    >
                      {activeScholarship?.hasScholarship ? (
                        <>
                          <InfoRow
                            label="Plan"
                            value={activeScholarship.plan?.title}
                          />
                          <InfoRow
                            label="Rate"
                            value={
                              activeScholarship.plan?.type === "fixed"
                                ? `${fmt(activeScholarship.plan?.maxAmount)} flat`
                                : `${activeScholarship.plan?.maxPercentage || 0}% of tuition`
                            }
                          />
                          <InfoRow
                            label="Semester Tuition"
                            value={fmt(activeScholarship.tuitionPortion)}
                          />
                          <InfoRow
                            label="Scholarship Deduction"
                            value={`− ${fmt(activeScholarship.scholarshipAmount)}`}
                          />
                          <InfoRow
                            label="Net Payable Tuition"
                            value={fmt(activeScholarship.netTuition)}
                          />
                        </>
                      ) : (
                        <p className="text-sm text-slate-400 italic py-2">
                          No scholarship currently assigned.
                        </p>
                      )}
                    </SectionCard>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentReportView;
