import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "../../auth/context/AuthContext";
import AdmissionStatusCard from "./AdmissionStatusCard";
import { getAuthToken } from "../../user-admission/services/getAuthToken";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ProfileView = ({
  userData,
  admissionData,
  challanData,
  isLoading,
  isError,
  navigateToAdmission,
}) => {
  const { dispatchAuthLogout } = useAuth();
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [safeImages, setSafeImages] = useState({ photo: null, docs: [] });
  const [pdfProgress, setPdfProgress] = useState(0);

  const pdfTemplateRef = useRef();
  const documentLabels = [
    "CNIC/B-Form Front",
    "CNIC/B-Form Back",
    "Domicile Certificate",
    "Matric Certificate",
    "Intermediate Certificate",
    "Degree Document",
  ];

  const getName = useCallback((field) => {
    if (!field) return "N/A";
    if (typeof field === "object" && field.name) return field.name;
    return field;
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  }, []);

  const formatDatePDF = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  }, []);

  const getSafeUrl = async (url) => {
    if (!url) return null;
    const token = getAuthToken();
    try {
      const proxyUrl = `https://apicisd.cisdportal.online/api/admissions/documents?url=${encodeURIComponent(
        url,
      )}`;
      const response = await fetch(proxyUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      return url;
    }
  };

  const handlePrintChallan = () => {
    if (!challanData) return;
    const printWindow = window.open("", "_blank");

    const baseUrl = window.location.origin; // Needed for the stamp/sign images
    const logoUrl = baseUrl + "/cisd-logo.png";
    const oneBillLogoUrl = "/logo1bill.PNG";

    const formatDateChallan = (d) =>
      d ? new Date(d).toLocaleDateString("en-GB") : "N/A";
    const formatCurrency = (val) => (val ? val.toLocaleString("en-PK") : "0");

    const studentName = admissionData?.fullName || "N/A";
    const fatherName = admissionData?.fatherName || "";
    const programName = getName(admissionData?.applyingForProgram);

    const invoiceSuffix = challanData.paymentReference || "0000000000";
    const fullOneBillId = `101340${invoiceSuffix}`;

    let challanTypeFormatted = (
      challanData.challanType ||
      challanData.type ||
      "FEE"
    )
      .replace(/_/g, " ")
      .toUpperCase();
    if (challanTypeFormatted.includes("FINAL EXAM")) {
      challanTypeFormatted = challanTypeFormatted.replace("FINAL EXAM", "EXAM");
    }

    let feeRowsHTML = "";

    const displayOriginalTotal =
      challanData.originalTotal ||
      challanData.amount ||
      challanData.netAmount ||
      0;
    feeRowsHTML += `
     <tr style="background-color: #f0f0f0;">
       <td class="fee-label" style="font-weight:900;">${challanTypeFormatted}</td>
       <td class="fee-amount" style="font-weight:900;">${formatCurrency(displayOriginalTotal)}</td>
     </tr>
   `;

    const feeObj =
      challanData.feeDetails &&
      typeof challanData.feeDetails.toJSON === "function"
        ? challanData.feeDetails.toJSON()
        : challanData.feeDetails || {};

    if (Object.keys(feeObj).length > 0) {
      Object.entries(feeObj).forEach(([key, amount]) => {
        if (amount > 0 && !key.toLowerCase().includes("arrears")) {
          let label = key;
          if (!key.includes(" ") && !key.includes(":")) {
            label = key.replace(/([A-Z])/g, " $1");
          }
          label = label
            .replace(/^./, (str) => str.toUpperCase())
            .trim()
            .replace(/\s+/g, " ");

          if (label.toLowerCase().includes("final exam")) {
            label = "Exam Fee";
          }
          feeRowsHTML += `<tr><td class="fee-label">${label}</td><td class="fee-amount">${formatCurrency(amount)}</td></tr>`;
        }
      });
    }

    if (challanData.arrears > 0)
      feeRowsHTML += `<tr><td class="fee-label">Arrears / Previous</td><td class="fee-amount">${formatCurrency(challanData.arrears)}</td></tr>`;
    if (challanData.fineAmount > 0)
      feeRowsHTML += `<tr><td class="fee-label">Late Fine</td><td class="fee-amount">${formatCurrency(challanData.fineAmount)}</td></tr>`;
    if (challanData.scholarshipAmount > 0)
      feeRowsHTML += `<tr><td class="fee-label">Scholarship</td><td class="fee-amount">(${formatCurrency(challanData.scholarshipAmount)})</td></tr>`;
    if (challanData.discountAmount > 0)
      feeRowsHTML += `<tr><td class="fee-label">Discount ${challanData.discountReason ? `(${challanData.discountReason})` : ""}</td><td class="fee-amount">(${formatCurrency(challanData.discountAmount)})</td></tr>`;

    const grandTotal = challanData.netAmount || challanData.amount || 0;

    const generateCard = (copyTitle) => `
       <div class="challan-card">
         <div class="copy-label">${copyTitle}</div>
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
                 <td class="info-value">${formatDateChallan(challanData.dueDate)}</td>
                 <td class="info-label">Reg ID</td>
                 <td class="info-value">${admissionData?.studentId || admissionData?.applicationNo || "N/A"}</td>
               </tr>
               <tr>
                 <td class="info-label">Name</td>
                 <td class="info-value">${studentName}</td>
                 <td class="info-label">Father Name</td>
                 <td class="info-value">${fatherName || "-"}</td>
               </tr>
               <tr>
                 <td class="info-label">Program</td>
                 <td class="info-value">${programName}</td>
                 <td class="info-label">Challan No</td>
                 <td class="info-value">${challanData.challanNo}</td>
               </tr>
               <tr>
                 <td class="info-label">Type</td>
                 <td class="info-value" colspan="3">${challanTypeFormatted}</td>
               </tr>
             </table>
           </div> 
           <div class="separator-line"></div>
           <div class="fee-details-title">FEE DETAILS</div>
           <div class="table-container">
             <table class="fee-table">
               ${feeRowsHTML}
               <tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr>
               <tr class="total-row"><td class="fee-label">GRAND TOTAL</td><td class="fee-amount">${formatCurrency(grandTotal)}</td></tr>
             </table>
             <div class="amount-in-words"><strong>Total (Rs):</strong> ${formatCurrency(grandTotal)}</div>
             <div class="footer-notes">
                 <p><strong>Note:</strong> Pay the fee before due date to confirm your admission.</p>
                 <p>1- Pay your Bills through 1Link/1-Bill (Invoice/Voucher), Banking Apps, ATMs, Easypaisa, Jazz Cash etc.</p>
                 <p>2- Direct Deposit by visiting any Bank in country.</p>
             </div>
           </div>
           
           <!-- ✅ UPDATED SIGNATURE SECTION WITH STAMP AND SIGN LAYERED -->
           <div class="signature-section">
             <div class="signature-box">
               <div class="signature-area"></div> <!-- Spacer to keep lines even -->
               <div class="signature-line"></div>
               <div class="signature-label">BANK OFFICIAL</div>
             </div>
             
             <div class="signature-box">
               <div class="signature-area">
                 <img src="${baseUrl}/neistamp.jpeg" class="stamp-img" onerror="this.style.display='none'" />
                 <img src="${baseUrl}/sign.png" class="sign-img" onerror="this.style.display='none'" />
               </div>
               <div class="signature-line"></div>
               <div class="signature-label">ACCOUNTS OFFICER</div>
             </div>
           </div>
         </div>
       </div>
     `;

    const htmlContent = `
       <!DOCTYPE html>
       <html>
       <head>
         <title>Fee Challan - ${challanData.challanNo}</title>
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
           
           /* ✅ CSS TO PERFECTLY LAYER STAMP AND SIGNATURE ON CHALLAN */
           .signature-area { height: 35px; position: relative; width: 100px; margin: 0 auto; }
           .stamp-img { position: absolute; top: -10px; left: 0; width: 100%; height: 50px; object-fit: contain; opacity: 0.4; }
           .sign-img { position: absolute; top: -20px; left: 0; width: 100%; height: 100px; object-fit: contain; z-index: 10; }
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

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    if (admissionData) {
      const loadAll = async () => {
        const photo = await getSafeUrl(admissionData.photoFile);
        const docs = admissionData.docs
          ? await Promise.all(admissionData.docs.map((u) => getSafeUrl(u)))
          : [];
        setSafeImages({ photo, docs });
      };
      loadAll();
    }
    return () => {
      const urls = [safeImages.photo, ...safeImages.docs];
      urls.forEach((url) => {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [admissionData]);

  // Shared by both pieces below so they look like one continuous document
  // even though they're captured as two separate images (see
  // generateUniversityPDF) — that split is what lets the signature block
  // move to a fresh page as a whole instead of being sliced mid-way
  // whenever it would otherwise straddle a page boundary.
  const pdfStyles = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; color: #000; background: #ffffff; line-height: 1.2; font-size: 10pt; }
    .university-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header-logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 6px; }
    .university-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
    .university-address { font-size: 8.5pt; color: #444; margin-top: 3px; }
    .document-title { font-size: 12pt; font-weight: bold; text-align: center; margin: 15px 0; text-decoration: underline; }
    .section-header { background-color: #f0f0f0; padding: 5px; font-weight: bold; border: 1px solid #000; margin-top: 15px; margin-bottom: 10px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
    .data-table th { border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: left; }
    .data-table td { border: 1px solid #000; padding: 8px; text-align: left; }
    .address-section { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .address-box { width: 48%; border: 1px solid #000; padding: 10px; background-color: #f9f9f9; }
    .address-title { font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 3px; }
    .footer { margin-top: 30px; border-top: 2px solid #000; padding-top: 10px; font-size: 8pt; text-align: center; }
    .signatures { display: flex; justify-content: space-between; margin-top: 10px; }
    .signature-box { width: 45%; text-align: center; }
    .signature-line { border-top: 1px solid #000; width: 80%; margin: 5px auto; }
    .signature-area { height: 75px; position: relative; width: 150px; margin: 0 auto; }
    .sign-img { width: 100%; height: 100%; object-fit: contain; }
  `;

  const createEnhancedPDFContent = useMemo(() => {
    if (!admissionData) return "";

    const baseUrl = window.location.origin;
    const studentName = admissionData?.fullName || "Student Name";
    const programName = getName(admissionData?.applyingForProgram);
    const departmentName = getName(admissionData?.academicDepartment);
    const sessionName = getName(admissionData?.applyingSession);
    const registrationNo =
      admissionData?.studentId || admissionData?.applicationNo || "";

    const educationRows =
      admissionData?.educationDetails?.length > 0
        ? admissionData.educationDetails
            .map(
              (edu) => `
        <tr>
          <td style="border: 1px solid #000; padding: 8px;">${
            edu.educationProgram || "N/A"
          }</td>
          <td style="border: 1px solid #000; padding: 8px;">${
            edu.institution || "N/A"
          }</td>
          <td style="border: 1px solid #000; padding: 8px;">
            ${edu.startDate ? new Date(edu.startDate).getFullYear() : ""}
            ${
              edu.endDateOrResultAwaited
                ? " - " +
                  (new Date(edu.endDateOrResultAwaited).getFullYear() ||
                    "Present")
                : ""
            }
          </td>
          <td style="border: 1px solid #000; padding: 8px;">${
            edu.obtainedMarks || "N/A"
          }/${edu.totalMarks || "N/A"}</td>
          <td style="border: 1px solid #000; padding: 8px;">${
            edu.percentage ? edu.percentage + "%" : "N/A"
          }</td>
        </tr>
      `,
            )
            .join("")
        : '<tr><td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: center;">No educational qualifications provided</td></tr>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${pdfStyles}
          .student-info { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; min-width: 120px; }
          .info-value { flex-grow: 1; }
          .page-break-avoid { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="university-header">
          <img src="${baseUrl}/cisd-logo.png" class="header-logo" onerror="this.style.display='none'" />
          <h1 class="university-name">CISD</h1>
          <div class="university-address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
        </div>
        <div class="document-title">ADMISSION APPLICATION PROFILE</div>
        <div class="section-header">Personal Information</div>
        <table class="data-table">
          <tr><td><strong>Full Name:</strong></td><td>${studentName}</td><td><strong>CNIC:</strong></td><td>${admissionData?.cnic || "N/A"}</td></tr>
          <tr><td><strong>Father's Name:</strong></td><td>${admissionData?.fatherName || "N/A"}</td><td><strong>Phone:</strong></td><td>${admissionData?.phone || "N/A"}</td></tr>
          <tr><td><strong>Date of Birth:</strong></td><td>${formatDatePDF(admissionData?.dob)}</td><td><strong>Gender:</strong></td><td>${admissionData?.gender || "N/A"}</td></tr>
          <tr><td><strong>Email Address:</strong></td><td>${userData?.email || "N/A"}</td><td><strong>Applied Date:</strong></td><td>${formatDatePDF(admissionData?.createdAt)}</td></tr>
        </table>
        <div class="section-header">Academic Information</div>
        <table class="data-table">
          <tr><td><strong>Program:</strong></td><td>${programName}</td><td><strong>Department:</strong></td><td>${departmentName}</td></tr>
          <tr><td><strong>Session:</strong></td><td>${sessionName}</td><td><strong>Status:</strong></td><td style="text-transform: uppercase;">${admissionData?.status || "N/A"}</td></tr>
          ${registrationNo ? `<tr><td><strong>Registration No:</strong></td><td colspan="3">${registrationNo}</td></tr>` : ""}
        </table>
        <div class="section-header">Family Information</div>
        <table class="data-table">
          <tr><td><strong>Father's CNIC:</strong></td><td>${admissionData?.fathernic || "N/A"}</td><td><strong>Father's Profession:</strong></td><td>${admissionData?.fathersProfession || "N/A"}</td></tr>
          <tr><td><strong>Mother's Name:</strong></td><td colspan="3">${admissionData?.motherName || "N/A"}</td></tr>
        </table>
        <div class="section-header">Address Details</div>
        <div class="address-section">
          <div class="address-box">
            <div class="address-title">Current Address</div>
            <div style="margin-bottom: 5px;"><strong>Address:</strong> ${admissionData?.currentAddress || "N/A"}</div>
            <div style="margin-bottom: 5px;"><strong>District:</strong> ${admissionData?.currentDistrict || "N/A"}</div>
            <div style="margin-bottom: 5px;"><strong>Province:</strong> ${admissionData?.currentProvince || "N/A"}</div>
            <div><strong>Country:</strong> ${admissionData?.currentCountry || "N/A"}</div>
          </div>
          <div class="address-box">
            <div class="address-title">Permanent Address</div>
            <div style="margin-bottom: 5px;"><strong>Address:</strong> ${admissionData?.permanentAddress || "N/A"}</div>
            <div style="margin-bottom: 5px;"><strong>District:</strong> ${admissionData?.permanentDistrict || "N/A"}</div>
            <div style="margin-bottom: 5px;"><strong>Province:</strong> ${admissionData?.permanentProvince || "N/A"}</div>
            <div><strong>Country:</strong> ${admissionData?.permanentCountry || "N/A"}</div>
          </div>
        </div>
        <table class="data-table">
          <tr><td><strong>Mother's CNIC:</strong></td><td>${admissionData?.motherCnic || "N/A"}</td><td><strong>Guardian Phone:</strong></td><td>${admissionData?.guardianPhone || "N/A"}</td></tr>
          <tr><td><strong>Family Income:</strong></td><td colspan="3">${admissionData?.incomeBracket || "N/A"}</td></tr>
        </table>
        <div class="section-header">Academic Qualifications</div>
        <table class="data-table page-break-avoid">
          <thead><tr><th>Degree/Program</th><th>Institution</th><th>Duration</th><th>Marks Obtained</th><th>Percentage</th></tr></thead>
          <tbody>${educationRows}</tbody>
        </table>
      </body>
      </html>
    `;
  }, [admissionData, userData, getName, formatDatePDF, pdfStyles]);

  // Captured as its OWN separate image (see generateUniversityPDF) so the
  // signature block can be placed as a whole — either right after the main
  // content on its last page, or moved entirely to a fresh page — instead
  // of being sliced in half whenever it happened to straddle a page-height
  // cutoff, which is what was happening when this was part of one long
  // captured image.
  const signatureFooterHtml = useMemo(() => {
    if (!admissionData) return "";
    const baseUrl = window.location.origin;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${pdfStyles}
        </style>
      </head>
      <body>
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-area"></div>
            <div class="signature-line"></div>
            <div style="font-weight: bold;">Student's Signature</div>
            <div>${admissionData?.fullName || "Applicant"}</div>
            <div>Date: ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="signature-box">
            <div class="signature-area">
              <img src="${baseUrl}/admission-sign.png" class="sign-img" onerror="this.style.display='none'" />
            </div>
            <div class="signature-line"></div>
            <div style="font-weight: bold;">Admission Officer</div>
            <div>CISD</div>
          </div>
        </div>

        <div class="footer">
          <div style="margin-bottom: 5px;">This document is computer-generated and valid without signature. Authenticity can be verified online at verification.cisd.edu.pk</div>
          <div style="color: #666;">Document generated by CISD Digital Admission System | © ${new Date().getFullYear()} CISD. All rights reserved.</div>
        </div>
      </body>
      </html>
    `;
  }, [admissionData, pdfStyles]);

  const generateSimplifiedPDF = () => {
    const pdf = new jsPDF();
    pdf.setFillColor(0, 51, 102);
    pdf.rect(0, 0, 210, 30, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text("CISD", 105, 15, { align: "center" });

    pdf.setFontSize(10);
    pdf.text("Excellence in Education, Excellence in Life", 105, 22, {
      align: "center",
    });

    pdf.setFontSize(18);
    pdf.setTextColor(0, 51, 102);
    pdf.text("ADMISSION PROFILE", 105, 45, { align: "center" });

    pdf.setDrawColor(0, 51, 102);
    pdf.setLineWidth(0.5);
    pdf.rect(20, 55, 170, 30);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Student Information", 25, 65);

    pdf.setFont("helvetica", "normal");
    const infoLines = [
      `Name: ${admissionData?.fullName || "N/A"}`,
      `Program: ${getName(admissionData?.applyingForProgram)}`,
      `Status: ${admissionData?.status?.toUpperCase() || "PENDING"}`,
    ];

    infoLines.forEach((line, index) => {
      pdf.text(line, 30, 75 + index * 5);
    });

    const fileName = `CISD_Profile_${admissionData?.fullName?.replace(/\s+/g, "_")}.pdf`;
    pdf.save(fileName);
  };

  const renderToCanvas = async (html, containerEl) => {
    containerEl.innerHTML = html;
    document.body.appendChild(containerEl);
    return html2canvas(containerEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      imageTimeout: 30000,
      width: 794,
      height: containerEl.scrollHeight,
      windowWidth: 794,
      onclone: (clonedDoc) => {
        const body = clonedDoc.querySelector("body");
        if (body) {
          body.style.fontFamily = "Arial, sans-serif";
          body.style.color = "#000000";
        }
      },
    });
  };

  const generateUniversityPDF = async () => {
    setIsGenerating(true);
    setPdfProgress(0);

    // Padding lives on THIS real container element, not on a `body { }`
    // CSS rule — `createEnhancedPDFContent`/`signatureFooterHtml` are full
    // "<html><body>...</body></html>" strings fed through `.innerHTML` on a
    // plain <div>, and per the HTML fragment-parsing algorithm the browser
    // uses for that, the <html>/<body> tags themselves are dropped (only
    // their children survive) — so a `body { padding: ... }` rule had no
    // real element left to ever match, and content was rendering flush
    // against this container's own (previously unpadded) edges.
    const mainContainer = document.createElement("div");
    mainContainer.style.cssText = `
      position: fixed; top: -10000px; left: -10000px; width: 210mm;
      background: #ffffff; font-family: Arial, sans-serif; box-sizing: border-box;
      padding: 15mm 20mm; line-height: 1.2; z-index: 10000; color: #000000;
    `;
    // Smaller top padding than the main container — this block most often
    // lands right after the main content on the same page, where a full
    // 15mm on top of the main content's own bottom padding would leave an
    // oversized gap before the signatures.
    const sigContainer = document.createElement("div");
    sigContainer.style.cssText = `
      position: fixed; top: -10000px; left: -10000px; width: 210mm;
      background: #ffffff; font-family: Arial, sans-serif; box-sizing: border-box;
      padding: 6mm 20mm 15mm 20mm; line-height: 1.2; z-index: 10000; color: #000000;
    `;

    try {
      setPdfProgress(10);

      await new Promise((resolve) => {
        setPdfProgress(20);
        setTimeout(resolve, 800);
      });

      setPdfProgress(40);
      // Rendered and captured as two SEPARATE images — the main content
      // (which can freely slice across pages, that's fine for tables/text)
      // and the signature+footer block on its own. Keeping the signature
      // block as a single image is what lets it be placed as a whole
      // instead of being cut in half wherever it happened to land relative
      // to a page-height boundary.
      const [mainCanvas, sigCanvas] = await Promise.all([
        renderToCanvas(createEnhancedPDFContent, mainContainer),
        renderToCanvas(signatureFooterHtml, sigContainer),
      ]);

      setPdfProgress(70);
      const imgWidth = 210;
      const pageHeight = 297;
      const mainImgHeight = (mainCanvas.height * imgWidth) / mainCanvas.width;
      const sigImgHeight = (sigCanvas.height * imgWidth) / sigCanvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const mainImgData = mainCanvas.toDataURL("image/png", 1.0);
      const sigImgData = sigCanvas.toDataURL("image/png", 1.0);

      // Slice the main content across as many pages as it needs (same
      // shifted-offset technique as before — acceptable here since it's
      // just tables/text, not the signature block).
      let heightLeft = mainImgHeight;
      let position = 0;
      pdf.addImage(mainImgData, "PNG", 0, position, imgWidth, mainImgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - mainImgHeight;
        pdf.addPage();
        pdf.addImage(mainImgData, "PNG", 0, position, imgWidth, mainImgHeight);
        heightLeft -= pageHeight;
      }

      // How much of the LAST page the main content actually used, so the
      // signature block can either continue right after it on that same
      // page, or — if it wouldn't fully fit — start cleanly at the top of
      // a brand new page instead of being split across the two.
      const usedOnLastPage =
        mainImgHeight % pageHeight === 0
          ? pageHeight
          : mainImgHeight % pageHeight;
      const remainingOnLastPage = pageHeight - usedOnLastPage;

      if (remainingOnLastPage >= sigImgHeight) {
        pdf.addImage(sigImgData, "PNG", 0, usedOnLastPage, imgWidth, sigImgHeight);
      } else {
        pdf.addPage();
        pdf.addImage(sigImgData, "PNG", 0, 0, imgWidth, sigImgHeight);
      }

      pdf.setProperties({
        title: `Admission Profile - ${admissionData?.fullName}`,
        subject: "University Admission Application",
        author: "CISD",
        creator: "CISD Digital Admission System",
      });

      const fileName = `CISD_Admission_${admissionData?.fullName?.replace(/\s+/g, "_")}_${admissionData?.applicationNo || "DRAFT"}.pdf`;
      pdf.save(fileName);

      setPdfProgress(100);
    } catch (err) {
      try {
        generateSimplifiedPDF();
      } catch (fallbackErr) {
        alert("PDF generation failed. Try Again");
      }
    } finally {
      mainContainer.remove();
      sigContainer.remove();
      setIsGenerating(false);
      setPdfProgress(0);
    }
  };

  const generatePDFWithFallback = async () => {
    try {
      await generateUniversityPDF();
    } catch (error) {
      alert("Failed to generate PDF. Please try again or contact support.");
      generateSimplifiedPDF();
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-xl overflow-hidden border-0">
          <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center text-white relative">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg">
                {userData?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {userData?.name || "Student"}
                </h1>
                <p className="text-sm text-blue-200 opacity-90">
                  {userData?.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    Student Portal
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={dispatchAuthLogout}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm border border-white/20 backdrop-blur-sm transition-all hover:scale-105"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {!admissionData && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center transform transition-all hover:scale-[1.01]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 mb-6">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                Start Your Academic Journey
              </h3>
              <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
                Begin your path to excellence by submitting your admission
                application. Join the CISD community
                today.
              </p>
              <button
                onClick={navigateToAdmission}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 hover:shadow-xl"
              >
                Apply for Admission
              </button>
            </div>
          )}

          {admissionData && admissionData.status === "draft" && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-l-4 border-yellow-500 p-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600 mb-6 shadow-md">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Application In Progress
              </h2>
              <p className="text-gray-700 text-lg mb-6">
                You have a saved draft (Completed Step{" "}
                {admissionData.currentStep || 1} of 4).
                <br />
                Continue to complete your submission and secure your place.
              </p>
              <button
                onClick={navigateToAdmission}
                className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Continue Application
              </button>
            </div>
          )}

          {admissionData && admissionData.status !== "draft" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h1 className="text-2xl font-bold text-gray-900">
                            Admission Profile
                          </h1>
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${admissionData.status === "approved" ? "bg-green-50 text-green-700" : admissionData.status === "rejected" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}
                          >
                            {admissionData.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setShowApplicationDetails(!showApplicationDetails)
                          }
                          className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {showApplicationDetails
                            ? "Hide Details"
                            : "View Details"}
                        </button>
                        <button
                          onClick={generatePDFWithFallback}
                          disabled={isGenerating}
                          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <span className="animate-spin">⟳</span> Generating
                              PDF...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>{" "}
                              Download PDF
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          {safeImages.photo && (
                            <div className="relative">
                              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                <img
                                  src={safeImages.photo}
                                  alt="Student"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${admissionData.fullName}&background=blue&color=fff&size=96`;
                                  }}
                                />
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                CISD
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {admissionData.fullName}
                            </h2>
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>
                                  Applied:{" "}
                                  <strong>
                                    {formatDate(admissionData.createdAt)}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-500 mb-2">
                            Application Status
                          </div>
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${admissionData.status === "approved" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" : admissionData.status === "rejected" ? "bg-gradient-to-r from-red-500 to-rose-500 text-white" : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"}`}
                          >
                            {admissionData.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {showApplicationDetails && (
                      <div className="animate-fade-in space-y-8">
                        <AdmissionStatusCard admissionData={admissionData} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              Personal Information
                            </h3>
                            <div className="space-y-3">
                              <EnhancedInfoRow
                                label="Full Name"
                                value={admissionData.fullName}
                              />
                              <EnhancedInfoRow
                                label="Father's Name"
                                value={admissionData.fatherName}
                              />
                              <EnhancedInfoRow
                                label="CNIC"
                                value={admissionData.cnic}
                              />
                              <EnhancedInfoRow
                                label="Date of Birth"
                                value={formatDate(admissionData.dob)}
                              />
                              <EnhancedInfoRow
                                label="Gender"
                                value={admissionData.gender}
                              />
                              <EnhancedInfoRow
                                label="Phone"
                                value={admissionData.phone}
                              />
                              <EnhancedInfoRow
                                label="Email"
                                value={userData?.email}
                              />
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              Academic Information
                            </h3>
                            <div className="space-y-3">
                              <EnhancedInfoRow
                                label="Program"
                                value={getName(
                                  admissionData.applyingForProgram,
                                )}
                              />
                              <EnhancedInfoRow
                                label="Department"
                                value={getName(
                                  admissionData.academicDepartment,
                                )}
                              />
                              <EnhancedInfoRow
                                label="Session"
                                value={getName(admissionData.applyingSession)}
                              />
                              <EnhancedInfoRow
                                label="Applied Date"
                                value={formatDate(admissionData.createdAt)}
                              />
                              <EnhancedInfoRow
                                label="Current Status"
                                value={admissionData.status}
                              />
                              <EnhancedInfoRow
                                label="Application Mode"
                                value={
                                  admissionData.applicationMode || "Online"
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.205a8.959 8.959 0 01-4.5 1.194"
                              />
                            </svg>
                            Family Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <EnhancedInfoCard
                              label="Father's CNIC"
                              value={admissionData.fathernic}
                            />
                            <EnhancedInfoCard
                              label="Mother's Name"
                              value={admissionData.motherName}
                            />
                            <EnhancedInfoCard
                              label="Mother's CNIC"
                              value={admissionData.motherCnic}
                            />
                            <EnhancedInfoCard
                              label="Guardian Phone"
                              value={admissionData.guardianPhone}
                            />
                            <EnhancedInfoCard
                              label="Family Income"
                              value={admissionData.incomeBracket}
                            />
                            <EnhancedInfoCard
                              label="Father's Profession"
                              value={admissionData.fathersProfession}
                            />
                          </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Address Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                </svg>
                                Current Address
                              </h4>
                              <div className="space-y-2">
                                <InfoDetail
                                  label="Address"
                                  value={admissionData.currentAddress}
                                />
                                <InfoDetail
                                  label="District"
                                  value={admissionData.currentDistrict}
                                />
                                <InfoDetail
                                  label="Province"
                                  value={admissionData.currentProvince}
                                />
                                <InfoDetail
                                  label="Country"
                                  value={admissionData.currentCountry}
                                />
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                  />
                                </svg>
                                Permanent Address
                              </h4>
                              <div className="space-y-2">
                                <InfoDetail
                                  label="Address"
                                  value={admissionData.permanentAddress}
                                />
                                <InfoDetail
                                  label="District"
                                  value={admissionData.permanentDistrict}
                                />
                                <InfoDetail
                                  label="Province"
                                  value={admissionData.permanentProvince}
                                />
                                <InfoDetail
                                  label="Country"
                                  value={admissionData.permanentCountry}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {admissionData?.educationDetails?.length > 0 && (
                          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 14l9-5-9-5-9 5 9 5z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 14l9-5-9-5-9 5 9 5z"
                                  opacity="0.5"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 14l9-5-9-5-9 5 9 5z"
                                  opacity="0.25"
                                />
                              </svg>
                              Educational Qualifications
                            </h3>
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                  <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      Degree
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      Institute
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      Start Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      End Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      Marks
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      Percentage
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                  {admissionData.educationDetails.map(
                                    (edu, index) => (
                                      <tr
                                        key={index}
                                        className="hover:bg-blue-50 transition-colors"
                                      >
                                        <td className="px-6 py-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {edu.educationProgram}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm text-gray-900">
                                            {edu.institution}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm text-gray-900">
                                            {edu.startDate
                                              ? formatDate(edu.startDate)
                                              : "N/A"}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm text-gray-900">
                                            {edu.endDateOrResultAwaited
                                              ? formatDate(
                                                  edu.endDateOrResultAwaited,
                                                )
                                              : "N/A"}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm font-semibold text-gray-900">
                                            {edu.obtainedMarks}/{edu.totalMarks}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${edu.percentage >= 80 ? "bg-green-100 text-green-800" : edu.percentage >= 60 ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
                                          >
                                            {edu.percentage}%
                                          </span>
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <DocumentCard
                              label="Student Photo"
                              url={safeImages.photo || admissionData.photoFile}
                              index="photo"
                            />
                            {admissionData.docs?.map((url, i) => (
                              <DocumentCard
                                key={i}
                                label={documentLabels[i] || `Document ${i + 1}`}
                                url={safeImages.docs[i] || url}
                                index={i}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-6 sticky top-8">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Application Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Submission Date
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatDate(admissionData.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-64">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Challan
                    </h3>
                    {challanData ? (
                      <EnhancedChallanCard
                        challan={challanData}
                        onPrintClick={handlePrintChallan}
                        getName={getName}
                        admissionData={admissionData}
                      />
                    ) : (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium mb-1">
                          No fee challans generated yet.
                        </p>
                        <p className="text-sm text-gray-400">
                          Fee challans will appear here once generated.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EnhancedInfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors group">
    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
      {label}
    </span>
    <span
      className="text-sm font-semibold text-gray-900 text-right truncate max-w-[60%]"
      title={value}
    >
      {value || "N/A"}
    </span>
  </div>
);

const EnhancedInfoCard = ({ label, value }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
    <div className="text-sm font-medium text-gray-500 mb-1.5">{label}</div>
    <div className="text-lg font-bold text-gray-900 truncate" title={value}>
      {value || "N/A"}
    </div>
  </div>
);

const InfoDetail = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-500">{label}:</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const EnhancedChallanCard = ({
  challan,
  onPrintClick,
  getName,
  admissionData,
}) => {
  const isPaid = challan.status === "paid";
  const dateLabel = isPaid ? "Paid Date" : "Due Date";
  const dateValue = isPaid ? challan.updatedAt : challan.dueDate;

  let challanTypeFormatted = (challan.challanType || challan.type || "FEE")
    .replace(/_/g, " ")
    .toUpperCase();
  if (challanTypeFormatted.includes("FINAL EXAM")) {
    challanTypeFormatted = challanTypeFormatted.replace("FINAL EXAM", "EXAM");
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-5 pb-5 border-b border-gray-100">
        <div>
          <span className="inline-block text-xs font-semibold tracking-wide text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md mb-2">
            {challanTypeFormatted}
          </span>
          <p className="text-sm text-gray-500">
            Challan No. <span className="text-gray-800 font-medium">{challan.challanNo}</span>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-md text-xs font-semibold uppercase ${isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
        >
          {challan.status}
        </span>
      </div>

      <div className="space-y-3.5 mb-6">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-500">Amount</span>
          <span className="text-2xl font-bold text-gray-900">
            Rs. {(challan.netAmount || challan.amount || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Program</span>
          <span className="text-sm font-medium text-gray-800">
            {getName(admissionData?.applyingForProgram)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{dateLabel}</span>
          <span className="text-sm font-medium text-gray-800">
            {new Date(dateValue).toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {!isPaid && (
        <button
          onClick={onPrintClick}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print & Download Challan
        </button>
      )}

      {isPaid && challan.transactionRef && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700 font-medium">
              Transaction Reference
            </span>
            <span className="font-mono text-green-900">
              {challan.transactionRef}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentCard = ({ label, url, index }) => {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all flex items-center gap-3"
    >
      <div
        className={`h-10 w-10 flex-shrink-0 rounded flex items-center justify-center text-xl ${index === "photo" ? "bg-blue-50 text-blue-500" : "bg-gray-100 text-gray-500"}`}
      >
        {index === "photo" ? "👤" : "📄"}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
          {label}
        </p>
        <p className="text-xs text-blue-500">View File</p>
      </div>
    </a>
  );
};

export default ProfileView;
