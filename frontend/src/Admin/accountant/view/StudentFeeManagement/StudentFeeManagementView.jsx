import React, { useRef, useCallback, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Check,
  Users,
  X,
  ArrowLeft,
  Receipt,
  SlidersHorizontal,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Loader2,
  AlertCircle,
  Layers,
  FileText,
  CreditCard,
  FlaskConical,
  BookMarked,
  Sparkles,
  MoreHorizontal,
  CheckCircle2,
  Settings,
  Save,
  Globe,
  History,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { CircularProgress, Tabs, Tab, Checkbox } from "@mui/material";
import StudentFeeModal from "./StudentFeeModal";

const formatCurrency = (val) =>
  Number(val).toLocaleString("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });

const Avatar = ({ name = "", size = "sm" }) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const sz = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
  };
  return (
    <div
      className={`${sz[size]} rounded-full flex items-center justify-center font-bold shrink-0 border-2 border-white`}
      style={{
        background: `hsl(${hue},55%,88%)`,
        color: `hsl(${hue},55%,30%)`,
      }}
    >
      {initials || "?"}
    </div>
  );
};

const Badge = ({ children, variant = "default" }) => {
  const map = {
    default: "bg-slate-100 text-slate-600 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-sky-50    text-sky-700    border-sky-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    warning: "bg-amber-50  text-amber-700  border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${map[variant]}`}
    >
      {children}
    </span>
  );
};

// Removed MISC from Tabs
const FEE_TABS = [
  { label: "Tuition", icon: GraduationCap, category: "ACADEMIC" },
  { label: "Admission", icon: FileText, category: "ADMISSION" },
  { label: "Re-Admission", icon: Receipt, category: "READMISSION" },
  { label: "Exam", icon: BookMarked, category: "EXAM" },
];

// ==========================================
// 🌟 NEW GLOBAL MISC MODAL COMPONENT 🌟
// ==========================================
const GlobalMiscModal = ({
  isOpen,
  onClose,
  miscFees = [],
  onCreate,
  onDelete,
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;
    setLoading(true);
    try {
      await onCreate({ title, name: title, amount: Number(amount) }).unwrap();
      setTitle("");
      setAmount("");
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-emerald-50">
          <div className="flex items-center gap-3 text-emerald-800">
            <Globe size={22} className="text-emerald-500" />
            <div>
              <h2 className="font-bold text-base">Global Miscellaneous Fees</h2>
              <p className="text-xs font-medium text-emerald-600/80">
                These fees are available to ALL students during challan
                generation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-600/60 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Create New Form */}
        <form
          onSubmit={handleAdd}
          className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-end gap-3"
        >
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Fee Title
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Degree Issuance"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
          <div className="w-32">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Amount (Rs)
            </label>
            <input
              required
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono font-bold text-slate-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !title || !amount}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center h-[38px] w-[38px] shrink-0"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
          </button>
        </form>

        {/* List of Existing Fees */}
        <div className="p-5 overflow-y-auto max-h-[350px]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Active Global Fees
          </h3>
          {miscFees.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-slate-400">
              <Sparkles size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">No global fees defined yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {miscFees.map((fee) => (
                <div
                  key={fee._id}
                  className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {fee.title || fee.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {formatCurrency(fee.amount)}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${fee.title || fee.name}?`))
                          onDelete(fee._id);
                      }}
                      className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                      title="Delete Global Fee"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FeeSetupPage = (props) => {
  const {
    setShowGeneratorPage,
    selectedStudents,
    activeTab,
    setActiveTab,
    tableData,
    loadingFees,
    handleAdd,
    handleEdit,
    handleDelete,
    handleAssignSemester,
    isAssigningSemester,
    modalState,
    closeModal,
    currentSemesterFeeStatus,
    currentSemesterId,
    isSemesterScopedTab,
    hiddenOlderTermCount,
    showAllTerms,
    setShowAllTerms,
    ...rest
  } = props;

  const isBulk = selectedStudents.length > 1;
  const tabMeta = FEE_TABS[activeTab];
  const TabIcon = tabMeta?.icon || Receipt;

  // Once a single student already has a record for this category (their
  // current semester's, when the category is semester-scoped), there's
  // nothing to "add" — editing that one record is the only valid action.
  const existingRecord = !isBulk ? tableData[0] : null;
  const hasExistingRecord = !isBulk && tableData.length > 0;
  const handlePrimaryAction = () =>
    hasExistingRecord ? handleEdit(existingRecord) : handleAdd();

  return (
    <div
      className="h-[calc(100vh-100px)] bg-slate-50 flex flex-col"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-4 shrink-0">
        <button
          onClick={() => setShowGeneratorPage(false)}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
          <span>Fee Management</span>
          <ChevronRight size={13} />
          <span className="text-slate-800 font-semibold">Setup</span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
            <Users size={13} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-600">
              {selectedStudents.length}
            </span>
          </div>
          <button
            onClick={handlePrimaryAction}
            className={`flex items-center gap-2 px-4 py-2.5 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm ${
              hasExistingRecord
                ? "bg-slate-800 hover:bg-slate-900"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
            }`}
          >
            {hasExistingRecord ? <Edit size={15} /> : <Plus size={16} />}
            {isBulk
              ? "Set Bulk Fee"
              : hasExistingRecord
                ? "Edit Fee"
                : "Set Fee"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[240px] bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Students
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {selectedStudents.map((s) => {
              const name = s.personalInfo?.fullName || "Unknown";
              const semNumber = s.semesterId?.number;
              return (
                <div
                  key={s._id}
                  className="px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] font-mono text-indigo-500 font-semibold">
                          {s.studentId}
                        </p>
                        {semNumber && (
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                            Sem {semNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-4 shrink-0">
            <div className="flex gap-1">
              {FEE_TABS.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${isActive ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SEMESTER STATUS BANNER ── */}
          {!isBulk && currentSemesterFeeStatus && !loadingFees && (
            <div
              className={`px-5 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
                currentSemesterFeeStatus.configured
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-amber-50 border-amber-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {currentSemesterFeeStatus.configured ? (
                  <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert size={17} className="text-amber-600 shrink-0" />
                )}
                <p
                  className={`text-sm font-semibold ${
                    currentSemesterFeeStatus.configured
                      ? "text-emerald-800"
                      : "text-amber-800"
                  }`}
                >
                  {currentSemesterFeeStatus.configured
                    ? `${tabMeta?.label} fee is already set up for Semester ${currentSemesterFeeStatus.semesterNumber ?? "—"}${currentSemesterFeeStatus.termName ? ` (${currentSemesterFeeStatus.termName})` : ""}.`
                    : `This student needs a ${tabMeta?.label} fee setup for Semester ${currentSemesterFeeStatus.semesterNumber ?? "—"}${currentSemesterFeeStatus.termName ? ` (${currentSemesterFeeStatus.termName})` : ""} — none configured yet.`}
                  {currentSemesterFeeStatus.isLegacyUntagged && (
                    <span className="block text-xs font-normal text-emerald-700 mt-0.5">
                      This is an older record set up before section
                      tracking — assign it properly so it stops relying on
                      a fallback.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentSemesterFeeStatus.isLegacyUntagged && (
                  <button
                    onClick={() =>
                      handleAssignSemester(currentSemesterFeeStatus.legacyRecordId)
                    }
                    disabled={isAssigningSemester}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                  >
                    <CheckCircle2 size={13} />
                    {isAssigningSemester
                      ? "Assigning..."
                      : `Assign to Semester ${currentSemesterFeeStatus.semesterNumber ?? ""}`}
                  </button>
                )}
                {hiddenOlderTermCount > 0 && (
                  <button
                    onClick={() => setShowAllTerms(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 whitespace-nowrap"
                  >
                    <History size={13} /> Show {hiddenOlderTermCount} older
                    record{hiddenOlderTermCount !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
              {showAllTerms && (
                <button
                  onClick={() => setShowAllTerms(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 whitespace-nowrap"
                >
                  <X size={13} /> Hide older records
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-auto bg-slate-50/40">
            {isBulk ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Layers size={28} className="text-indigo-400" />
                </div>
                <div className="text-center max-w-sm">
                  <h3 className="font-bold text-slate-800 text-base mb-1.5">
                    Bulk Assignment Mode
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    You've selected{" "}
                    <span className="font-bold text-indigo-600">
                      {selectedStudents.length} students
                    </span>
                    . Click{" "}
                    <span className="font-semibold text-slate-700">
                      "Set Bulk Fee"
                    </span>{" "}
                    above to apply a fee structure to all of them at once.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    {["Fee Category", "Total Amount", "Details", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "" ? "w-24 text-right" : ""}`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {loadingFees ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <Loader2
                          size={24}
                          className="animate-spin text-indigo-400 mx-auto"
                        />
                      </td>
                    </tr>
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <TabIcon size={22} className="text-slate-300" />
                          </div>
                          <p className="font-semibold text-slate-500">
                            No {tabMeta?.label} fee set
                          </p>
                          <p className="text-xs">
                            Click "Set Fee" to add a structure for this category
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableData.map((fee) => {
                      const secItem = fee.feeItems?.find(
                        (i) =>
                          i.headName?.toLowerCase().includes("security") ||
                          i.headId?.name?.toLowerCase().includes("security"),
                      );
                      const secAmt = secItem
                        ? secItem.amount
                        : fee.securityDeposit || 0;

                      const regItem = fee.feeItems?.find(
                        (i) =>
                          i.headName?.toLowerCase().includes("registration") ||
                          i.headId?.name
                            ?.toLowerCase()
                            .includes("registration"),
                      );
                      const regAmt = regItem
                        ? regItem.amount
                        : fee.registrationFee || 0;

                      // Only relevant on semester-scoped tabs (Tuition/Exam)
                      // when "show older records" has surfaced past
                      // semesters alongside the current one — those are
                      // locked, since editing a past semester's fee after
                      // the fact would silently rewrite history.
                      const feeSemId = String(
                        fee.semesterId?._id || fee.semesterId || "",
                      );
                      const isPastSemester =
                        isSemesterScopedTab &&
                        currentSemesterId &&
                        feeSemId &&
                        feeSemId !== currentSemesterId;

                      return (
                        <tr
                          key={fee._id}
                          className={`transition-colors group ${isPastSemester ? "bg-slate-50/50" : "hover:bg-slate-50/80"}`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-bold text-sm ${isPastSemester ? "text-slate-500" : "text-slate-800"}`}
                              >
                                {fee.title || fee.name || fee.category}
                              </p>
                              {fee.semesterId?.number && (
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Sem {fee.semesterId.number}
                                </span>
                              )}
                              {isPastSemester && (
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                  Past · Read-only
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {fee.termId?.name || "—"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-mono font-black text-indigo-600 text-base">
                                {formatCurrency(fee.totalAmount || fee.amount)}
                              </span>
                              {(activeTab === 1 || activeTab === 2) && regAmt > 0 && (
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  + Reg: {formatCurrency(regAmt)}
                                </span>
                              )}
                              {(activeTab === 1 || activeTab === 2) && secAmt > 0 && (
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                  + Sec: {formatCurrency(secAmt)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {fee.feeItems?.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg"
                                >
                                  <span>
                                    {item.headId?.name ||
                                      item.headName ||
                                      "Fee"}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="font-bold text-slate-700">
                                    {item.percentageValue > 0
                                      ? `${item.percentageValue}%`
                                      : formatCurrency(item.amount)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isPastSemester ? (
                              <div
                                className="flex justify-end"
                                title="Past section — locked from editing"
                              >
                                <Lock size={14} className="text-slate-300" />
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(fee)}
                                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(fee._id)}
                                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <StudentFeeModal
        isOpen={modalState.isOpen && modalState.name === "studentFeeModal"}
        onClose={closeModal}
        activeTab={activeTab}
        {...rest}
      />
    </div>
  );
};

// ─── PAGE 1 ───────────────────────────────────────────────────────────────────
const MainPage = (props) => {
  const {
    studentSearch,
    setStudentSearch,
    studentsList,
    loadMoreStudents,
    loadingStudents,
    selectedStudents,
    toggleStudentSelect,
    selectAll,
    termOptions,
    selectedTerm,
    setSelectedTerm,
    deptOptions,
    progOptions,
    semOptions,
    selectedDept,
    handleDeptChange,
    selectedProg,
    handleProgChange,
    selectedSem,
    setSelectedSem,
    proceedToGenerator,

    // Global Misc Props
    showMiscModal,
    setShowMiscModal,
    globalMiscFees,
    createGlobalMisc,
    deleteGlobalMisc,
  } = props;

  const allVisibleSelected =
    studentsList.length > 0 &&
    studentsList.every((s) =>
      selectedStudents.some((sel) => sel._id === s._id),
    );

  const sentinelRef = useRef(null);
  const loaderCb = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && !loadingStudents) loadMoreStudents();
    },
    [loadingStudents, loadMoreStudents],
  );
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCb, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCb]);

  const hasActiveFilter =
    selectedTerm || selectedDept || selectedProg || selectedSem;

  return (
    <div
      className="flex h-[calc(100vh-100px)] bg-slate-50 gap-0"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div className="w-[270px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <SlidersHorizontal size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Filters</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Narrow student directory
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Academic Session <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all cursor-pointer"
            >
              <option value="">Select session…</option>
              {termOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {[
            {
              label: "Class",
              val: selectedDept,
              onChange: handleDeptChange,
              opts: deptOptions,
              placeholder: "All Classes",
            },
            {
              label: "Program",
              val: selectedProg,
              onChange: handleProgChange,
              opts: progOptions,
              placeholder: "All Programs",
              disabled: !selectedDept,
            },
            {
              label: "Section",
              val: selectedSem,
              onChange: (v) => setSelectedSem(v),
              opts: semOptions,
              placeholder: "All Sections",
              disabled: !selectedProg,
            },
          ].map(({ label, val, onChange, opts, placeholder, disabled }) => (
            <div key={label}>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <select
                disabled={disabled}
                value={val}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
              >
                <option value="">{placeholder}</option>
                {opts.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {hasActiveFilter && (
          <div className="px-5 pb-5">
            <button
              onClick={() => {
                handleDeptChange("");
                handleProgChange("");
                setSelectedSem("");
                setSelectedTerm("");
              }}
              className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <X size={12} /> Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="relative w-80">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all font-medium placeholder:text-slate-400"
              placeholder="Search by name or ID…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            {studentSearch && (
              <button
                onClick={() => setStudentSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100 text-sm font-semibold text-indigo-700">
                <Check size={14} /> {selectedStudents.length} selected
              </div>
            )}

            {/* 🌟 NEW GLOBAL MISC FEES BUTTON 🌟 */}
            <button
              onClick={() => setShowMiscModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <Globe size={16} /> Global Misc Fees
            </button>

            <button
              onClick={proceedToGenerator}
              disabled={selectedStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-md shadow-indigo-100 ml-2"
            >
              <Settings size={15} /> Student Fee Setup{" "}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-12">
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={
                      selectedStudents.length > 0 && !allVisibleSelected
                    }
                    onChange={selectAll}
                  />
                </th>
                {[
                  "Reg ID",
                  "Student",
                  "Father Name",
                  "CNIC",
                  "Phone",
                  "Program",
                  "Semester",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {studentsList.length === 0 && !loadingStudents ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Users size={24} className="text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-500">
                        No students found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                studentsList.map((student) => {
                  const isSelected = selectedStudents.some(
                    (s) => s._id === student._id,
                  );
                  const name = student.personalInfo?.fullName || "N/A";
                  const fatherName =
                    student.personalInfo?.fatherName ||
                    student.familyInfo?.fatherName ||
                    "—";
                  const program = student.programId?.name || "—";
                  const sem = student.semesterId?.number;

                  return (
                    <tr
                      key={student._id}
                      onClick={() => toggleStudentSelect(student)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/60 hover:bg-indigo-50" : "hover:bg-slate-50/80"}`}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => toggleStudentSelect(student)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {student.studentId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={name} size="sm" />
                          <span className="font-semibold text-slate-800 whitespace-nowrap">
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {fatherName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-500">
                          {student.personalInfo?.cnic || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-500">
                          {student.personalInfo?.phone || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-slate-600 text-xs">
                          {program}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sem ? (
                          <Badge variant="info">Sem {sem}</Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div ref={sentinelRef} className="h-1" />

          {loadingStudents && (
            <div className="py-6 flex justify-center bg-white">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
                <span>Loading more students…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <GlobalMiscModal
        isOpen={showMiscModal}
        onClose={() => setShowMiscModal(false)}
        miscFees={globalMiscFees}
        onCreate={createGlobalMisc}
        onDelete={deleteGlobalMisc}
      />
    </div>
  );
};

const StudentFeeManagementView = (props) => {
  if (props.showGeneratorPage) return <FeeSetupPage {...props} />;
  return <MainPage {...props} />;
};

export default StudentFeeManagementView;
