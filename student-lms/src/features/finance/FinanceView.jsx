import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetMyChallansQuery } from "./financeApi";
import {
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Loader2,
  Printer,
} from "lucide-react";

const FinanceView = () => {
  const user = useSelector((state) => state.auth.user);

  // Fetch challans using the student's profile ID
  const {
    data: challansRes,
    isLoading,
    isError,
  } = useGetMyChallansQuery(user?.profileId, {
    skip: !user?.profileId,
  });

  const challans = challansRes?.data?.challans || challansRes?.data || [];

  // Calculate Summaries
  const { totalDue, totalPaid, upcomingCount } = useMemo(() => {
    let due = 0;
    let paid = 0;
    let upcoming = 0;

    challans.forEach((challan) => {
      const amount = Number(challan.netAmount) || 0;
      if (challan.status === "paid") {
        paid += amount;
      } else {
        due += amount;
        upcoming += 1;
      }
    });

    return { totalDue: due, totalPaid: paid, upcomingCount: upcoming };
  }, [challans]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status, dueDate) => {
    if (status === "paid") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 font-bold text-xs border border-green-200">
          <CheckCircle2 size={14} /> Paid
        </span>
      );
    }

    const isOverdue = new Date(dueDate) < new Date();
    if (isOverdue || status === "overdue") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 font-bold text-xs border border-red-200">
          <AlertCircle size={14} /> Overdue
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200">
        <Clock size={14} /> Pending
      </span>
    );
  };

  // =========================================================
  // PRINT LOGIC (Imported from ERP)
  // =========================================================
  const handlePrint = (challan) => {
    if (!challan) return;

    // 1. Assets
    const logoUrl = window.location.origin + "/nei - Edited.png";
    const oneBillLogoUrl = "/logo1bill.PNG";

    // 2. Formatters
    const formatPrintDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        return new Date(dateString).toLocaleDateString("en-GB");
      } catch (e) {
        return "N/A";
      }
    };

    const formatCurrency = (amount) =>
      amount ? amount.toLocaleString("en-PK") : "0";

    // 3. Data Extraction
    // In LMS, we can fallback to the current logged in user if challan.studentId is not fully populated
    const student = challan.studentId || {};
    const personalInfo = student.personalInfo || {};

    const fatherName =
      student.familyInfo?.fatherName || student.personalInfo?.fatherName || "";

    const programName =
      challan.programId?.name ||
      student.programId?.name ||
      user?.program ||
      "N/A";
    const sessionName = challan.termId?.name || "N/A";

    const semesterName = challan.semesterId?.number
      ? ` ${challan.semesterId.number}`
      : "N/A";

    // 1Bill Invoice ID (Prefix 101340)
    const invoiceSuffix = challan.paymentReference || "00000000";
    const fullOneBillId = `101340${invoiceSuffix}`;

    // Challan Type Formatting
    const challanTypeFormatted = challan.challanType
      ? challan.challanType.replace(/_/g, " ").toUpperCase()
      : "FEE";

    // 4. Generate Fee Rows
    let feeRowsHTML = "";

    feeRowsHTML += `
      <tr style="background-color: #f0f0f0;">
        <td class="fee-label" style="font-weight:900;">${challanTypeFormatted}</td>
        <td class="fee-amount" style="font-weight:900;">${formatCurrency(challan.netAmount)}</td>
      </tr>
    `;

    if (challan.feeDetails) {
      Object.entries(challan.feeDetails).forEach(([key, amount]) => {
        if (amount > 0 && !key.toLowerCase().includes("arrears")) {
          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
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

    // 5. HTML Generator Helper
    const generateCard = (copyTitle) => `
      <div class="challan-card">
        <div class="copy-label">${copyTitle}</div>
        
        <div class="bank-name-main">NATIONAL EXCELLENCE INSTITUTE</div>

        <div class="challan-header">
          <div class="logo-container"><img src="${logoUrl}" class="logo-img" alt="Logo" onerror="this.style.display='none'"/></div>
          
          <div class="header-content">
            <div class="fee-challan-title">1BILL FEE CHALLAN</div>
            <div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
            
            <div style="margin-top: 6px; border: 2px solid #000; padding: 4px; background: #e0f7fa;">
               <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">1Bill Consumer ID / Invoice No</div>
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
                <td class="info-value">${formatPrintDate(challan.dueDate)}</td>
                <td class="info-label">Reg ID</td>
                <td class="info-value">${student.studentId || user?.rollNumber || "N/A"}</td>
              </tr>
              <tr>
                <td class="info-label">Name</td>
                <td class="info-value">${personalInfo.fullName || user?.name || "N/A"}</td>
                <td class="info-label">Father Name</td>
                <td class="info-value">${fatherName || "-"}</td>
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
                <p>3- Late fee Rs.500/day charged after due date.</p>
            </div>
          </div>
          
          <div class="signature-section">
            <div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div>
            <div class="signature-box"><div class="signature-line"></div><div class="signature-label">ACCOUNTS OFFICER</div></div>
          </div>
        </div>
      </div>
    `;

    // 6. Full HTML Construction
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Challan - ${challan.challanNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
          
          @media print {
            @page { size: A4 landscape; margin: 0mm; }
            body { width: 297mm !important; height: 210mm !important; margin: 0 !important; padding: 10mm !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow: hidden !important; }
            .challan-row-container { display: flex !important; flex-direction: row !important; width: 277mm !important; height: 190mm !important; gap: 4mm !important; justify-content: space-between !important; align-items: stretch !important; page-break-inside: avoid !important; break-inside: avoid !important; }
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
          .fee-table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; flex-grow: 1; font-size: 9px; }
          .fee-table td { border: 0.5mm solid #000; padding: 5px 6px; height: 26px; vertical-align: middle; overflow: hidden; }
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
          .content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0 6px; }
          .table-container { flex: 1; overflow-y: auto; margin-bottom: 0.5px; min-height: 0; }
          .amount-in-words { font-size: 9px; margin-bottom: 5px; border: 1px solid #ccc; padding: 3px; }
        </style>
      </head>
      <body>
        <div class="challan-row-container">
          ${generateCard("BANK COPY")}
          ${generateCard("OFFICE COPY")}
          ${generateCard("STUDENT COPY")}
        </div>
        <script>
            setTimeout(function() { window.print(); }, 800);
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* --- HEADER --- */}
      <div className="no-print">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Fee Vouchers
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Manage your tuition fees and payment history.
        </p>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <AlertCircle size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Total Amount Due
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              Rs. {totalDue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Total Paid
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              Rs. {totalPaid.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Pending Vouchers
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {upcomingCount}
            </p>
          </div>
        </div>
      </div>

      {/* --- VOUCHERS LIST (ROW LAYOUT) --- */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6 no-print">
          Voucher History
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="animate-spin mb-4 text-blue-600" size={32} />
            <p className="font-medium">Loading your financial records...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-8 rounded-2xl text-center border border-red-200">
            <AlertCircle className="mx-auto mb-3" size={40} />
            <p className="text-lg font-bold">Failed to load fee vouchers.</p>
            <p className="mt-1 font-medium">
              Please try refreshing the page or contact the accounts office.
            </p>
          </div>
        ) : challans.length === 0 ? (
          <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center shadow-sm">
            <Receipt
              className="mx-auto mb-4 text-slate-300"
              size={64}
              strokeWidth={1.5}
            />
            <h3 className="text-xl font-bold text-slate-900">
              No Vouchers Found
            </h3>
            <p className="text-slate-500 mt-2 font-medium">
              You do not have any fee challans issued at the moment.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden printable-area">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Challan Details</div>
              <div className="col-span-2">Issue Date</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-center no-print">Action</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-slate-100">
              {challans.map((challan) => (
                <div
                  key={challan._id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-slate-50 transition-colors duration-200"
                >
                  {/* Column 1: Details */}
                  <div className="col-span-1 md:col-span-3">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                      #{challan.challanNo}
                    </p>
                    <p className="font-bold text-slate-900 leading-snug">
                      {challan.challanType
                        ? challan.challanType.replace("_", " ")
                        : "Semester Fee"}
                    </p>
                    {challan.isInstallment && (
                      <span className="mt-1 inline-block text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        Installment {challan.installmentNumber}
                      </span>
                    )}
                  </div>

                  {/* Column 2: Issue Date */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:block">
                    <span className="md:hidden text-sm font-medium text-slate-500">
                      Issued:
                    </span>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatDate(challan.issuedAt)}
                    </p>
                  </div>

                  {/* Column 3: Due Date */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:block">
                    <span className="md:hidden text-sm font-medium text-slate-500">
                      Due:
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {formatDate(challan.dueDate)}
                    </p>
                  </div>

                  {/* Column 4: Amount */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-right">
                    <span className="md:hidden text-sm font-medium text-slate-500">
                      Amount:
                    </span>
                    <p className="text-lg font-black text-slate-900">
                      Rs. {Number(challan.netAmount || 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Column 5: Status */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                    <span className="md:hidden text-sm font-medium text-slate-500">
                      Status:
                    </span>
                    {getStatusBadge(challan.status, challan.dueDate)}
                  </div>

                  {/* Column 6: Action */}
                  <div className="col-span-1 text-right md:text-center no-print mt-3 md:mt-0">
                    <button
                      onClick={() => handlePrint(challan)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm w-full md:w-auto justify-center"
                      title={
                        challan.status === "paid"
                          ? "Download Receipt"
                          : "Print Voucher"
                      }
                    >
                      {challan.status === "paid" ? (
                        <Download size={16} />
                      ) : (
                        <Printer size={16} />
                      )}
                      <span className="md:hidden lg:inline">
                        {challan.status === "paid" ? "Receipt" : "Print"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { margin: 1cm; size: portrait; }
          body { 
            background-color: white !important;
            -webkit-print-color-adjust: exact; 
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default FinanceView;
