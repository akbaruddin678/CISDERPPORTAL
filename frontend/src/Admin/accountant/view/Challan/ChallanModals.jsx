import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Calendar,
  User,
  FileText,
  Receipt,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ==========================================
// 0. BASE MODAL OVERLAY
// ==========================================
const ModalOverlay = ({ title, onClose, children, size = "max-w-md" }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
    <div
      className={`bg-white w-full ${size} rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={20} />
      </button>
      <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
        {title}
      </h3>
      {children}
    </div>
  </div>
);

// ==========================================
// 1. MARK PAID MODAL (WITH IMAGE UPLOAD & REMARKS)
// ==========================================
export const MarkPaidModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [paymentDate, setPaymentDate] = useState("");
  const [remark, setRemark] = useState("");
  const [file, setFile] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setRemark("");
      setFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay title="Confirm Payment" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();

          if (!remark.trim() || !file) {
            alert("Payment remark and proof image are strictly required.");
            return;
          }

          const formData = new FormData();
          if (paymentDate) formData.append("paymentDate", paymentDate);
          if (remark) formData.append("paymentRemark", remark);
          if (file) formData.append("paymentProof", file);

          onConfirm(formData);
        }}
        className="space-y-5"
      >
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 font-medium">
          Marking this challan as paid will settle all dues. <br />
          <strong>Note:</strong> A payment receipt and remark are mandatory.
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Payment Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-700"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Payment Remark <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows="2"
            placeholder="e.g. Paid via Bank Transfer, Transaction ID: 12345"
            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-sm text-slate-700"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Payment Proof Image <span className="text-rose-500">*</span>
          </label>
          <input
            type="file"
            required
            accept="image/*,application/pdf"
            className="w-full border border-slate-200 p-2.5 rounded-xl outline-none bg-white text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Processing
              Payment...
            </>
          ) : (
            "Confirm & Save Payment"
          )}
        </button>
      </form>
    </ModalOverlay>
  );
};

// ==========================================
// 2. GENERATE MODAL
// ==========================================
export const GenerateModal = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
  student,
  miscFeesList = [],
  studentFees = [],
  previousDuesAmount = 0,
  previousDuesItems = [],
  currentInstallmentPref = null,
  currentSemesterChallans = [],
}) => {
  const [dueDate, setDueDate] = useState("");
  const [feeTypes, setFeeTypes] = useState({
    tuition: true,
    admission: false,
    readmission: false,
    exam: false,
    general: false,
  });

  const [targetInstallment, setTargetInstallment] = useState("auto");
  // Per-item choice, keyed by challanId — { includeBase, includeFine,
  // delete } — three fully independent toggles, not exclusive with each
  // other: e.g. an item can have its base AND fine rolled into the new
  // challan AND still be ticked for deletion afterward (settle it into the
  // new challan, then remove the now-empty old record); or just delete it
  // outright with nothing carried over; or carry something over and leave
  // the old challan as-is. "Delete" only actually happens once "Generate"/
  // "Create Offering" is clicked below (bundled into the same submit, not
  // fired immediately) — see the strict-lock note near the submit handler.
  const [duesSelections, setDuesSelections] = useState({});
  const toggleDuesSelection = (challanId, field) =>
    setDuesSelections((prev) => ({
      ...prev,
      [challanId]: {
        ...prev[challanId],
        [field]: !prev[challanId]?.[field],
      },
    }));
  const [allowMultipleTuition, setAllowMultipleTuition] = useState(false);
  // Only used as a fallback when the student has CISDTHER a real
  // installment plan NOR a saved whole-fee Billing Month — in every other
  // case the month is locked to whatever was actually configured, never
  // freely picked, so a challan can't be generated for a different month
  // than what was set up for this student.
  const [manualBillingMonth, setManualBillingMonth] = useState("");

  const [selectedMiscFees, setSelectedMiscFees] = useState([]);
  const [showMiscDropdown, setShowMiscDropdown] = useState(false);

  const [selectedExamTitles, setSelectedExamTitles] = useState([]);
  const examFeesList = (studentFees || []).filter((f) => f.category === "EXAM");

  const studentName = student?.personalInfo?.fullName || "Unknown Student";

  // The student's CURRENT semester's real installment plan (fetched fresh
  // by the controller, scoped to their actual current semester) — not the
  // list row's ambiguous feePreference, which could reflect any semester.
  const totalInst = currentInstallmentPref?.defaultInstallments || 0;
  const isInstStudent = totalInst > 1;

  useEffect(() => {
    if (!isOpen) {
      setFeeTypes({
        tuition: true, admission: false, readmission: false, exam: false, general: false,
      });
      setSelectedMiscFees([]);
      setSelectedExamTitles([]);
      setDueDate("");
      setTargetInstallment("auto");
      setDuesSelections({});
      setAllowMultipleTuition(false);
      setManualBillingMonth("");
    }
  }, [isOpen]);

  const handleTypeChange = (type) => {
    setFeeTypes((prev) => {
      const newState = { ...prev, [type]: !prev[type] };
      if (type === "admission" && newState.admission) newState.readmission = false;
      if (type === "readmission" && newState.readmission) newState.admission = false;
      if (type === "exam" && !newState.exam) setSelectedExamTitles([]);
      if (type === "general") {
        if (newState.general) setShowMiscDropdown(true);
        else { setShowMiscDropdown(false); setSelectedMiscFees([]); }
      }
      return newState;
    });
  };

  const toggleMiscFee = (id) =>
    setSelectedMiscFees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleExamTitle = (title) => {
    setSelectedExamTitles((prev) => prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]);
  };

  const showArrearsSection = previousDuesAmount > 0;

  // Each installment has ONE fixed configured month (set during plan setup)
  // — the month is not an independent choice, it's determined entirely by
  // which installment (auto-next or manually picked) is being generated.
  // Deriving it this way, instead of letting the user pick any month
  // freely, is what prevents "Installment #1 is scheduled for X, not Y"
  // errors: the UI can no longer request a month that doesn't match.
  const configuredMonths = (currentInstallmentPref?.customMonths || []).filter(Boolean);

  const existingInstallmentChallans = (currentSemesterChallans || []).filter(
    (c) => c.isInstallment && c.status !== "cancelled",
  );
  const maxGeneratedInstallment = existingInstallmentChallans.reduce(
    (max, c) => Math.max(max, c.installmentNumber || 0),
    0,
  );
  const nextAutoInstallment = maxGeneratedInstallment + 1;

  const effectiveInstallmentNumber =
    targetInstallment === "auto" ? nextAutoInstallment : Number(targetInstallment);

  // A non-installment (whole-fee) student can still have a saved Billing
  // Month (configured the same way, just a single entry) — locked exactly
  // like a real installment's month, so a challan can't be generated for a
  // different month than what was actually configured. Only when NOTHING
  // is configured at all does the month become a free, optional choice.
  // Billing Month is a TUITION-only concept — Admission/Readmission/Exam/
  // Misc fee setups have no month at all, so this must also check that
  // "tuition" is actually one of the selected fee types for THIS
  // generation, not just that the student happens to have a tuition plan
  // configured somewhere. Otherwise generating an Exam-only or
  // Admission-only challan for a student who also has a tuition
  // installment plan would wrongly show/require a Billing Month.
  const hasConfiguredSingleMonth = !isInstStudent && Boolean(configuredMonths[0]);
  const monthApplicable =
    feeTypes.tuition && (isInstStudent || hasConfiguredSingleMonth);

  const derivedBillingMonth = isInstStudent
    ? configuredMonths[effectiveInstallmentNumber - 1] || ""
    : configuredMonths[0] || "";

  const isTargetInstallmentPaid = existingInstallmentChallans.some(
    (c) =>
      c.installmentNumber === effectiveInstallmentNumber && c.status === "paid",
  );

  if (!isOpen) return null;

  return (
    <ModalOverlay title="Generate Challan" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const selectedTypes = Object.keys(feeTypes).filter((k) => feeTypes[k]);
          if (selectedTypes.length === 0) return alert("Select at least one fee type");
          if (monthApplicable && !derivedBillingMonth)
            return alert(
              "This installment plan has no configured month for the selected installment — check the plan setup.",
            );
          if (monthApplicable && isTargetInstallmentPaid)
            return alert(
              `Installment #${effectiveInstallmentNumber} (${derivedBillingMonth}) is already paid — choose a different installment.`,
            );

          // Independent per item: base/fine can be rolled forward, deleted,
          // both, or neither — not mutually exclusive with each other.
          const previousDuesSelections = Object.entries(duesSelections)
            .filter(([, v]) => v?.includeBase || v?.includeFine)
            .map(([challanId, v]) => ({
              challanId,
              includeBase: !!v.includeBase,
              includeFine: !!v.includeFine,
            }));
          const deleteChallanIds = Object.entries(duesSelections)
            .filter(([, v]) => v?.delete)
            .map(([challanId]) => challanId);

          if (
            deleteChallanIds.length > 0 &&
            !window.confirm(
              `This will also permanently delete ${deleteChallanIds.length} previous unpaid challan(s) once the new challan is generated. Continue?`,
            )
          )
            return;

          onGenerate({
            dueDate,
            // Never send a billingMonth for a generation that doesn't
            // include tuition at all — even a stale manualBillingMonth
            // picked earlier (before tuition was unchecked) must not leak
            // into an Exam/Admission/Misc-only challan.
            billingMonth: !feeTypes.tuition
              ? null
              : monthApplicable
                ? derivedBillingMonth
                : manualBillingMonth || null,
            feeTypes: selectedTypes,
            miscFeeIds: selectedMiscFees,
            examTitles: selectedExamTitles,
            targetInstallmentNumber: targetInstallment === "auto" ? null : Number(targetInstallment),
            previousDuesSelections,
            deleteChallanIds,
            allowMultipleTuition,
          });
        }}
        className="space-y-5"
      >
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-sm text-indigo-900 flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">i</div>
          <span>Generating for: <strong>{studentName}</strong></span>
        </div>

        {/* ✅ SIDE BY SIDE DATE & MONTH */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-slate-700"
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Billing Month
            </label>
            {monthApplicable ? (
              <div
                className={`w-full p-2.5 border rounded-lg text-sm font-bold flex items-center justify-between ${
                  isTargetInstallmentPaid
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-indigo-50 border-indigo-200 text-indigo-800"
                }`}
              >
                <span>{derivedBillingMonth || "Not configured"}</span>
                {isTargetInstallmentPaid && (
                  <span className="text-[10px] font-bold uppercase">Already Paid</span>
                )}
              </div>
            ) : feeTypes.tuition ? (
              // Tuition is selected but this student has nothing configured
              // at all yet (no installment plan, no saved whole-fee month)
              // — the only case where the month is freely chosen rather
              // than locked to a real configured value.
              <select
                value={manualBillingMonth}
                onChange={(e) => setManualBillingMonth(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer text-slate-700 text-sm font-medium"
              >
                <option value="">Not applicable / not scheduled</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              // Tuition isn't one of the selected fee types — Admission,
              // Readmission, Exam, and Misc fee setups have no month
              // concept at all, so no picker is shown for them.
              <div className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-50">
                Not applicable
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
            Include Fees
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["tuition", "exam", "admission", "readmission"].map((t) => (
              <label
                key={t}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${feeTypes[t] ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500" : "hover:bg-slate-50 border-slate-200"} ${(t === "admission" && feeTypes.readmission) || (t === "readmission" && feeTypes.admission) ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={feeTypes[t]}
                  onChange={() => handleTypeChange(t)}
                  disabled={(t === "admission" && feeTypes.readmission) || (t === "readmission" && feeTypes.admission)}
                />
                <span className="text-sm font-bold text-slate-600 capitalize">{t}</span>
              </label>
            ))}

            <label
              className={`col-span-2 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-[11px] transition-all ${feeTypes.general ? "bg-slate-800 border-slate-900 text-white font-bold" : "bg-white hover:bg-slate-50 text-slate-600"}`}
            >
              <div className="flex items-center gap-2">
                <input type="checkbox" className="accent-indigo-400 w-3.5 h-3.5" checked={feeTypes.general} onChange={() => handleTypeChange("general")} />
                <span>General / Misc Fees</span>
              </div>
              {feeTypes.general && (showMiscDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </label>
          </div>

          {feeTypes.exam && (
            <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Select Specific Exam Fees</div>
              <div className="space-y-1 max-h-32 overflow-y-auto sr-scroll">
                {examFeesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No Exam fees defined for this student.</p>
                ) : (
                  examFeesList.map((f) => {
                    const title = f.title || f.name || "Exam Fee";
                    return (
                      <label key={f._id} className="flex items-center gap-2 text-xs p-2 rounded cursor-pointer border hover:bg-white transition-colors">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={selectedExamTitles.includes(title)} onChange={() => toggleExamTitle(title)} />
                        <div className="flex justify-between w-full">
                          <span className="text-slate-700 font-medium">{title}</span>
                          <span className="font-mono text-slate-500 text-[10px] bg-slate-100 px-1.5 rounded">Rs {f.totalAmount}</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {feeTypes.general && (
            <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setShowMiscDropdown(!showMiscDropdown)}>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select Specific Fees</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 rounded-full font-bold">{selectedMiscFees.length}</span>
              </div>
              <div className={`space-y-1 overflow-y-auto transition-all duration-300 ${showMiscDropdown ? "max-h-40" : "max-h-0 overflow-hidden"}`}>
                {!miscFeesList || miscFeesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">No miscellaneous fees defined.</p>
                ) : (
                  miscFeesList.map((fee) => (
                    <label key={fee._id} className={`flex items-center gap-2 text-xs p-2 rounded cursor-pointer border transition-colors ${selectedMiscFees.includes(fee._id) ? "bg-white border-indigo-200 shadow-sm" : "border-transparent hover:bg-white"}`}>
                      <input type="checkbox" checked={selectedMiscFees.includes(fee._id)} onChange={() => toggleMiscFee(fee._id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <div className="flex justify-between w-full">
                        <span className="text-slate-700 truncate font-medium">{fee.title || fee.name || "Misc Fee"}</span>
                        <span className="font-mono text-slate-500 text-[10px] bg-slate-100 px-1.5 rounded ml-2">{fee.amount}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {isInstStudent && feeTypes.tuition && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
            <label className="block text-xs font-bold text-purple-700 uppercase mb-1.5 ml-1">
              Select Specific Installment ({totalInst} Parts Configured)
            </label>
            <select
              value={targetInstallment}
              onChange={(e) => setTargetInstallment(e.target.value)}
              className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none text-purple-900 font-bold mb-3 cursor-pointer"
            >
              <option value="auto">
                Auto (Generate Next Sequence — #{nextAutoInstallment})
              </option>
              {Array.from({ length: totalInst }).map((_, i) => {
                const num = i + 1;
                const month = configuredMonths[i];
                const isPaid = existingInstallmentChallans.some(
                  (c) => c.installmentNumber === num && c.status === "paid",
                );
                return (
                  <option key={num} value={num} disabled={isPaid}>
                    Installment {num}
                    {month ? ` (${month})` : ""}
                    {isPaid ? " — Paid" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {showArrearsSection && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <h4 className="text-amber-800 font-bold text-xs uppercase flex items-center gap-1.5 mb-3">
              <span className="text-lg">⚠️</span> Previous Unpaid Dues (Rs{" "}
              {previousDuesAmount.toLocaleString()})
            </h4>
            <p className="text-[9px] text-amber-700 font-medium mb-2.5">
              Pick Base and/or Fine per item to roll into this challan as
              clearly-labelled line items — or delete an old challan outright
              instead of carrying it forward.
            </p>

            <ul className="space-y-1.5">
              {previousDuesItems.map((item) => (
                <li
                  key={item.challanId}
                  className="bg-white p-2.5 rounded border border-amber-200"
                >
                  <div className="flex justify-between items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-amber-900">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-800">
                      Rs {(item.baseAmount + item.fineAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-4">
                    {item.baseAmount > 0 && (
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-amber-800">
                        <input
                          type="checkbox"
                          checked={!!duesSelections[item.challanId]?.includeBase}
                          onChange={() =>
                            toggleDuesSelection(item.challanId, "includeBase")
                          }
                          className="w-3.5 h-3.5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        Include Base (Rs {item.baseAmount.toLocaleString()})
                      </label>
                    )}
                    {item.fineAmount > 0 && (
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-amber-800">
                        <input
                          type="checkbox"
                          checked={!!duesSelections[item.challanId]?.includeFine}
                          onChange={() =>
                            toggleDuesSelection(item.challanId, "includeFine")
                          }
                          className="w-3.5 h-3.5 text-amber-600 rounded focus:ring-amber-500"
                        />
                        Include Fine (Rs {item.fineAmount.toLocaleString()})
                      </label>
                    )}
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-rose-600">
                      <input
                        type="checkbox"
                        checked={!!duesSelections[item.challanId]?.delete}
                        onChange={() =>
                          toggleDuesSelection(item.challanId, "delete")
                        }
                        className="w-3.5 h-3.5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <Trash2 size={11} /> Delete This Challan
                    </label>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[9px] text-amber-700 font-medium mt-2">
              These are independent — tick any combination: carry the base
              and/or fine forward, delete the old challan outright, or both
              (roll it into this one, then remove the now-empty old record).
              Deletion only happens once you generate below.
            </p>
          </div>
        )}

        {feeTypes.tuition && (
          <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors mt-2">
            <span className="text-xs font-bold text-slate-600">Allow Multiple Tuition Challans in this Session</span>
            <input type="checkbox" checked={allowMultipleTuition} onChange={(e) => setAllowMultipleTuition(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
          </label>
        )}

        <button
          disabled={isLoading}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 mt-4 cursor-pointer"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Generate Challan"}
        </button>
      </form>
    </ModalOverlay>
  );
};



// ==========================================
// 3. DETAIL MODAL
// ==========================================
export const DetailModal = ({ isOpen, onClose, data, student }) => {
  if (!isOpen || !data) return null;

  const fmt = (v) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(v || 0);

  const feeObj =
    data.feeDetails && typeof data.feeDetails.toJSON === "function"
      ? data.feeDetails.toJSON()
      : data.feeDetails || {};

  const allFees = Object.entries(feeObj).filter(([key, val]) => val > 0);
  const currentFees = allFees.filter(
    ([key]) =>
      !key.toLowerCase().includes("arrears") &&
      !key.toLowerCase().includes("previous"),
  );
  const arrearsFees = allFees.filter(
    ([key]) =>
      key.toLowerCase().includes("arrears") ||
      key.toLowerCase().includes("previous"),
  );

  const showFallback = currentFees.length === 0 && arrearsFees.length === 0;

  const formatLabel = (key) => {
    let label = key;
    if (!key.includes(" ") && !key.includes(":")) {
      label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    }
    if (label.toLowerCase().includes("Final Exam Fee")) {
      return "Exam Fee";
    }
    return label;
  };

  return (
    <ModalOverlay title="Challan Breakdown" onClose={onClose} size="max-w-3xl">
      <div className="space-y-6">
        <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Ref Number
            </span>
            <div className="text-2xl font-mono font-bold text-indigo-900 mt-1">
              {data.challanNo}
            </div>
          </div>
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 ${data.status === "paid" ? "bg-emerald-100 text-emerald-800" : data.status === "cancelled" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${data.status === "paid" ? "bg-emerald-500" : data.status === "cancelled" ? "bg-rose-500" : "bg-amber-500"}`}
            ></span>
            {data.status}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-3">
              <User size={14} /> Student Profile
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>{" "}
                <span className="font-bold text-slate-800">
                  {student?.personalInfo?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reg ID:</span>{" "}
                <span className="font-mono text-slate-700">
                  {student?.studentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Program:</span>{" "}
                <span className="text-slate-700">{student?.program?.name}</span>
              </div>
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-3">
              <FileText size={14} /> Challan Info
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>{" "}
                <span className="font-bold text-rose-600">
                  {new Date(data.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Types:</span>{" "}
                <span className="capitalize text-slate-700">
                  {data.challanType.replace(/_/g, " + ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Section:</span>{" "}
                <span className="text-slate-700">
                  {student?.semester?.number || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Detailed Fee Breakdown
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-600 font-bold text-xs uppercase border-b border-slate-100">
              <tr>
                <th className="p-3 pl-4">Description</th>
                <th className="p-3 pr-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentFees.length > 0 && (
                <>
                  <tr className="bg-slate-50/50">
                    <td
                      colSpan="2"
                      className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      Current Session Fees
                    </td>
                  </tr>
                  {currentFees.map(([key, amount]) => (
                    <tr
                      key={key}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 pl-4 text-slate-700 font-medium">
                        {formatLabel(key)}
                      </td>
                      <td className="p-3 pr-4 text-right font-mono text-slate-600">
                        {fmt(amount)}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {arrearsFees.length > 0 && (
                <>
                  <tr className="bg-amber-50/50">
                    <td
                      colSpan="2"
                      className="px-4 py-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider border-t border-slate-100"
                    >
                      Previous Dues
                    </td>
                  </tr>
                  {arrearsFees.map(([key, amount]) => (
                    <tr
                      key={key}
                      className="hover:bg-amber-50 transition-colors bg-amber-50/10"
                    >
                      <td className="p-3 pl-4 text-amber-800 font-medium">
                        {formatLabel(key)}
                      </td>
                      <td className="p-3 pr-4 text-right font-mono text-amber-700">
                        {fmt(amount)}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {showFallback && data.originalTotal > 0 && (
                <tr>
                  <td className="p-3 pl-4 text-slate-700 font-medium">
                    Consolidated Fee
                  </td>
                  <td className="p-3 pr-4 text-right font-mono text-slate-600">
                    {fmt(data.originalTotal)}
                  </td>
                </tr>
              )}

              <tr className="bg-slate-100 border-t border-slate-200">
                <td className="p-3 pl-4 text-slate-800 font-bold text-xs uppercase">
                  Gross Total
                </td>
                <td className="p-3 pr-4 text-right text-slate-900 font-bold font-mono">
                  {fmt(
                    currentFees.reduce((a, b) => a + b[1], 0) +
                      arrearsFees.reduce((a, b) => a + b[1], 0),
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 space-y-2 text-sm">
          {data.scholarshipAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span className="font-medium flex items-center gap-2">
                <Receipt size={14} /> Scholarship Applied
              </span>
              <span className="font-bold">-{fmt(data.scholarshipAmount)}</span>
            </div>
          )}
          {data.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span className="font-medium flex items-center gap-2">
                <Receipt size={14} /> Discount ({data.discountReason})
              </span>
              <span className="font-bold">-{fmt(data.discountAmount)}</span>
            </div>
          )}
          {data.fineAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span className="font-medium">Late Fee Fine</span>
              <span className="font-bold">+{fmt(data.fineAmount)}</span>
            </div>
          )}

          <div className="border-t border-indigo-200 pt-3 mt-2 flex justify-between items-center">
            <span className="text-lg font-bold text-indigo-900">
              Net Payable Amount
            </span>
            <span className="text-3xl font-black text-indigo-900 tracking-tighter">
              {fmt(data.netAmount)}
            </span>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ==========================================
// 4. DISCOUNT MODAL
// ==========================================
export const DiscountModal = ({
  isOpen,
  onClose,
  onApply,
  onRemove,
  isLoading,
  challanData,
}) => {
  const [formData, setFormData] = useState({
    feeHead: "total",
    amount: "",
    reason: "",
  });
  const [maxLimit, setMaxLimit] = useState(0);
  const [feeOptions, setFeeOptions] = useState([]);
  const [currentDiscount, setCurrentDiscount] = useState(0);

  useEffect(() => {
    if (!challanData) return;

    const feeObj =
      challanData.feeDetails &&
      typeof challanData.feeDetails.toJSON === "function"
        ? challanData.feeDetails.toJSON()
        : challanData.feeDetails || {};

    setCurrentDiscount(challanData.discountAmount || 0);

    const dynamicOptions = [
      { value: "total", label: "Total Net Payable (Flat)" },
      ...Object.keys(feeObj)
        .filter((k) => feeObj[k] > 0)
        .map((key) => ({ value: key, label: key })),
    ];
    setFeeOptions(dynamicOptions);

    let limit = 0;
    if (formData.feeHead === "total") {
      limit = challanData.netAmount;
    } else {
      limit = feeObj[formData.feeHead] || 0;
    }
    setMaxLimit(limit);
  }, [formData.feeHead, challanData]);

  if (!isOpen) return null;

  return (
    <ModalOverlay title="Manage Discount" onClose={onClose}>
      {currentDiscount > 0 && (
        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 mb-4 flex justify-between items-center">
          <div>
            <span className="text-xs text-emerald-600 font-bold uppercase">
              Active Discount
            </span>
            <div className="text-emerald-900 font-mono font-bold text-lg">
              {currentDiscount.toLocaleString()} PKR
            </div>
            {challanData.discountReason && (
              <div
                className="text-xs text-emerald-700 mt-0.5 max-w-[200px] truncate"
                title={challanData.discountReason}
              >
                Reason: {challanData.discountReason}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (window.confirm("Remove ALL discounts?"))
                onRemove(challanData._id);
            }}
            className="p-2 bg-white text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
            title="Remove All Discounts"
            disabled={isLoading}
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply(formData);
        }}
        className="space-y-4"
      >
        <div className="bg-slate-50 p-3 rounded text-sm flex justify-between items-center">
          <span className="text-slate-500">Max Discountable:</span>
          <strong className="text-slate-700 font-mono">
            {maxLimit.toLocaleString()}
          </strong>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Source
          </label>
          <select
            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.feeHead}
            onChange={(e) =>
              setFormData({ ...formData, feeHead: e.target.value, amount: "" })
            }
          >
            {feeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Add Amount
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            max={maxLimit}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Reason
          </label>
          <input
            type="text"
            placeholder="e.g. Hardship"
            className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
          />
        </div>

        <button
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          disabled={
            isLoading ||
            Number(formData.amount) <= 0 ||
            Number(formData.amount) > maxLimit
          }
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Apply Discount"
          )}
        </button>
      </form>
    </ModalOverlay>
  );
};

// ==========================================
// 5. EDIT DATE MODAL
// ==========================================
export const EditDateModal = ({
  isOpen,
  onClose,
  currentDueDate,
  onUpdate,
  isLoading,
}) => {
  const [date, setDate] = useState(
    currentDueDate ? new Date(currentDueDate).toISOString().split("T")[0] : "",
  );
  if (!isOpen) return null;
  return (
    <ModalOverlay title="Update Due Date" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUpdate(date);
        }}
        className="space-y-4"
      >
        <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 border border-amber-100 flex gap-2">
          <Calendar size={16} /> <span>Extending date removes late fines.</span>
        </div>
        <input
          type="date"
          className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Update Date"
          )}
        </button>
      </form>
    </ModalOverlay>
  );
};

// ==========================================
// 6. INSTALLMENT MODAL
// ==========================================
export const InstallmentModal = ({
  isOpen,
  onClose,
  totalAmount,
  onConvert,
  isLoading,
}) => {
  const [count, setCount] = useState(2);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (isOpen && totalAmount) {
      const base = Math.floor(totalAmount / count);
      const rem = totalAmount % count;
      setRows(
        Array.from({ length: count }).map((_, i) => ({
          amount: i === 0 ? base + rem : base,
          dueDate: new Date().toISOString().split("T")[0],
        })),
      );
    }
  }, [count, totalAmount, isOpen]);

  const updateRow = (i, field, val) => {
    const n = [...rows];
    n[i][field] = val;
    setRows(n);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay title="Create Installments" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg flex justify-between font-bold text-slate-700">
          <span>Total:</span>
          <span>{totalAmount.toLocaleString()}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Number of Installments
          </label>
          <select
            className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} Installments
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200"
            >
              <span className="text-xs font-bold text-slate-400 w-6">
                #{i + 1}
              </span>
              <input
                type="date"
                className="border p-1.5 rounded text-sm flex-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                value={row.dueDate}
                onChange={(e) => updateRow(i, "dueDate", e.target.value)}
              />
              <input
                type="number"
                className="border p-1.5 rounded text-sm w-24 text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                value={row.amount}
                onChange={(e) => updateRow(i, "amount", e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => onConvert(rows)}
          className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Confirm Split"
          )}
        </button>
      </div>
    </ModalOverlay>
  );
};
