import React from "react";
import { useChallanDetailController } from "../controller/useChallanDetailController";
import { baseUrl } from "../../base/baseurl";
import Logo from "../api/logo.png";

// ---------- Helpers -------------------------------------------------------
const pk = (n) =>
  (Number(n) || 0).toLocaleString("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });
const dashIfZero = (n) => (Number(n) > 0 ? pk(n) : "-");

// Fixed order/labels to mirror the attached challan exactly
const FIXED_ROWS = [
  { key: "admissionFee", label: "ADMISSION FEE" },
  { key: "tuitionFee", label: "TUITION FEE" },
  { key: "hostelTransport", label: "HOSTEL/TRANSPORT CHARGES" },
  { key: "miscFee", label: "MISC. CHARGES (FORM FEE)" },
  { key: "registrationFee", label: "REGISTRATION FEE" },
  { key: "fbiseExamFee", label: "FBISE EXAM FEE" },
  { key: "studentFund", label: "STUDENT FUND" },
  { key: "universityExamFee", label: "UNIVERSITY EXAMINATION FEE" },
  { key: "lateFee", label: "LATE FEE FINE" },
  { key: "holidayFine", label: "HOLIDAY FINE" },
  { key: "securityFee", label: "SECURITY DEPOSIT" },
];

// Single slip strictly styled to fit 3-up row on A4
const ChallanSlip = ({ copyLabel, meta, rows, totals }) => {
  // Filter out rows with zero amount to only show fees that exist
  const visibleRows = rows.filter((row) => row.amount > 0);

  return (
    <div className="h-full w-full rounded-md border border-gray-700 p-2 print:shadow-none">
      {/* Top ribbon */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-1">
        <h2 className="text-[13px] font-extrabold tracking-wide">
          FEE CHALLAN FORM
        </h2>
        <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] font-bold uppercase">
          {copyLabel}
        </span>
      </div>

      {/* Meta grid (exact fields from template) */}
      <div className="mt-1 flex justify-center items-center item gap-x-2 gap-y-0.5 text-[10px] leading-4">
        <img
          style={{
            height: "120px",
            objectFit: "cover",
          }}
          src={Logo}
          alt=""
        />
        <div className="p-1">
          <div className="font-semibold uppercase">FAYSAL BANK LIMITED</div>
          <div className="leading-4">BANK ACCOUNT# 3196301000003087</div>
          <div className="leading-4">
            Branch Adress: Sea Square, Main G.T Road Gate 1, B-17 Islamabad
          </div>
          <div className="leading-4">
            The Challan is payable at any branch of FAYSAL BANK LIMITED
          </div>
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] leading-4 border p-1 border-gray-700">
        <div>
          <span className="font-semibold">ISSUE DATE</span>{" "}
          {meta.issueDate || "—"}
        </div>
        <div>
          <span className="font-semibold">STUDENT NAME</span>{" "}
          {meta.studentName || "—"}
        </div>
        <div>
          <span className="font-semibold">Expiry Date</span>{" "}
          {meta.expiryDate || meta.dueDate || "—"}
        </div>
        <div>
          <span className="font-semibold">FATHER NAME</span>{" "}
          {meta.fatherName || "—"}
        </div>

        <div>
          <span className="font-semibold">CHALLAN NO.</span>{" "}
          {meta.challanNo || "—"}
        </div>

        <div>
          <span className="font-semibold">ACADEMIC YEAR:</span>{" "}
          {meta.academicYear || 0}
        </div>
      </div>

      {/* Amount rows - only show rows with amount > 0 */}
      <div className="mt-1 border border-gray-700">
        {visibleRows.length > 0 ? (
          visibleRows.map((r, i) => (
            <div
              key={r.label}
              className={`flex items-center justify-between px-2 ${
                i !== 0 ? "border-t border-gray-700" : ""
              }`}
            >
              <div className="py-1 text-[11px]">{r.label}</div>
              <div className="py-1 text-[11px] font-semibold tabular-nums">
                {dashIfZero(r.amount)}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-between px-2 py-2">
            <div className="py-1 text-[11px] text-gray-500">No fee items</div>
            <div className="py-1 text-[11px] font-semibold tabular-nums text-gray-500">
              -
            </div>
          </div>
        )}

        {/* Grand total - only show if there are visible rows */}
        {visibleRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-700 bg-gray-100 px-2">
            <div className="py-1 text-[11px] font-extrabold">GRAND TOTAL</div>
            <div className="py-1 text-[12px] font-extrabold tabular-nums">
              {pk(totals.grand)}
            </div>
          </div>
        )}
      </div>

      {/* Bank & notes section to match template text blocks */}
      <div className="mt-1 grid grid-cols-1 gap-1 text-[10px]">
        <div className="border border-gray-700 p-1">
          <div className="leading-4">
            After due date late fee Rs.500/day will be charged
          </div>
          <div className="leading-4">
            Note: Only Cash & Faysal Bank Limited Cheque/ Payorder will be
            accepted and Fees is Non-refundable
          </div>
          <div className="leading-4">
            It is directed by Registrar that after due date you will not be
            allowed to sit in remaining Mid Term exams
          </div>
        </div>
      </div>

      {/* Signatures row */}
      <div className="mt-1 flex justify-between gap-1 text-[10px] py-1">
        <div className="grid h-16 w-36 place-items-center border border-gray-700 text-center">
          <div></div>
          <span className="mt-12">Banker`s Sign & Stamp</span>
        </div>
        <div className="grid h-16 w-36 place-items-center border border-gray-700 text-center">
          <div></div>
          <span className="mt-12">Authrozied Signature</span>
        </div>
      </div>
    </div>
  );
};

const ChallanDetail = () => {
  const { challan, isLoading, isError, notFound } =
    useChallanDetailController();

  if (isLoading)
    return <div className="text-center py-8">Loading challan details...</div>;
  if (isError)
    return (
      <div className="text-center py-8 text-red-500">Error loading challan</div>
    );
  if (notFound)
    return <div className="text-center py-8">Challan not found</div>;



  const studentData = challan?.admissionId;
  const items = challan?.items || [];

  // Calculate totals from items array
  const totalAmount =
    challan?.total ||
    items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Map items to the fixed row structure
  const rowAmounts = {
    admissionFee: items.find((item) => item.code === "ADM_FEE")?.amount || 0,
    tuitionFee: items.find((item) => item.code === "TUITION_FEE")?.amount || 0,
    hostelTransport:
      (items.find((item) => item.code === "HOSTEL_FEE")?.amount || 0) +
      (items.find((item) => item.code === "TRANSPORT_FEE")?.amount || 0),
    miscFee: items.find((item) => item.code === "MISC_FEE")?.amount || 0,
    registrationFee: items.find((item) => item.code === "REG_FEE")?.amount || 0,
    fbiseExamFee: items.find((item) => item.code === "FBISE_FEE")?.amount || 0,
    studentFund:
      items.find((item) => item.code === "STUDENT_FUND")?.amount || 0,
    universityExamFee:
      items.find((item) => item.code === "EXAM_FEE")?.amount || 0,
    lateFee: items.find((item) => item.code === "LATE_FEE")?.amount || 0,
    holidayFine:
      items.find((item) => item.code === "HOLIDAY_FINE")?.amount || 0,
    securityFee:
      items.find((item) => item.code === "SECURITY_FEE")?.amount || 0,
  };

  const rows = FIXED_ROWS.map(({ key, label }) => ({
    label,
    amount: Number(rowAmounts[key]) || 0,
  }));

  const subtotal = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const grand = subtotal;

  // Map meta data from challan and admission
  const meta = {
    issueDate: challan?.issuedAt
      ? new Date(challan.issuedAt).toLocaleDateString()
      : challan?.createdAt
      ? new Date(challan.createdAt).toLocaleDateString()
      : "",
    dueDate: challan?.dueDate
      ? new Date(challan.dueDate).toLocaleDateString()
      : "",
    expiryDate: challan?.dueDate
      ? new Date(challan.dueDate).toLocaleDateString()
      : "",
    studentName: studentData?.fullName,
    fatherName: studentData?.fatherName,
    regNo: studentData?.registrationNumber || "N/A",
    challanNo: challan?.challanNo,
    program:
      studentData?.applyingForProgram?.name ||
      studentData?.academicDepartment ||
      "N/A",
    semester: 1, // Default to 1 since we don't have semester data
    academicYear: new Date().getFullYear(),
    installment: 1, // Default to 1
  };

  // Copy labels exactly like the template footer order
  const copies = ["STUDENT COPY", "BANK COPY", "OFFICE COPY"];

  const handleDownload = () => {
    if (!challan?.challanName) return;
    const pdfUrl = `${baseUrl}/uploads/challans/${challan.challanName}`;
    const w = window.open(pdfUrl, "_blank", "noopener,noreferrer");
    if (w) w.opener = null;
  };

  // Print ONLY the challan grid (not whole page)
  const handlePrintOnlyChallan = () => {
    const styleId = "challan-print-style";
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.type = "text/css";
      style.innerHTML = `@media print { body * { visibility: hidden !important; } #challan-print, #challan-print * { visibility: visible !important; } #challan-print { position: absolute; left: 0; top: 0; width: 100%; } }`;
      document.head.appendChild(style);
    }
    window.print();
  };

  return (
    <div className="mx-auto max-w-[1180px] p-3 print:p-1">
      {/* Header actions */}
      <div className="mb-3 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-bold">CISD — Fee Challan</h1>
        <div className="flex gap-2">
          {challan?.challanName && (
            <button
              onClick={handleDownload}
              className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Download Server PDF
            </button>
          )}
          <button
            onClick={handlePrintOnlyChallan}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Print Challan Only
          </button>
        </div>
      </div>

      {/* Status info - only show in non-print view */}
      <div className="mb-4 print:hidden">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            challan?.status === "paid"
              ? "bg-green-100 text-green-800"
              : challan?.status === "pending" || challan?.status === "issued"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {challan?.status?.toUpperCase() || "UNKNOWN"}
        </span>
        <p className="text-xs text-gray-500 mt-1">
          Created:{" "}
          {challan?.createdAt
            ? new Date(challan.createdAt).toLocaleDateString()
            : "N/A"}
          {challan?.dueDate &&
            ` • Due: ${new Date(challan.dueDate).toLocaleDateString()}`}
        </p>
      </div>

      {/* PRINT TARGET — Single row, 3 columns EXACTLY */}
      <div
        id="challan-print"
        className="grid grid-cols-1 gap-2 overflow-x-auto print:grid-cols-3 print:gap-2 md:grid-cols-3"
      >
        {copies.map((label) => (
          <div key={label} className="min-w-[360px] print:min-w-0">
            <ChallanSlip
              copyLabel={label}
              meta={meta}
              rows={rows}
              totals={{ grand }}
            />
          </div>
        ))}
      </div>

      {/* Print hints (screen only) */}
      <div className="mt-2 text-center text-[10px] text-gray-500 print:hidden">
        Tip: Use A4, Default margins, enable Background graphics.
      </div>
    </div>
  );
};

export default ChallanDetail;
