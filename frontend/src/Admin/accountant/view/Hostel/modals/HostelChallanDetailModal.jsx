import React, { useState, useRef } from "react";
import {
  Modal,
  FormField,
  PrimaryBtn,
  SecondaryBtn,
  inputStyle,
  fmt,
  fmtDate,
  StatusBadge,
  ChallanTypeBadge,
} from "../../../common/Hostelshared";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Paperclip,
  X,
  Download,
  Printer,
} from "lucide-react";

export default function HostelChallanDetailModal({
  challan,
  onClose,
  onRefresh,
  onPay,
  paying,
  onUpdateFineDue,
  updFine,
  onDeleteChallan,
  deleting,
  onPrint,
}) {
  const c = challan;
  const isPaid = c.status === "paid";
  const isCancelled = c.status === "cancelled";

  const [tab, setTab] = useState("details");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payRemark, setPayRemark] = useState("");
  const [proofFile, setProofFile] = useState(null);

  const [newDueDate, setNewDueDate] = useState(
    c.dueDate ? c.dueDate.split("T")[0] : "",
  );
  const [fineAmt, setFineAmt] = useState(c.fineAmount ?? 0);
  const [apiMsg, setApiMsg] = useState({ type: "", text: "" });
  const fileRef = useRef();

  const msg = (type, text) => setApiMsg({ type, text });

  // ✅ UPDATED: Strict validation and Confirmation Popup
  const handlePay = async () => {
    setApiMsg({});

    // 1. Strict Validation
    if (!payDate) return msg("error", "Payment Date is required.");
    if (!proofFile)
      return msg(
        "error",
        "Payment Proof picture/document is essential to confirm payment.",
      );

    // 2. Confirmation Popup
    const confirmMessage = `Are you sure you want to mark Challan ${c.challanNo} as PAID for ${fmt(c.remainingAmount)}?\n\nThis action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const fd = new FormData();
      fd.append("paymentDate", payDate);
      if (payRemark) fd.append("paymentRemark", payRemark);
      fd.append("paymentProof", proofFile); // Appended properly

      await onPay({ id: c._id, formData: fd }).unwrap();
      msg("success", "Challan marked as paid successfully.");
      onRefresh();
      setTimeout(onClose, 1200);
    } catch (err) {
      msg("error", err?.data?.message ?? "Failed to mark as paid.");
    }
  };

  const handleUpdateFineDue = async () => {
    setApiMsg({});
    try {
      await onUpdateFineDue({
        id: c._id,
        fineAmount: +fineAmt,
        dueDate: newDueDate,
      }).unwrap();
      msg("success", "Updated successfully.");
      onRefresh();
    } catch (err) {
      msg("error", err?.data?.message ?? "Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete challan ${c.challanNo}?`)) return;
    setApiMsg({});
    try {
      await onDeleteChallan({ id: c._id }).unwrap();
      onRefresh();
      onClose();
    } catch (err) {
      msg("error", err?.data?.message ?? "Delete failed.");
    }
  };

  const name = c.studentId?.personalInfo?.fullName ?? "—";
  const regNo = c.studentId?.studentId ?? "—";
  const prog = c.programId?.name ?? "—";
  const sem = c.semesterId?.name ?? "—";

  const feeEntries = c.feeDetails
    ? c.feeDetails instanceof Map
      ? [...c.feeDetails.entries()]
      : Object.entries(c.feeDetails)
    : [];

  const tabs = ["details", ...(isPaid ? [] : ["actions"]), "history"];

  return (
    <Modal title={`Challan — ${c.challanNo}`} onClose={onClose} width={620}>
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #F1F5F9",
          padding: "0 24px",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              color: tab === t ? "#4F46E5" : "#64748B",
              borderBottom:
                tab === t ? "2px solid #4F46E5" : "2px solid transparent",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ── DETAILS TAB ── */}
        {tab === "details" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#F8FAFC",
                borderRadius: 12,
                padding: "14px 16px",
                border: "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#EEF2FF",
                  color: "#4338CA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  {regNo} · {prog} · {sem}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <InfoRow
                label="Challan No"
                value={
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {c.challanNo}
                  </span>
                }
              />
              <InfoRow
                label="Type"
                value={<ChallanTypeBadge type={c.challanType} />}
              />
              <InfoRow
                label="Issue Date"
                value={fmtDate(c.issueDate ?? c.createdAt)}
              />
              <InfoRow
                label="Due Date"
                value={
                  <span
                    style={{
                      color: c.status === "overdue" ? "#E11D48" : "#0F172A",
                      fontWeight: c.status === "overdue" ? 700 : 400,
                    }}
                  >
                    {fmtDate(c.dueDate)}
                  </span>
                }
              />
              {c.paidAt && (
                <InfoRow label="Paid On" value={fmtDate(c.paidAt)} />
              )}
              {c.paymentRemark && (
                <InfoRow label="Payment Remark" value={c.paymentRemark} />
              )}
            </div>

            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  background: "#F8FAFC",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Fee Breakdown
                </span>
              </div>
              <div style={{ padding: "0 16px" }}>
                {feeEntries.map(([k, v]) => (
                  <FeeRow
                    key={k}
                    label={k
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())}
                    value={fmt(v)}
                  />
                ))}
                {c.scholarshipAmount > 0 && (
                  <FeeRow
                    label="Scholarship Deduction"
                    value={`− ${fmt(c.scholarshipAmount)}`}
                    valueColor="#22C55E"
                  />
                )}
                {c.fineAmount > 0 && (
                  <FeeRow
                    label="Late Fine"
                    value={`+ ${fmt(c.fineAmount)}`}
                    valueColor="#E11D48"
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    fontWeight: 700,
                    fontSize: 14,
                    borderTop: "1px solid #F1F5F9",
                  }}
                >
                  <span style={{ color: "#0F172A" }}>Net Payable</span>
                  <span style={{ color: "#0F172A" }}>{fmt(c.netAmount)}</span>
                </div>
                {c.paidAmount > 0 && (
                  <FeeRow
                    label="Amount Paid"
                    value={fmt(c.paidAmount)}
                    valueColor="#22C55E"
                  />
                )}
                {c.remainingAmount > 0 && (
                  <FeeRow
                    label="Balance Due"
                    value={fmt(c.remainingAmount)}
                    valueColor="#E11D48"
                  />
                )}
              </div>
            </div>
            {c.paymentProof && (
              <a
                href={c.paymentProof}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#166534",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <Paperclip size={14} /> Payment proof attached — click to view
                <Download size={13} style={{ marginLeft: "auto" }} />
              </a>
            )}
          </>
        )}

        {/* ── ACTIONS TAB ── */}
        {tab === "actions" && !isPaid && !isCancelled && (
          <>
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <CheckCircle size={16} color="#16A34A" />
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}
                >
                  Mark as Paid
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <FormField label="Payment Date" required>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Payment Remark">
                  <input
                    value={payRemark}
                    onChange={(e) => setPayRemark(e.target.value)}
                    placeholder="e.g. Cash / Bank Transfer"
                    style={inputStyle}
                  />
                </FormField>
              </div>

              {/* ✅ UPDATED: Payment proof is now strictly required in UI */}
              <FormField
                label="Payment Proof"
                hint="JPG, PNG or PDF (Required)"
                required
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => fileRef.current.click()}
                    style={{
                      ...inputStyle,
                      background: proofFile ? "#F0FDF4" : "#fff",
                      borderColor: proofFile ? "#86EFAC" : "#E2E8F0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 38,
                    }}
                  >
                    <Paperclip
                      size={13}
                      color={proofFile ? "#166534" : "#64748B"}
                    />
                    <span
                      style={{
                        color: proofFile ? "#166534" : "#64748B",
                        fontSize: 13,
                        fontWeight: proofFile ? 600 : 400,
                      }}
                    >
                      {proofFile ? proofFile.name : "Select proof file..."}
                    </span>
                  </button>
                  {proofFile && (
                    <button
                      onClick={() => setProofFile(null)}
                      style={{
                        color: "#E11D48",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </FormField>

              <PrimaryBtn
                onClick={handlePay}
                loading={paying}
                style={{
                  marginTop: 16,
                  background: "linear-gradient(135deg,#16A34A,#15803D)",
                }}
              >
                Confirm Payment — {fmt(c.remainingAmount)}
              </PrimaryBtn>
            </div>

            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <Clock size={16} color="#475569" />
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}
                >
                  Update Due Date &amp; Fine
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <FormField label="New Due Date">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
                <FormField
                  label="Fine Amount (PKR)"
                  hint="Set 0 to remove fine"
                >
                  <input
                    type="number"
                    min="0"
                    value={fineAmt}
                    onChange={(e) => setFineAmt(e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
              </div>
              <SecondaryBtn onClick={handleUpdateFineDue} disabled={updFine}>
                {updFine ? "Updating…" : "Save Changes"}
              </SecondaryBtn>
            </div>

            <div
              style={{
                border: "1px solid #FECDD3",
                borderRadius: 12,
                padding: 16,
                background: "#FFF1F2",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <AlertCircle size={16} color="#E11D48" />
                <span
                  style={{ fontWeight: 700, fontSize: 14, color: "#E11D48" }}
                >
                  Danger Zone
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#9F1239", marginBottom: 12 }}>
                Deleting this challan is permanent and will cancel it in the
                system.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #FECDD3",
                  background: "#fff",
                  color: "#E11D48",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {deleting ? "Deleting…" : "Delete Challan"}
              </button>
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div style={{ fontSize: 13, color: "#64748B" }}>
            <HistoryItem
              date={c.issueDate ?? c.createdAt}
              label="Challan created"
              color="#4F46E5"
            />
            {c.status === "overdue" && (
              <HistoryItem
                date={c.dueDate}
                label="Marked overdue"
                color="#E11D48"
              />
            )}
            {c.paidAt && (
              <HistoryItem
                date={c.paidAt}
                label="Payment received"
                color="#22C55E"
              />
            )}
            {c.deletedAt && (
              <HistoryItem
                date={c.deletedAt}
                label="Challan cancelled"
                color="#94A3B8"
              />
            )}
          </div>
        )}

        {/* API feedback */}
        {apiMsg.text && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: apiMsg.type === "success" ? "#F0FDF4" : "#FFF1F2",
              color: apiMsg.type === "success" ? "#166534" : "#E11D48",
              border: `1px solid ${apiMsg.type === "success" ? "#BBF7D0" : "#FECDD3"}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            {apiMsg.type === "success" ? (
              <CheckCircle size={14} />
            ) : (
              <AlertCircle size={14} />
            )}{" "}
            {apiMsg.text}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderTop: "1px solid #F1F5F9",
            paddingTop: 14,
          }}
        >
          <SecondaryBtn onClick={onClose}>Close</SecondaryBtn>
          {!isCancelled && (
            <PrimaryBtn onClick={() => onPrint(c)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Printer size={14} /> Print Invoice
              </div>
            </PrimaryBtn>
          )}
        </div>
      </div>
    </Modal>
  );
}

const InfoRow = ({ label, value }) => (
  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
    <div
      style={{
        fontSize: 10,
        color: "#94A3B8",
        marginBottom: 3,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 13, color: "#0F172A" }}>{value}</div>
  </div>
);

const FeeRow = ({ label, value, valueColor }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "9px 0",
      borderBottom: "1px solid #F8FAFC",
      fontSize: 13,
    }}
  >
    <span style={{ color: "#475569" }}>{label}</span>
    <span style={{ fontWeight: 600, color: valueColor ?? "#0F172A" }}>
      {value}
    </span>
  </div>
);

const HistoryItem = ({ date, label, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid #F8FAFC",
    }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
    <div>
      <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 13 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8" }}>{fmtDate(date)}</div>
    </div>
  </div>
);
