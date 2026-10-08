import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Award,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Tag,
} from "lucide-react";
import ChallanTable from "./ChallanTable";
import { buildChallanPage, openPrintWindow } from "../../common/ChallanPrintTemplate";
import {
  GenerateModal,
  InstallmentModal,
  EditDateModal,
  DiscountModal,
  DetailModal,
} from "./ChallanModals";

const StudentDetailView = ({ data }) => {
  // Hooks must run unconditionally on every render (this component was
  // previously early-returning before any hooks were declared, which only
  // "worked" because it happens to always fully remount rather than toggle
  // in place) — declare everything up front, with safe fallbacks, and do
  // the actual early return afterward.
  const {
    selectedStudent,
    studentChallans,
    actions,
    clearStudent,
    isProcessing,
    activeScholarship,
    terms,
    semesters,
    filters,
    miscFeesList,
    studentFees,
    currentSemesterId,
    hasTuitionFeeSetup,
    hasInstallmentPlanSetup,
    currentInstallmentPref,
  } = data || {};

  const [showGenModal, setShowGenModal] = useState(false);
  const [instData, setInstData] = useState(null);
  const [editDateData, setEditDateData] = useState(null);
  const [discountData, setDiscountData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [showPreviousSemesters, setShowPreviousSemesters] = useState(false);

  const previousSemesterGroups = React.useMemo(() => {
    const groups = new Map();
    (studentChallans || []).forEach((c) => {
      const cSemId = String(c.semesterId?._id || c.semesterId || "");
      if (currentSemesterId && cSemId === currentSemesterId) return;
      const key = cSemId || "unknown";
      if (!groups.has(key)) {
        groups.set(key, {
          number: c.semesterId?.number ?? null,
          name: c.semesterId?.name || "",
          className: c.departmentId?.name || "",
          challans: [],
        });
      }
      groups.get(key).challans.push(c);
    });
    return [...groups.values()].sort(
      (a, b) => (b.number || 0) - (a.number || 0),
    );
  }, [studentChallans, currentSemesterId]);

  if (!data || !data.selectedStudent) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading Student Data...
      </div>
    );
  }

  const currentSessionName = terms?.find((t) => t._id === filters.termId)?.name;

  const handlePrintChallan = (challanId) => {
    const challanData = studentChallans.find((c) => c._id === challanId);
    if (!challanData) return;

    // Same printed challan as everywhere else in Accounts. The list rows are not
    // always fully populated, so fall back to the selected student.
    const challan = {
      ...challanData,
      studentId: challanData.studentId?.personalInfo ? challanData.studentId : selectedStudent,
      departmentId: challanData.departmentId || selectedStudent?.departmentId,
      semesterId: challanData.semesterId || selectedStudent?.semesterId || selectedStudent?.semester,
      termId: challanData.termId || selectedStudent?.termId || selectedStudent?.term,
    };
    openPrintWindow(buildChallanPage(challan), `Fee Challan - ${challan.challanNo}`);
  };

  const handleTableActions = {
    onPay: (id) => {
      if (actions.onPay) actions.onPay(id);
      else if (actions.confirmPay) actions.confirmPay(id);
    },
    onDelete: (id) => {
      if (actions.onDelete) actions.onDelete(id);
      else if (actions.confirmDelete) actions.confirmDelete(id);
    },
    onPrint: (id) => handlePrintChallan(id),
    onInstallment: (id) => {
      const c = studentChallans.find((x) => x._id === id);
      if (c) setInstData({ id: c._id, total: c.netAmount });
    },
    onEditDate: (id) => {
      const c = studentChallans.find((x) => x._id === id);
      if (c) setEditDateData({ id: c._id, date: c.dueDate });
    },
    onDiscount: (id) => {
      const c = studentChallans.find((x) => x._id === id);
      if (c) setDiscountData(c);
    },
    onViewDetail: (challan) => setDetailData(challan),
    onRenew: (id, dueDate) => actions.onRenew && actions.onRenew(id, dueDate),
  };

  // Group challans by semester — the student's CURRENT semester is shown
  // as the primary table; every other semester is grouped underneath and
  // collapsed by default, matching the pattern used in Student Fee
  // Management / Installment Configuration for past-semester records.
  // Payment/void/etc. actions stay available on ALL of them (a student can
  // legitimately pay off an old due at any time) — this is purely a display
  // grouping, not an edit lock.
  const currentSemesterChallans = (studentChallans || []).filter((c) => {
    const cSemId = String(c.semesterId?._id || c.semesterId || "");
    return !currentSemesterId || cSemId === currentSemesterId;
  });

  // "Previous unpaid dues" now covers ANY of the student's own unpaid
  // challans — same semester (e.g. an earlier unpaid installment in this
  // exact semester) or a genuinely older one — matching the backend's own
  // mergeBase/carryFine eligibility exactly (any semester, any type),
  // itemized per source instead of one lump sum.
  const previousDuesItems = React.useMemo(
    () =>
      (studentChallans || [])
        .filter(
          (c) =>
            ["issued", "overdue", "partial"].includes(c.status) &&
            (c.remainingAmount || 0) > 0,
        )
        .map((c) => ({
          challanId: c._id,
          label: c.isInstallment
            ? `Installment ${c.installmentNumber} Fee${
                c.semesterId?.number ? ` (Section ${c.semesterId.number})` : ""
              }`
            : `${(c.challanType || "Fee").replace(/_/g, " ")}${
                c.semesterId?.number ? ` (Section ${c.semesterId.number})` : ""
              }`,
          baseAmount: Math.max(0, (c.remainingAmount || 0) - (c.fineAmount || 0)),
          fineAmount: c.fineAmount || 0,
        })),
    [studentChallans],
  );
  const previousDuesAmount = previousDuesItems.reduce(
    (s, i) => s + i.baseAmount + i.fineAmount,
    0,
  );

  return (
    <div className="animate-in slide-in-from-right duration-300">
      <button
        onClick={clearStudent}
        className="mb-4 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800"
      >
        <ArrowLeft size={18} /> Back
      </button>

      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {selectedStudent.personalInfo?.fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
            <span>ID: {selectedStudent.studentId}</span>
            <span>•</span>
            {(selectedStudent.departmentId?.name || selectedStudent.department?.name) && (
              <>
                <span>
                  Class: {selectedStudent.departmentId?.name || selectedStudent.department?.name}
                </span>
                <span>•</span>
              </>
            )}
            <span>
              Program: {selectedStudent.programId?.name || selectedStudent.program?.name || "—"}
            </span>
            {(selectedStudent.semesterId?.name || selectedStudent.semesterId?.number) && (
              <>
                <span>•</span>
                <span>
                  Section: {selectedStudent.semesterId.name || selectedStudent.semesterId.number}
                </span>
              </>
            )}
            {(selectedStudent.termId?.name || selectedStudent.term?.name) && (
              <>
                <span>•</span>
                <span>Session: {selectedStudent.termId?.name || selectedStudent.term?.name}</span>
              </>
            )}
          </div>

          {/* Fee/Installment setup status for the student's CURRENT semester */}
          <div className="flex flex-wrap gap-2 mt-3">
            {hasTuitionFeeSetup ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded border border-emerald-100">
                <CheckCircle2 size={13} /> Fee Setup Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded border border-amber-100">
                <AlertTriangle size={13} /> Fee Not Set Up
              </span>
            )}
            {hasInstallmentPlanSetup ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded border border-emerald-100">
                <CheckCircle2 size={13} />
                Installment Plan Done
                {currentInstallmentPref?.defaultInstallments > 1 &&
                  ` (${currentInstallmentPref.defaultInstallments} parts)`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded border border-amber-100">
                <AlertTriangle size={13} /> Installment Plan Not Set Up
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {activeScholarship?.hasScholarship && (
            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100 flex items-center gap-2">
              <Award size={14} /> {activeScholarship.plan?.title || "Scholarship Active"}
            </div>
          )}
          <button
            onClick={() => setShowGenModal(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus size={18} /> Generate
          </button>
        </div>
      </div>

      {/* Scholarship — plan detail + how it adjusts this semester's tuition */}
      {activeScholarship?.hasScholarship && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-emerald-600" />
            <h3 className="font-bold text-emerald-900">Scholarship Assigned</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                <Tag size={12} /> Plan
              </p>
              <p className="text-sm font-bold text-emerald-950 mt-0.5">
                {activeScholarship.plan?.title}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                <Percent size={12} /> Rate
              </p>
              <p className="text-sm font-bold text-emerald-950 mt-0.5">
                {activeScholarship.plan?.type === "fixed"
                  ? `Rs. ${(activeScholarship.plan?.maxAmount || 0).toLocaleString()} flat`
                  : `${activeScholarship.plan?.maxPercentage || 0}% of tuition`}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                Section Tuition
              </p>
              <p className="text-sm font-bold text-emerald-950 mt-0.5">
                Rs. {(activeScholarship.tuitionPortion || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                Net Payable Tuition
              </p>
              <p className="text-sm font-black text-emerald-950 mt-0.5">
                Rs. {(activeScholarship.netTuition || 0).toLocaleString()}
                <span className="text-xs font-bold text-emerald-600 ml-1.5">
                  (−Rs. {(activeScholarship.scholarshipAmount || 0).toLocaleString()})
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <ChallanTable
        challans={currentSemesterChallans}
        actions={handleTableActions}
        onRowClick={handleTableActions.onViewDetail}
      />

      {previousSemesterGroups.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowPreviousSemesters((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            {showPreviousSemesters ? "Hide" : "Show"} previous classes / sections (
            {previousSemesterGroups.reduce((s, g) => s + g.challans.length, 0)}{" "}
            challans)
          </button>
          {showPreviousSemesters && (
            <div className="mt-3 space-y-4">
              {previousSemesterGroups.map((g, idx) => (
                <div key={idx}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                    {g.className ? `${g.className} · ` : ""}
                    {g.name || (g.number ? `Section ${g.number}` : "—")}
                  </p>
                  <ChallanTable
                    challans={g.challans}
                    actions={handleTableActions}
                    onRowClick={handleTableActions.onViewDetail}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      <GenerateModal
        isOpen={showGenModal}
        onClose={() => setShowGenModal(false)}
        student={selectedStudent}
        miscFeesList={miscFeesList}
        studentFees={studentFees} // ✅ PASSED DOWN
        isLoading={isProcessing}
        previousDuesAmount={previousDuesAmount}
        previousDuesItems={previousDuesItems}
        currentInstallmentPref={currentInstallmentPref}
        currentSemesterChallans={currentSemesterChallans}
        onGenerate={async (form) => {
          const response = await actions.generateSingle(form);
          if (response && response.isBlocked) return response;
          if (response === true) setShowGenModal(false);
        }}
      />

      <InstallmentModal
        isOpen={!!instData}
        onClose={() => setInstData(null)}
        totalAmount={instData?.total}
        isLoading={isProcessing}
        onConvert={(rows) =>
          actions
            .createInstallments(instData.id, rows)
            .then((ok) => ok && setInstData(null))
        }
      />

      <EditDateModal
        isOpen={!!editDateData}
        onClose={() => setEditDateData(null)}
        currentDueDate={editDateData?.date}
        isLoading={isProcessing}
        onUpdate={(newDate) =>
          actions
            .updateDueDate(editDateData.id, newDate)
            .then((ok) => ok && setEditDateData(null))
        }
      />

      <DiscountModal
        isOpen={!!discountData}
        onClose={() => setDiscountData(null)}
        challanData={discountData}
        isLoading={isProcessing}
        onApply={(formData) =>
          actions
            .applyDiscount(discountData._id, formData)
            .then((ok) => ok && setDiscountData(null))
        }
        onRemove={(id) =>
          actions.removeDiscount(id).then((ok) => ok && setDiscountData(null))
        }
      />

      <DetailModal
        isOpen={!!detailData}
        onClose={() => setDetailData(null)}
        data={detailData}
        student={selectedStudent}
      />
    </div>
  );
};

// ==========================================
// PRINT GENERATION HELPERS
// ==========================================
const formatCurrency = (amount) =>
  amount ? amount.toLocaleString("en-PK") : "0";

export default StudentDetailView;
