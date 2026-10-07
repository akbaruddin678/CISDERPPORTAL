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

    const logoUrl = window.location.origin + "/cisd-logo.png";
    const oneBillLogoUrl = "/onelink.png";

    const printWindow = window.open("", "_blank");

    const printContent = getPrintPageHTML(
      challanData,
      selectedStudent,
      semesters,
      logoUrl,
      oneBillLogoUrl,
    );

    printWindow.document.write(printContent);
    printWindow.document.close();
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
                c.semesterId?.number ? ` (Sem ${c.semesterId.number})` : ""
              }`
            : `${(c.challanType || "Fee").replace(/_/g, " ")}${
                c.semesterId?.number ? ` (Sem ${c.semesterId.number})` : ""
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
            <span>
              {selectedStudent.programId?.name || selectedStudent.program?.name}
            </span>
            {selectedStudent.semesterId?.number && (
              <>
                <span>•</span>
                <span>Semester {selectedStudent.semesterId.number}</span>
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
                Semester Tuition
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
            {showPreviousSemesters ? "Hide" : "Show"} previous semesters (
            {previousSemesterGroups.reduce((s, g) => s + g.challans.length, 0)}{" "}
            challans)
          </button>
          {showPreviousSemesters && (
            <div className="mt-3 space-y-4">
              {previousSemesterGroups.map((g, idx) => (
                <div key={idx}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                    Semester {g.number ?? "—"}
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

const formatDateChallan = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-GB");
  } catch (e) {
    return "N/A";
  }
};

const generateChallanCardHTML = (
  title,
  challan,
  student,
  semestersList,
  logoUrl,
  oneBillLogoUrl,
) => {
  const studentData = challan.studentId || student;
  const personalInfo = studentData?.personalInfo || student?.personalInfo || {};
  const studentName = personalInfo.fullName || "N/A";

  const fatherName =
    studentData?.familyInfo?.fatherName ||
    student?.familyInfo?.fatherName ||
    personalInfo.fatherName ||
    "N/A";

  const programName =
    challan.programId?.name ||
    studentData?.programId?.name ||
    student?.program?.name ||
    "N/A";
  const sessionName =
    challan.termId?.name ||
    studentData?.termId?.name ||
    student?.term?.name ||
    "N/A";

  const rawSemNum =
    challan.semesterId?.number ||
    studentData?.semesterId?.number ||
    student?.semester?.number;
  const semesterName = rawSemNum ? ` ${rawSemNum}` : "N/A";

  const invoiceSuffix = challan.paymentReference || "00000000";
  const fullOneBillId = `101340${invoiceSuffix}`;
  const accountstamp = "/accountss.jpeg";

  let challanTypeFormatted = challan.challanType
    ? challan.challanType.replace(/_/g, " ").toUpperCase()
    : "FEE";

  if (challan.isInstallment && challan.installmentNumber) {
    if (challanTypeFormatted === "INSTALLMENT") {
      challanTypeFormatted = `INSTALLMENT ${challan.installmentNumber}`;
    } else {
      challanTypeFormatted += ` (INSTALLMENT ${challan.installmentNumber})`;
    }
  }

  let feeRowsHTML = "";
  feeRowsHTML += `
    <tr style="background-color: #f0f0f0;">
      <td class="fee-label" style="font-weight:900;">${challanTypeFormatted}</td>
      <td class="fee-amount" style="font-weight:900;">${formatCurrency(challan.originalTotal)}</td>
    </tr>
  `;

  const feeObj =
    challan.feeDetails && typeof challan.feeDetails.toJSON === "function"
      ? challan.feeDetails.toJSON()
      : challan.feeDetails || {};

  if (Object.keys(feeObj).length > 0) {
    Object.entries(feeObj).forEach(([key, amount]) => {
      if (amount > 0 && !key.toLowerCase().includes("arrears")) {
        let label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        if (label.toLowerCase().includes("final exam fee")) {
          label = "Exam Fee";
        }

        feeRowsHTML += `<tr><td class="fee-label">${label}</td><td class="fee-amount">-</td></tr>`;
      }
    });
  }

  if (challan.arrears > 0)
    feeRowsHTML += `<tr><td class="fee-label">Arrears / Previous</td><td class="fee-amount">${formatCurrency(challan.arrears)}</td></tr>`;
  if (challan.fineAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Late Fine</td><td class="fee-amount">${formatCurrency(challan.fineAmount)}</td></tr>`;
  if (challan.scholarshipAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Scholarship</td><td class="fee-amount">(${formatCurrency(challan.scholarshipAmount)})</td></tr>`;
  if (challan.discountAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Discount ${challan.discountReason ? `(${challan.discountReason})` : ""}</td><td class="fee-amount">(${formatCurrency(challan.discountAmount)})</td></tr>`;

  return `
    <div class="challan-card">
      <div class="copy-label">${title}</div>
      <div class="bank-name-main">CISD</div>
      <div class="challan-header">
        <div class="logo-container"><img src="${logoUrl}" class="logo-img" alt="Logo" onerror="this.style.display='none'"/></div>
        <div class="header-content">
          <div class="fee-challan-title">FEE CHALLAN</div>
          <div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
          <div style="margin-top: 6px; border: 2px solid #000; padding: 4px; background: #e0f7fa;">
             <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">1 Bill Invoice</div>
             <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">${fullOneBillId}</div>
          </div>
        </div>
        <div class="logo-container"><img src="${oneBillLogoUrl}" class="logo-img" style="object-fit:contain;" alt="1Bill" onerror="this.style.display='none'"/></div>
      </div>
      <div class="separator-line"></div>
      <div class="content-area">
        <div class="info-section">
          <table class="info-table">
            <tr>
              <td class="info-label">Due Date</td>
              <td class="info-value">${formatDateChallan(challan.dueDate)}</td>
              <td class="info-label">Reg ID</td>
              <td class="info-value">${studentData?.studentId || "N/A"}</td>
            </tr>
            <tr>
              <td class="info-label">Name</td>
              <td class="info-value">${studentName}</td>
              <td class="info-label">Father Name</td>
              <td class="info-value">${fatherName}</td>
            </tr>
            <tr>
              <td class="info-label">Program</td>
              <td class="info-value">${programName}</td>
              <td class="info-label">Semester</td>
              <td class="info-value">${semesterName}</td>
            </tr>
             <tr>
              <td class="info-label">Session</td>
              <td class="info-value">${sessionName}</td>
              <td class="info-label">Type</td>
              <td class="info-value">${challanTypeFormatted}</td>
            </tr>
             <tr>
              <td class="info-label">Challan No</td>
              <td class="info-value" colspan="3">${challan.challanNo}</td>
            </tr>
          </table>
        </div> 
        <div class="separator-line"></div>
        <div class="fee-details-title">FEE DETAILS</div>
        <div class="table-container">
          <table class="fee-table">
            ${feeRowsHTML}
            <tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr>
            <tr class="total-row"><td class="fee-label">GRAND TOTAL</td><td class="fee-amount">${formatCurrency(challan.netAmount)}</td></tr>
          </table>
          <div class="amount-in-words"><strong>Total (Rs):</strong> ${formatCurrency(challan.netAmount)}</div>
          <div class="footer-notes">
              <p><strong>Note:</strong></p>
              <p>1- Pay your Bills through 1Link/1-Bill (Invoice/Voucher), Banking Apps, ATMs, Easypaisa, Jazz Cash etc.</p>
              <p>2- Direct Deposit by visiting any Bank in country.</p>
              <p>A late fee of 2,000 will be charged after the due date. Five days after the due date, the fee increases to 5,000.</p>
          </div>
        </div>
        <div class="signature-section">
          <div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div>
          <div class="signature-box">
            <img src="${accountstamp}" style="height: 35px; width: auto; object-fit: contain; margin: 0 auto 2px auto; display: block;" alt="Stamp" onerror="this.style.display='none'"/>
            <div class="signature-line"></div>
            <div class="signature-label">ACCOUNTS OFFICER</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const getPrintPageHTML = (
  challan,
  student,
  semestersList,
  logoUrl,
  oneBillLogoUrl,
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Challan - ${challan.challanNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            height: 98vh !important; 
            background: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            overflow: hidden !important; 
          }
          .challan-row-container { 
            display: flex !important; 
            flex-direction: row !important; 
            width: 100% !important; 
            height: 100% !important; 
            gap: 4mm !important; 
            justify-content: space-between !important; 
            align-items: stretch !important; 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
            overflow: hidden !important;
          }
          .challan-card { flex: 1 !important; min-width: 0 !important; border: 0.5mm dashed #000 !important; background: white !important; position: relative !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; page-break-inside: avoid !important; break-inside: avoid !important; }
          .info-label, .fee-label { background-color: #f5f5f5 !important; }
          .total-row { background-color: #e0e0e0 !important; }
          .bank-account { background-color: #f0f0f0 !important; }
          .footer-notes { background-color: #fffde7 !important; }
          .copy-label { padding: 2px 0.5px; background-color: rgb(255, 255, 255) !important; border: 0.2mm solid rgb(94, 94, 94) !important; color: #000000 !important}
          .no-print { display: none !important; }
        }
        
        .challan-header { text-align: center; padding: 2px 6px 6px;  background: white; flex-shrink: 0; display: flex; align-items: center; gap: 10px; position: relative; }
        .logo-container { flex-shrink: 0; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
        .logo-img { width: 55px; height: 55px; object-fit: contain; border-radius: 8px; }
        .header-content { flex: 1; text-align: center; }
        .bank-name-main { font-size: 16px; font-weight: bold; color: #1a237e; margin-top: 24px; margin-bottom: 2px; text-align: center; width: 100%; letter-spacing: 0.2px; }
        .fee-challan-title { font-size: 13px; font-weight: bold; color: #d32f2f; margin-bottom: 3px; text-transform: uppercase; line-height: 1.1; }
        .address { font-size: 10px; color: #000; margin-bottom: 4px; line-height: 1.1; white-space: normal; }
        .separator-line { border-top: 0.5mm solid #000; margin: 6px 0; flex-shrink: 0; }
        .info-section { width: 100%; padding: 6px; flex-shrink: 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; font-size: 9px; }
        .info-table td { border: 0.5mm solid #000; padding: 4px 5px; min-height: 24px; vertical-align: middle; white-space: normal; word-wrap: break-word; overflow: visible; }
        .info-label { font-weight: bold; background: #f5f5f5; width: 20%; font-size: 9px; }
        .info-value { text-align: left; width: 30%; font-size: 9px; }
        .fee-details-title { text-align: center; font-size: 12px; font-weight: bold; margin: 8px 0 4px; text-decoration: underline; flex-shrink: 0; }
        
        .content-area { flex: 1; display: flex; flex-direction: column; padding: 0 6px; overflow: hidden; } 
        .table-container { flex: 1; margin-bottom: 0.5px; min-height: 0; overflow: hidden; } 
        .fee-table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; font-size: 9px; }
        .fee-table td { border: 0.5mm solid #000; padding: 2px 4px; height: auto; min-height: 16px; vertical-align: middle; overflow: hidden; } 
        
        .fee-label { font-weight: bold; background: #f5f5f5; width: 70%; font-size: 9px; }
        .fee-amount { text-align: right; width: 30%; font-weight: bold; font-family: 'Courier New', monospace; padding-right: 8px; font-size: 9px; }
        .total-row { font-weight: bold; background: #e0e0e0; }
        .total-row .fee-amount { font-size: 10px; }
        .footer-notes { margin: 8px 6px; padding: 5px; border: 0.5mm solid #000; background: #fffde7; font-size: 8px; line-height: 1.2; flex-shrink: 0; border-radius: 2px; }
        .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin: 10px 6px 6px; padding-top: 6px; flex-shrink: 0; }
        .signature-box { text-align: center; width: 45%; min-width: 0; }
        .signature-line { width: 100%; border-top: 0.5mm solid #000; margin: 2px 0; }
        .signature-label { font-size: 8px; font-weight: bold; line-height: 1.1; }
        .copy-label { position: absolute; top: 6px; left: 6px; background: #8f8f8fff; padding: 2px 8px; font-weight: bold; font-size: 8px; z-index: 10; border-radius: 3px; color: white; }
        .amount-in-words { font-size: 9px; margin-bottom: 5px; border: 1px solid #ccc; padding: 3px; }
      </style>
    </head>
    <body>
      <div class="challan-row-container">
        ${generateChallanCardHTML("BANK COPY", challan, student, semestersList, logoUrl, oneBillLogoUrl)}
        ${generateChallanCardHTML("OFFICE COPY", challan, student, semestersList, logoUrl, oneBillLogoUrl)}
        ${generateChallanCardHTML("STUDENT COPY", challan, student, semestersList, logoUrl, oneBillLogoUrl)}
      </div>
      <script>
          setTimeout(function() { window.print(); }, 800);
      </script>
    </body>
    </html>
  `;
};

export default StudentDetailView;
