import React, { useState } from "react";
import { ArrowLeft, Plus, Award } from "lucide-react";
import ChallanTable from "../../components/Challan/ChallanTable";
import {
  GenerateModal,
  InstallmentModal,
  EditDateModal,
  DiscountModal,
  DetailModal,
} from "../../components/Challan/ChallanModals";

const StudentDetailView = ({ data }) => {
  const {
    selectedStudent,
    studentChallans,
    actions,
    clearStudent,
    isProcessing,
    activeScholarships,
    terms,
    filters,
  } = data;

  const [showGenModal, setShowGenModal] = useState(false);
  const [instData, setInstData] = useState(null);
  const [editDateData, setEditDateData] = useState(null);
  const [discountData, setDiscountData] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const currentSessionName = terms?.find((t) => t._id === filters.termId)?.name;

  // --- PRINT FUNCTIONALITY (3 Copies: Bank, Office, Student) ---
  const handlePrintChallan = (challanId) => {
    const challanData = studentChallans.find((c) => c._id === challanId);
    if (!challanData) return;

    const logoUrl = window.location.origin + "/cisd-logo.png";
    const printWindow = window.open("", "_blank");

    const formatCurrency = (amount) =>
      amount ? amount.toLocaleString("en-PK") : "-";

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        return `${date.getDate()}-${date.toLocaleString("en-US", {
          month: "short",
        })}-${date.getFullYear()}`;
      } catch (e) {
        return "N/A";
      }
    };

    // Construct HTML
    const printContent = getPrintPageHTML(
      challanData,
      selectedStudent,
      formatDate,
      formatCurrency,
      logoUrl
    );

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // --- ACTIONS ---
  const handleTableActions = {
    onPay: (id) => actions.confirmPay(id),
    onDelete: (id) => actions.confirmDelete(id),
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
      if (c) setDiscountData(c); // Pass full object for validation
    },
    onViewDetail: (challan) => setDetailData(challan),
  };

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
          <div className="flex gap-4 text-sm text-slate-500 mt-1">
            <span>ID: {selectedStudent.studentId}</span>
            <span>•</span>
            <span>{selectedStudent.programId?.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {activeScholarships?.length > 0 && (
            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100 flex items-center gap-2">
              <Award size={14} /> Grant Active
            </div>
          )}
          <button
            onClick={() => setShowGenModal(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} /> Generate
          </button>
        </div>
      </div>

      <ChallanTable
        challans={studentChallans}
        actions={handleTableActions}
        onRowClick={handleTableActions.onViewDetail}
      />

      {/* --- MODALS --- */}
      <GenerateModal
        isOpen={showGenModal}
        onClose={() => setShowGenModal(false)}
        studentName={selectedStudent.personalInfo?.fullName}
        currentSessionName={currentSessionName}
        onGenerate={(form) =>
          actions
            .generateSingle(form)
            .then((ok) => ok && setShowGenModal(false))
        }
        isLoading={isProcessing}
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
        onApply={(data) =>
          actions
            .applyDiscount(discountData._id, data)
            .then((ok) => ok && setDiscountData(null))
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

// =========================================================
// PRINT TEMPLATE HELPERS
// =========================================================

const formatFeeKey = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

const generateChallanCardHTML = (
  title,
  challan,
  student,
  formatDate,
  formatCurrency,
  logoUrl
) => {
  const studentName = student?.personalInfo?.fullName || "N/A";
  const fatherName = student?.personalInfo?.fatherName || "";
  const programName =
    challan.programId?.name || student?.programId?.name || "N/A";
  const sessionName = challan.termId?.name || "N/A";
  const challanType =
    challan.challanType === "installment" ? "Installment" : "Semester Fee";

  let feeRowsHTML = "";

  // 1. Fee Breakdown
  if (challan.feeDetails) {
    Object.entries(challan.feeDetails).forEach(([key, amount]) => {
      if (amount > 0)
        feeRowsHTML += `<tr><td class="fee-label">${formatFeeKey(
          key
        )}</td><td class="fee-amount">${formatCurrency(amount)}</td></tr>`;
    });
  } else if (challan.originalTotal > 0) {
    feeRowsHTML += `<tr><td class="fee-label">Total Fee</td><td class="fee-amount">${formatCurrency(
      challan.originalTotal
    )}</td></tr>`;
  }

  // 2. Additions
  if (challan.arrears > 0)
    feeRowsHTML += `<tr><td class="fee-label">Arrears</td><td class="fee-amount">${formatCurrency(
      challan.arrears
    )}</td></tr>`;
  if (challan.fineAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Late Fine</td><td class="fee-amount">${formatCurrency(
      challan.fineAmount
    )}</td></tr>`;

  // 3. Deductions
  if (challan.scholarshipAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Scholarship</td><td class="fee-amount">(${formatCurrency(
      challan.scholarshipAmount
    )})</td></tr>`;
  if (challan.discountAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Special Discount</td><td class="fee-amount">(${formatCurrency(
      challan.discountAmount
    )})</td></tr>`;

  return `
    <div class="challan-card">
      <div class="copy-label">${title}</div>
      <div class="challan-header">
        <div class="logo-container"><img src="${logoUrl}" class="logo-img" alt="Logo" onerror="this.style.display='none'"/></div>
        <div class="header-content">
          <div class="bank-name-main">FAYSAL BANK LIMITED</div>
          <div class="fee-challan-title">FEE CHALLAN FORM</div>
          <div class="address">See Square, Main G.T Road Gate 1 B-17 Islamabad</div>
          <div class="payable-info"><strong>Payable at any branch</strong></div>
          <div class="bank-name-bold">FAYSAL BANK LIMITED</div>
          <div class="bank-account">ACC# 3196301000003087</div>
        </div>
      </div>
      <div class="separator-line"></div>
      <div class="content-area">
        <div class="info-section">
          <table class="info-table">
            <tr><td class="info-label">Name</td><td class="info-value truncate" colspan="3">${studentName} ${
    fatherName ? "s/o " + fatherName : ""
  }</td></tr>
            <tr><td class="info-label">Reg No</td><td class="info-value truncate">${
              student?.studentId
            }</td><td class="info-label">Type</td><td class="info-value truncate">${challanType}</td></tr>
            <tr><td class="info-label">Program</td><td class="info-value truncate">${programName}</td><td class="info-label">Session</td><td class="info-value truncate">${sessionName}</td></tr>
            <tr><td class="info-label">Challan #</td><td class="info-value truncate">${
              challan.challanNo
            }</td><td class="info-label">Due Date</td><td class="info-value truncate" style="font-weight:bold">${formatDate(
    challan.dueDate
  )}</td></tr>
          </table>
        </div> 
        <div class="separator-line"></div>
        <div class="fee-details-title">PARTICULARS</div>
        <div class="table-container">
          <table class="fee-table">
            ${feeRowsHTML}
            <tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr>
            <tr class="total-row"><td class="fee-label">NET PAYABLE</td><td class="fee-amount">${formatCurrency(
              challan.netAmount
            )}</td></tr>
          </table>
          <div class="amount-in-words"><strong>Total (Rs):</strong> ${formatCurrency(
            challan.netAmount
          )}</div>
          <div class="footer-notes">
            <p>1. Cash/Cheque/Pay Order accepted.</p>
            <p>2. Fine Rs.500/day after due date.</p>
            <p>3. Fee non-refundable.</p>
          </div>
        </div>
        <div class="signature-section">
          <div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div>
          <div class="signature-box"><div class="signature-line"></div><div class="signature-label">OFFICER</div></div>
        </div>
      </div>
    </div>
  `;
};

const getPrintPageHTML = (
  challan,
  student,
  formatDate,
  formatCurrency,
  logoUrl
) => {
  return `
    <!DOCTYPE html><html><head><title>Challan ${challan.challanNo}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; font-family: sans-serif; }
      @media print { @page { size: A4 landscape; margin: 5mm; } body { width: 280mm; } .no-print { display: none; } }
      .challan-row-container { display: flex; width: 100%; gap: 5mm; }
      .challan-card { flex: 1; border: 1px dashed #444; padding: 5px; display: flex; flex-direction: column; height: 185mm; }
      .challan-header { display: flex; gap: 5px; align-items: center; margin-bottom: 5px; }
      .logo-img { width: 45px; height: 45px; object-fit: contain; }
      .header-content { flex: 1; text-align: center; }
      .bank-name-main { font-size: 14px; font-weight: 900; color: #1a237e; }
      .fee-challan-title { font-size: 12px; font-weight: bold; color: #d32f2f; text-decoration: underline; margin: 2px 0; }
      .address { font-size: 8px; color: #444; }
      .bank-account { font-size: 10px; font-weight: bold; background: #eee; border: 1px solid #ccc; width: 100%; display: block; margin-top: 2px; }
      .info-table, .fee-table { width: 100%; border-collapse: collapse; font-size: 9px; }
      .info-table td, .fee-table td { border: 1px solid #999; padding: 3px; }
      .info-label, .fee-label { background: #f8f9fa; font-weight: bold; }
      .fee-amount { text-align: right; font-family: monospace; font-weight: bold; }
      .total-row td { background: #e0e0e0; font-weight: bold; border-top: 2px solid #000; font-size: 10px; }
      .copy-label { text-align: center; background: #333; color: white; font-size: 10px; font-weight: bold; padding: 2px; margin-bottom: 5px; }
      .signature-section { display: flex; justify-content: space-between; margin-top: auto; padding-top: 10px; }
      .signature-box { text-align: center; width: 40%; }
      .signature-line { border-bottom: 1px solid #000; margin-bottom: 2px; }
      .signature-label { font-size: 8px; font-weight: bold; }
      .footer-notes { font-size: 8px; margin-top: 5px; border: 1px dotted #999; padding: 3px; }
      .amount-in-words { font-size: 9px; margin-bottom: 5px; border: 1px solid #ccc; padding: 3px; }
    </style></head><body>
    <div class="challan-row-container">
      ${generateChallanCardHTML(
        "BANK COPY",
        challan,
        student,
        formatDate,
        formatCurrency,
        logoUrl
      )}
      ${generateChallanCardHTML(
        "OFFICE COPY",
        challan,
        student,
        formatDate,
        formatCurrency,
        logoUrl
      )}
      ${generateChallanCardHTML(
        "STUDENT COPY",
        challan,
        student,
        formatDate,
        formatCurrency,
        logoUrl
      )}
    </div>
    </body></html>`;
};

export default StudentDetailView;
