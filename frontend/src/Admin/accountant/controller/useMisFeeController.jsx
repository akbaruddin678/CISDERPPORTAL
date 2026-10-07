import { useState, useEffect, useCallback } from "react";
import { useLazyGetStudentsByDepartmentNameQuery } from "../api/accountantstudentApi";
import {
  useLazyGetChallansByStudentIdQuery,
  useGenerateGeneralChallanMutation,
  useMarkChallanAsPaidMutation,
  useDeleteChallanMutation,
} from "../api/studentChallanApi";

const useMisFeeController = () => {
  const [fetchStudentsTrigger, { isFetching: fetchingStudents }] =
    useLazyGetStudentsByDepartmentNameQuery();
  const [fetchChallansTrigger, { isFetching: fetchingChallans }] =
    useLazyGetChallansByStudentIdQuery();
  const [generateChallan, { isLoading: isGenerating }] =
    useGenerateGeneralChallanMutation();
  const [markChallanPaid, { isLoading: isPaying }] =
    useMarkChallanAsPaidMutation();
  const [deleteChallan, { isLoading: isDeleting }] = useDeleteChallanMutation();

  const [challans, setChallans] = useState([]);
  const [studentsList, setStudentsList] = useState([]);

  const [formData, setFormData] = useState({
    category: "Tevta",
    studentRegNo: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const [payModalId, setPayModalId] = useState(null);
  const [detailModalData, setDetailModalData] = useState(null);
  const [deleteModalId, setDeleteModalId] = useState(null);

  const loadStudents = useCallback(async () => {
    try {
      const { data, isSuccess } =
        await fetchStudentsTrigger("External Affairs");
      if (isSuccess && data?.data) {
        setStudentsList(data.data);
        if (data.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            studentRegNo: data.data[0].studentId,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  }, [fetchStudentsTrigger]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadRecords = useCallback(
    async (regNo) => {
      if (!regNo) return setChallans([]);
      try {
        const { data, isSuccess } = await fetchChallansTrigger(regNo);
        if (isSuccess && data?.data?.challans) {
          setChallans(data.data.challans);
        }
      } catch (err) {
        console.error("Failed to load records", err);
      }
    },
    [fetchChallansTrigger],
  );

  useEffect(() => {
    if (formData.studentRegNo) loadRecords(formData.studentRegNo);
  }, [formData.studentRegNo, loadRecords]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentRegNo)
      return alert("Please select an organization/student first.");

    try {
      const payload = {
        studentRegNo: formData.studentRegNo,
        amount: formData.amount,
        dueDate: formData.dueDate,
        category: formData.category,
        remarks: formData.remarks,
      };

      const res = await generateChallan(payload).unwrap();
      if (res.success) {
        alert("Receipt Generated Successfully!");
        setFormData((prev) => ({ ...prev, amount: "", remarks: "" }));
        loadRecords(formData.studentRegNo);
      }
    } catch (error) {
      alert(error.data?.message || "Failed to generate receipt");
    }
  };

  const handlePay = async (formDataPayload) => {
    try {
      await markChallanPaid({
        id: payModalId,
        formData: formDataPayload,
      }).unwrap();
      alert("Payment successful & receipt saved!");
      setPayModalId(null);
      loadRecords(formData.studentRegNo);
    } catch (err) {
      alert(err.data?.message || "Failed to mark as paid");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteChallan({ id: deleteModalId }).unwrap();
      alert("Challan Voided Successfully");
      setDeleteModalId(null);
      loadRecords(formData.studentRegNo);
    } catch (err) {
      alert(err.data?.message || "Failed to void challan");
    }
  };

  // ==========================================
  // 4. RESTORED & IMPROVED PRINT LOGIC
  // ==========================================
  const handlePrint = (challan) => {
    const printWindow = window.open("", "_blank");

    // Base Assets
    const LOGO_URL = window.location.origin + "/cisd-logo.png";
    const SIGN_URL = window.location.origin + "/neisign.jpeg";
    const STAMP_URL = window.location.origin + "/neistamp.jpeg";
    const ONEBILL_URL = window.location.origin + "/onelink.png"; // Restored 1Bill Logo

    const fmtPKR = (val) => Number(val).toLocaleString("en-PK");
    const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB");

    // Dynamic Student/Org Data
    const realStudentName =
      challan.studentId?.personalInfo?.fullName || "Organization";
    const realStudentRegNo = challan.studentId?.studentId || "N/A";

    // ✅ EXACTLY AS REQUESTED: Use the Student/Org name for the fee label
    const exactFeeTitle = `${realStudentName} Fee`;

    // 1Bill Invoice Format
    const invoiceSuffix =
      challan.paymentReference ||
      (challan.challanNo || "0000").replace(/\D/g, "");
    const fullOneBillId = `101340${invoiceSuffix}`;

    let institutionHeader = "CISD";
    if (
      realStudentName.toLowerCase().includes("tevta") ||
      formData.category === "Tevta"
    )
      institutionHeader = "TEVTA - CISD";
    if (
      realStudentName.toLowerCase().includes("john safe") ||
      formData.category === "John Safe Foundation"
    )
      institutionHeader = "JOHN SAFE FOUNDATION";

    const buildChallanCard = (copyTitle) => `
      <div class="challan-card">
        <div class="copy-label">${copyTitle}</div>
        <div class="bank-name-main">${institutionHeader}</div>
        <div class="challan-header">
          <div class="logo-container"><img src="${LOGO_URL}" class="logo-img" onerror="this.style.display='none'" /></div>
          
          <div class="header-content">
            <div class="fee-challan-title">ORGANIZATION FEE RECEIPT</div>
            <div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
            
            <div class="onebill-box">
               <div class="onebill-label">1Bill Invoice No.</div>
               <div class="onebill-id">${fullOneBillId}</div>
            </div>
          </div>
          
          <div class="logo-container"><img src="${ONEBILL_URL}" class="logo-img" onerror="this.style.display='none'" /></div>
        </div>
        
        <div class="separator-line"></div>
        <div class="info-section">
          <table class="info-table">
            <tr>
              <td class="info-label">Due Date</td><td class="info-value" style="color:red; font-weight:bold;">${fmtDate(challan.dueDate)}</td>
              <td class="info-label">Reg No</td><td class="info-value">${realStudentRegNo}</td>
            </tr>
            <tr>
              <td class="info-label">Organization</td><td class="info-value">${realStudentName}</td>
              <td class="info-label">Status</td><td class="info-value" style="text-transform:uppercase; font-weight:bold;">${challan.status}</td>
            </tr>
            <tr>
              <td class="info-label">Challan No</td><td class="info-value" colspan="3">${challan.challanNo}</td>
            </tr>
          </table>
        </div>
        
        <div class="separator-line"></div>
        <div class="content-area">
          <div class="fee-details-title">FEE DETAILS</div>
          <div class="table-container">
            <table class="fee-table">
              <tr style="background:#f0f0f0;">
                <td class="fee-label" style="font-weight:900;">${exactFeeTitle}</td>
                <td class="fee-amount" style="font-weight:900;">PKR ${fmtPKR(challan.netAmount)}</td>
              </tr>
              <tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr>
              <tr class="total-row">
                <td class="fee-label">GRAND TOTAL</td>
                <td class="fee-amount">PKR ${fmtPKR(challan.netAmount)}</td>
              </tr>
            </table>
            ${challan.remarks ? `<div class="amount-in-words"><strong>Remarks:</strong> ${challan.remarks}</div>` : ""}
            
            <div class="footer-notes">
              <p><strong>Note: Pay the fee before due date.</strong></p>
              <p>1- Pay via 1Link/1-Bill, Banking Apps, ATMs, Easypaisa, JazzCash, etc.</p>
              <p>2- Direct deposit by visiting any bank branch nationwide.</p>
            </div>

          </div>
          
          <div class="signature-section">
             <div class="signature-box"><div class="signature-area"></div><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div>
             <div class="signature-box"><div class="signature-area"><img src="${STAMP_URL}" class="stamp-img" onerror="this.style.display='none'" /><img src="${SIGN_URL}" class="sign-img" onerror="this.style.display='none'" /></div><div class="signature-line"></div><div class="signature-label">ACCOUNTS OFFICER</div></div>
           </div>
        </div>
      </div>`;

    const htmlTemplate = `
      <!DOCTYPE html><html lang="en">
      <head><title>Receipt — ${challan.challanNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        @media print {
          @page { size: A4 landscape; margin: 0mm !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .challan-page { width: 297mm !important; height: 209mm !important; padding: 6mm !important; page-break-after: always; display: flex; flex-direction: column; justify-content: center; }
          .challan-row-container { display: flex !important; flex-direction: row !important; width: 100% !important; height: 100% !important; gap: 3mm !important; justify-content: space-between !important; align-items: stretch !important; page-break-inside: avoid !important; }
          .challan-card { flex: 1 !important; min-width: 0 !important; border: 0.5mm dashed #000 !important; background: white !important; position: relative !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
          .info-label, .fee-label { background-color: #f5f5f5 !important; }
          .total-row { background-color: #e0e0e0 !important; }
          .copy-label { padding: 2px 6px; background-color: #fff !important; border: 0.3mm solid #555 !important; color: #000 !important; }
          .footer-notes { background-color: #fffde7 !important; }
        }
        .challan-card { position: relative; display: flex; flex-direction: column; border: 1px dashed #333; }
        .copy-label { position: absolute; top: 5px; left: 5px; background: #e8e8e8; padding: 2px 7px; font-weight: bold; font-size: 8px; z-index: 10; border-radius: 2px; border: 0.2mm solid #555; }
        .bank-name-main { font-size: 13px; font-weight: bold; color: #1a237e; text-align: center; padding: 20px 6px 2px; letter-spacing: 0.2px; text-transform: uppercase; }
        .challan-header { display: flex; align-items: center; gap: 8px; padding: 2px 6px 6px; }
        .logo-container { flex-shrink: 0; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; }
        .logo-img { width: 45px; height: 45px; object-fit: contain; border-radius: 6px; }
        .header-content { flex: 1; text-align: center; }
        .fee-challan-title { font-size: 11px; font-weight: bold; color: #d32f2f; text-transform: uppercase; line-height: 1.2; margin-bottom: 2px; }
        .address { font-size: 8.5px; color: #333; line-height: 1.2; margin-bottom: 3px; }
        .onebill-box { margin-top: 4px; border: 2px solid #000; padding: 3px 5px; background: #e0f7fa; display: inline-block; }
        .onebill-label { font-size: 7px; font-weight: bold; text-transform: uppercase; }
        .onebill-id { font-size: 13px; font-weight: bold; letter-spacing: 1px; }
        .separator-line { border-top: 0.5mm solid #000; margin: 4px 0; flex-shrink: 0; }
        .info-section { padding: 0 6px; flex-shrink: 0; }
        .info-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
        .info-table td { border: 0.4mm solid #000; padding: 3px 4px; vertical-align: middle; word-wrap: break-word; }
        .info-label { font-weight: bold; background: #f5f5f5; width: 22%; font-size: 8.5px; }
        .info-value { width: 28%; font-size: 8.5px; }
        .fee-details-title { text-align: center; font-size: 11px; font-weight: bold; margin: 5px 0 3px; text-decoration: underline; flex-shrink: 0; }
        .content-area { flex: 1; display: flex; flex-direction: column; padding: 0 6px; }
        .table-container { flex: 1; }
        .fee-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
        .fee-table td { border: 0.4mm solid #000; padding: 3px 4px; vertical-align: middle; }
        .fee-label { font-weight: bold; background: #f5f5f5; width: 70%; font-size: 8.5px; }
        .fee-amount { text-align: right; width: 30%; font-weight: bold; font-family: 'Courier New', monospace; padding-right: 6px; font-size: 8.5px; }
        .total-row { font-weight: bold; background: #e0e0e0; }
        .amount-in-words { font-size: 8.5px; margin: 4px 0; border: 0.4mm solid #ccc; padding: 3px 4px; background: #fafafa; }
        .footer-notes { margin: 4px 0; padding: 4px 5px; border: 0.4mm solid #000; background: #fffde7; font-size: 7.5px; line-height: 1.3; border-radius: 2px; }
        .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin: 6px 0 4px; padding-top: 4px; flex-shrink: 0; }
        .signature-box { text-align: center; width: 45%; position: relative; }
        .signature-line { width: 100%; border-top: 0.4mm solid #000; margin: 2px 0; }
        .signature-label { font-size: 8px; font-weight: bold; }
        .signature-area { height: 30px; position: relative; width: 100px; margin: 0 auto; }
        .stamp-img { position: absolute; top: -10px; left: 0; width: 100%; height: 45px; object-fit: contain; opacity: 0.4; z-index: 1;}
        .sign-img { position: absolute; top: 0px; left: 0; width: 100%; height: 30px; object-fit: contain; z-index: 10; }
      </style></head>
      <body>
        <div class="challan-page">
          <div class="challan-row-container">
            ${buildChallanCard("OFFICE COPY")}
            ${buildChallanCard("ORG COPY")}
            ${buildChallanCard("PAYER COPY")}
          </div>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 800); };</script>
      </body>
      </html>`;

    printWindow.document.write(htmlTemplate);
    printWindow.document.close();
  };

  return {
    formData,
    studentsList,
    handleChange,
    handleSubmit,
    loading: isGenerating,
    fetching: fetchingStudents || fetchingChallans,
    challans,
    payModalId,
    setPayModalId,
    handlePay,
    isPaying,
    detailModalData,
    setDetailModalData,
    deleteModalId,
    setDeleteModalId,
    handleDelete,
    isDeleting,
    handlePrint,
  };
};

export default useMisFeeController;
