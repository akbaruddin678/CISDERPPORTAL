import {
  Building2,
  GraduationCap,
  Layers,
  ChevronRight,
  Home,
  TrendingUp,
  Receipt,
  FileText,
  Loader2,
  Inbox,
} from "lucide-react";
import { useRevenueExplorer } from "../controller/useRevenueExplorer";

const fmt = (v) =>
  `Rs ${Number(v || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const CATEGORY_LABELS = {
  ACADEMIC: "Tuition",
  EXAM: "Exam",
  ADMISSION: "Admission",
  READMISSION: "Readmission",
  MISC: "Misc",
};
const CATEGORY_COLORS = {
  ACADEMIC: "bg-indigo-50 text-indigo-700 border-indigo-100",
  EXAM: "bg-amber-50 text-amber-700 border-amber-100",
  ADMISSION: "bg-emerald-50 text-emerald-700 border-emerald-100",
  READMISSION: "bg-violet-50 text-violet-700 border-violet-100",
  MISC: "bg-slate-50 text-slate-600 border-slate-200",
};

const LEVEL_META = {
  department: { icon: Building2, label: "Department", next: "Programs" },
  program: { icon: GraduationCap, label: "Program", next: "Semesters" },
  semester: { icon: Layers, label: "Semester", next: "Students" },
};

const CategoryChips = ({ categories }) => {
  const nonZero = Object.entries(categories || {}).filter(
    ([, v]) => v.generated > 0,
  );
  if (nonZero.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {nonZero.map(([cat, v]) => (
        <span
          key={cat}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.MISC}`}
          title={`${CATEGORY_LABELS[cat] || cat}: ${fmt(v.generated)} generated, ${fmt(v.collected)} collected`}
        >
          {CATEGORY_LABELS[cat] || cat}: {fmt(v.generated)}
        </span>
      ))}
    </div>
  );
};

const GroupCard = ({ item, currentLevel, onDrill }) => {
  const collectionRate =
    item.totalGenerated > 0
      ? Math.round((item.totalCollected / item.totalGenerated) * 100)
      : 0;
  return (
    <button
      onClick={() => onDrill(item)}
      className="text-left bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <p className="font-bold text-sm text-slate-800">{item.name}</p>
          <p className="text-[11px] text-slate-400">
            {item.totalChallans} challan{item.totalChallans === 1 ? "" : "s"}{" "}
            · {item.paidCount} paid / {item.unpaidCount} unpaid
          </p>
        </div>
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-0.5"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[9px] font-bold uppercase text-slate-400">
            Generated
          </p>
          <p className="text-xs font-bold text-slate-800">
            {fmt(item.totalGenerated)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase text-slate-400">
            Collected
          </p>
          <p className="text-xs font-bold text-emerald-600">
            {fmt(item.totalCollected)}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase text-slate-400">
            Pending
          </p>
          <p className="text-xs font-bold text-rose-600">
            {fmt(item.totalPending)}
          </p>
        </div>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={{ width: `${Math.min(collectionRate, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">
        {collectionRate}% collected
      </p>

      {currentLevel === "semester" && <CategoryChips categories={item.categories} />}
    </button>
  );
};

const InstallmentBadge = ({ student }) => {
  if (!student.hasInstallmentPlan) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-50 text-slate-400 border border-slate-200">
        Whole Fee
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-100">
      {student.installmentPlan?.count || "?"} Installments
    </span>
  );
};

const ChallanMiniList = ({ challans }) => {
  if (!challans || challans.length === 0) {
    return <span className="text-[11px] text-slate-300">No challan this month</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {challans.slice(0, 3).map((c) => (
        <div key={c._id} className="flex items-center gap-1.5 text-[11px]">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              c.status === "paid"
                ? "bg-emerald-500"
                : c.status === "overdue"
                  ? "bg-rose-500"
                  : "bg-amber-400"
            }`}
          />
          <span className="font-mono text-slate-500">{c.challanNo}</span>
          <span className="text-slate-400">{fmt(c.netAmount)}</span>
        </div>
      ))}
      {challans.length > 3 && (
        <span className="text-[10px] text-slate-400">
          +{challans.length - 3} more
        </span>
      )}
    </div>
  );
};

const StudentTable = ({ students, linkToStudent, readOnly }) => {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
        <Inbox size={32} className="opacity-30" />
        <p className="text-sm font-semibold">No students in this semester</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                Student
              </th>
              <th className="px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                Plan
              </th>
              <th className="px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                Challans This Month
              </th>
              <th className="px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                Generated
              </th>
              <th className="px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                Collected
              </th>
              <th className="px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                Pending
              </th>
              {!readOnly && (
                <th className="px-3.5 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  Manage
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.studentId}
                className="border-b border-slate-50 hover:bg-slate-50/70"
              >
                <td className="px-3.5 py-2.5">
                  <div className="font-semibold text-slate-800">
                    {s.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {s.regNo} · S/o {s.fatherName}
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <InstallmentBadge student={s} />
                </td>
                <td className="px-3.5 py-2.5">
                  <ChallanMiniList challans={s.challansThisMonth} />
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-700">
                  {fmt(s.totalGenerated)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-600">
                  {fmt(s.totalCollected)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-rose-600">
                  {fmt(s.totalPending)}
                </td>
                {!readOnly && (
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => linkToStudent(s.studentId, "feeSetup")}
                        title="Open in Fee Setup"
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
                      >
                        <FileText size={13} />
                      </button>
                      <button
                        onClick={() => linkToStudent(s.studentId, "installment")}
                        title="Open in Installment Configuration"
                        className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-100"
                      >
                        <Layers size={13} />
                      </button>
                      <button
                        onClick={() => linkToStudent(s.studentId, "challan")}
                        title="Open in Challan Management"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                      >
                        <Receipt size={13} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RevenueExplorerContainer = ({ readOnly = false } = {}) => {
  const {
    month,
    setMonth,
    year,
    setYear,
    monthOptions,
    yearOptions,
    period,
    department,
    program,
    semester,
    currentLevel,
    items,
    unassignedTotal,
    students,
    isLoading,
    drillInto,
    goToRoot,
    goToDepartment,
    goToProgram,
    linkToStudent,
  } = useRevenueExplorer();

  const meta = LEVEL_META[currentLevel] || LEVEL_META.department;
  const LevelIcon = meta.icon;

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">
              Revenue Explorer
            </h1>
            <p className="text-xs text-slate-400">
              Department → Program → Semester → Student ·{" "}
              {period?.monthName || monthOptions[month - 1]?.label} {period?.year || year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 flex-wrap bg-white rounded-xl border border-slate-100 px-3 py-2.5">
        <button
          onClick={goToRoot}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors ${!department ? "text-indigo-600 bg-indigo-50" : "text-slate-500"}`}
        >
          <Home size={12} /> All Departments
        </button>
        {department && (
          <>
            <ChevronRight size={12} className="text-slate-300 shrink-0" />
            <button
              onClick={goToDepartment}
              className={`px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors ${!program ? "text-indigo-600 bg-indigo-50" : "text-slate-500"}`}
            >
              {department.name}
            </button>
          </>
        )}
        {program && (
          <>
            <ChevronRight size={12} className="text-slate-300 shrink-0" />
            <button
              onClick={goToProgram}
              className={`px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors ${!semester ? "text-indigo-600 bg-indigo-50" : "text-slate-500"}`}
            >
              {program.name}
            </button>
          </>
        )}
        {semester && (
          <>
            <ChevronRight size={12} className="text-slate-300 shrink-0" />
            <span className="px-2 py-1 rounded-lg text-indigo-600 bg-indigo-50">
              {semester.name}
            </span>
          </>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center h-60 bg-white rounded-xl border border-slate-100">
          <Loader2 size={26} className="animate-spin text-indigo-400" />
        </div>
      ) : currentLevel === "student" ? (
        <StudentTable students={students} linkToStudent={linkToStudent} readOnly={readOnly} />
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <LevelIcon size={32} className="opacity-30" />
          <p className="text-sm font-semibold">
            No revenue recorded for this {meta.label.toLowerCase()} this month
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 px-1">
            <LevelIcon size={13} className="text-indigo-500" />
            {items.length} {meta.label}
            {items.length !== 1 ? "s" : ""} — click one to see its {meta.next}
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <GroupCard
                key={item.id}
                item={item}
                currentLevel={currentLevel}
                onDrill={drillInto}
              />
            ))}
          </div>
          {unassignedTotal > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700">
              <strong>{fmt(unassignedTotal)}</strong> in challans this month
              have no {meta.label.toLowerCase()} on record and aren't
              included above.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RevenueExplorerContainer;
