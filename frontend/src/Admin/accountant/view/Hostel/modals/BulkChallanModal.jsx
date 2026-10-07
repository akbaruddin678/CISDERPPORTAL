import React, { useState, useMemo } from "react";
import {
  Modal,
  FormField,
  PrimaryBtn,
  SecondaryBtn,
  inputStyle,
  fmt,
} from "../../../common/Hostelshared";
import {
  Search,
  X,
  CheckSquare,
  Square,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Helper for Month Datalist
const generateMonthOptions = () => {
  const opts = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    opts.push(d.toLocaleString("default", { month: "long", year: "numeric" }));
    d.setMonth(d.getMonth() + 1);
  }
  return opts;
};

// Calculate default due date (10 days from now)
const defaultDueDate = new Date();
defaultDueDate.setDate(defaultDueDate.getDate() + 10);

export default function BulkChallanModal({
  allocations,
  onClose,
  onSuccess,
  onGenerateBulk,
  bulkLoading,
}) {
  const [selectedIds, setSelectedIds] = useState(
    new Set(allocations.map((a) => a._id)),
  );
  const [month, setMonth] = useState(
    new Date().toLocaleString("default", { month: "long", year: "numeric" }),
  );

  // ✅ Due Date State Added
  const [dueDate, setDueDate] = useState(
    defaultDueDate.toISOString().split("T")[0],
  );

  const [search, setSearch] = useState("");
  const [apiError, setApiError] = useState("");
  const [result, setResult] = useState(null);

  const toggleAll = () =>
    setSelectedIds((prev) =>
      prev.size === filteredAllocations.length
        ? new Set()
        : new Set(filteredAllocations.map((a) => a._id)),
    );
  const toggleOne = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filteredAllocations = useMemo(() => {
    if (!search.trim()) return allocations;
    const q = search.toLowerCase();
    return allocations.filter((a) => {
      const name = a.studentId?.personalInfo?.fullName?.toLowerCase() ?? "";
      const reg = (a.studentId?.studentId ?? "").toLowerCase();
      return name.includes(q) || reg.includes(q);
    });
  }, [allocations, search]);

  const totalRent = useMemo(
    () =>
      allocations
        .filter((a) => selectedIds.has(a._id))
        .reduce((s, a) => s + (a.monthlyRent ?? 0), 0),
    [allocations, selectedIds],
  );

  const allFiltered = filteredAllocations.every((a) => selectedIds.has(a._id));

  const handleGenerate = async () => {
    if (!selectedIds.size) {
      setApiError("Select at least one student.");
      return;
    }
    if (!month.trim()) {
      setApiError("Enter the target month.");
      return;
    }
    if (!dueDate) {
      setApiError("Enter the due date.");
      return;
    }
    setApiError("");
    try {
      const studentIds = allocations
        .filter((a) => selectedIds.has(a._id))
        .map((a) =>
          typeof a.studentId === "object" ? a.studentId._id : a.studentId,
        );

      // ✅ Pass dueDate in Payload
      const res = await onGenerateBulk({ studentIds, month, dueDate }).unwrap();
      setResult(res);
    } catch (err) {
      setApiError(err?.data?.message ?? "Bulk generation failed.");
    }
  };

  // ── Result screen ──
  if (result) {
    const generated = result.data?.length ?? 0;
    const success = generated > 0;
    return (
      <Modal title="Bulk Challan — Result" onClose={onSuccess} width={440}>
        <div
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: success ? "#F0FDF4" : "#FFF1F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {success ? (
              <CheckCircle size={32} color="#22C55E" />
            ) : (
              <AlertCircle size={32} color="#E11D48" />
            )}
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#0F172A",
                marginBottom: 6,
              }}
            >
              {result.message ?? "Done"}
            </p>
            <p style={{ fontSize: 13, color: "#64748B" }}>
              {generated} challan{generated !== 1 ? "s" : ""} generated for{" "}
              <strong>{month}</strong>
            </p>
          </div>
          {result.syncStats && (
            <div
              style={{
                display: "flex",
                gap: 24,
                padding: "14px 24px",
                background: "#F8FAFC",
                borderRadius: 12,
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#22C55E" }}>
                  {result.syncStats.syncedCount}
                </p>
                <p style={{ fontSize: 11, color: "#94A3B8" }}>EzPay synced</p>
              </div>
              {result.syncStats.failedCount > 0 && (
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{ fontSize: 22, fontWeight: 700, color: "#E11D48" }}
                  >
                    {result.syncStats.failedCount}
                  </p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>Sync failed</p>
                </div>
              )}
            </div>
          )}
          <PrimaryBtn onClick={onSuccess}>Done</PrimaryBtn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Generate Bulk Monthly Challans" onClose={onClose} width={600}>
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ✅ Updated: Month and Due Date in one row */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <FormField
            label="Target Month"
            required
            hint="Appears in challan remarks"
          >
            <input
              list="bulk-month-options"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="e.g. February 2025"
              style={inputStyle}
            />
            <datalist id="bulk-month-options">
              {generateMonthOptions().map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Due Date" required hint="Deadline for payment">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </FormField>
        </div>

        {/* Student selector */}
        <div
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "#F8FAFC",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={toggleAll}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: "#4338CA",
                }}
              >
                {allFiltered && filteredAllocations.length > 0 ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} color="#94A3B8" />
                )}
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                Select Students ({selectedIds.size} / {allocations.length})
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <Search
                size={12}
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter…"
                style={{
                  ...inputStyle,
                  height: 30,
                  paddingLeft: 26,
                  width: 140,
                  fontSize: 12,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94A3B8",
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {allocations.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                No active allocations
              </div>
            ) : filteredAllocations.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                No students match your search
              </div>
            ) : (
              filteredAllocations.map((a) => {
                const name = a.studentId?.personalInfo?.fullName ?? "Unknown";
                const regNo = a.studentId?.studentId ?? "—";
                const isChecked = selectedIds.has(a._id);
                return (
                  <label
                    key={a._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid #F8FAFC",
                      background: isChecked ? "#FAFBFF" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(a._id)}
                      style={{
                        cursor: "pointer",
                        flexShrink: 0,
                        accentColor: "#4F46E5",
                      }}
                    />
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: isChecked ? "#EEF2FF" : "#F1F5F9",
                        color: isChecked ? "#4338CA" : "#94A3B8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#0F172A",
                        }}
                      >
                        {name}
                      </p>
                      <p style={{ fontSize: 11, color: "#94A3B8" }}>
                        {regNo} · {a.hostelName} · Room {a.roomNumber}
                      </p>
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#0F172A",
                        flexShrink: 0,
                      }}
                    >
                      {fmt(a.monthlyRent)}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                Total Challans to Generate
              </p>
              <p style={{ fontSize: 13, color: "#166534" }}>
                {selectedIds.size} students · {month}
              </p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#166534" }}>
              {fmt(totalRent)}
            </span>
          </div>
        )}

        {apiError && (
          <div
            style={{
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#E11D48",
            }}
          >
            ⚠ {apiError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            borderTop: "1px solid #F1F5F9",
            paddingTop: 14,
          }}
        >
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn
            onClick={handleGenerate}
            loading={bulkLoading}
            disabled={!selectedIds.size}
          >
            Generate {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Challan
            {selectedIds.size !== 1 ? "s" : ""}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
