/**
 * hostelShared.jsx
 * Shared primitives: formatters, badges, loading states, stat cards, icon buttons.
 * Import from here in every hostel component to keep styling consistent.
 */
import React from "react";

// ─── Formatters ──────────────────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── Status metadata ─────────────────────────────────────────────────────────
export const statusMeta = {
  issued: { label: "Issued", bg: "#EEF2FF", color: "#4338CA", dot: "#6366F1" },
  paid: { label: "Paid", bg: "#F0FDF4", color: "#166534", dot: "#22C55E" },
  overdue: {
    label: "Overdue",
    bg: "#FFF1F2",
    color: "#9F1239",
    dot: "#F43F5E",
  },
  partial: {
    label: "Partial",
    bg: "#FFFBEB",
    color: "#92400E",
    dot: "#F59E0B",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#F9FAFB",
    color: "#6B7280",
    dot: "#9CA3AF",
  },
  pending: {
    label: "Pending",
    bg: "#FFF7ED",
    color: "#9A3412",
    dot: "#F97316",
  },
  draft: { label: "Draft", bg: "#F8FAFC", color: "#475569", dot: "#94A3B8" },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const m = statusMeta[status] ?? statusMeta.issued;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: m.bg,
        color: m.color,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: m.dot,
          flexShrink: 0,
        }}
      />
      {m.label}
    </span>
  );
};

// ─── ChallanTypeBadge ────────────────────────────────────────────────────────
const challanTypeMeta = {
  hostel_admission: { label: "Admission", bg: "#EEF2FF", color: "#4338CA" },
  hostel_monthly: { label: "Monthly", bg: "#F0FDF4", color: "#166534" },
};
export const ChallanTypeBadge = ({ type }) => {
  const m = challanTypeMeta[type] ?? {
    label: type ?? "—",
    bg: "#F1F5F9",
    color: "#475569",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: m.bg,
        color: m.color,
      }}
    >
      {m.label}
    </span>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, accent }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #F1F5F9",
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      borderTop: `3px solid ${accent}`,
    }}
  >
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 24,
        fontWeight: 700,
        color: "#0F172A",
        lineHeight: 1.1,
      }}
    >
      {value}
    </span>
    {sub && <span style={{ fontSize: 12, color: "#64748B" }}>{sub}</span>}
  </div>
);

// ─── IconBtn ──────────────────────────────────────────────────────────────────
export const IconBtn = ({
  onClick,
  title,
  icon,
  variant = "ghost",
  disabled = false,
}) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "1px solid",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s",
      borderColor: variant === "danger" ? "#FECDD3" : "#E2E8F0",
      background: variant === "danger" ? "#FFF1F2" : "#F8FAFC",
      color: variant === "danger" ? "#E11D48" : "#475569",
      fontSize: 14,
    }}
  >
    {icon}
  </button>
);

// ─── LoadingState ─────────────────────────────────────────────────────────────
export const LoadingState = ({ label = "Loading…" }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 0",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        border: "3px solid #E2E8F0",
        borderTopColor: "#4F46E5",
        borderRadius: "50%",
        animation: "hostelSpin 0.8s linear infinite",
      }}
    />
    <style>{`@keyframes hostelSpin { to { transform: rotate(360deg); } }`}</style>
    <span style={{ color: "#94A3B8", fontSize: 13 }}>{label}</span>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, sub }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "60px 0",
      gap: 10,
      background: "#fff",
      borderRadius: 14,
      border: "1px solid #E2E8F0",
    }}
  >
    <span style={{ fontSize: 40 }}>{icon}</span>
    <span style={{ fontWeight: 600, color: "#0F172A", fontSize: 15 }}>
      {title}
    </span>
    {sub && <span style={{ color: "#94A3B8", fontSize: 13 }}>{sub}</span>}
  </div>
);

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, width = 560 }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: 16,
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        width: "100%",
        maxWidth: width,
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
      }}
    >
      {/* Modal header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid #F1F5F9",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 1,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>
          {title}
        </span>
        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid #E2E8F0",
            background: "#F8FAFC",
            color: "#64748B",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── FormField ────────────────────────────────────────────────────────────────
export const FormField = ({ label, required, error, children, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        letterSpacing: "0.02em",
      }}
    >
      {label}
      {required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && !error && (
      <span style={{ fontSize: 11, color: "#94A3B8" }}>{hint}</span>
    )}
    {error && <span style={{ fontSize: 11, color: "#EF4444" }}>{error}</span>}
  </div>
);

export const inputStyle = {
  height: 38,
  borderRadius: 8,
  border: "1px solid #E2E8F0",
  padding: "0 12px",
  fontSize: 13,
  color: "#0F172A",
  background: "#fff",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

export const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 32,
};

// ─── Primary action button ────────────────────────────────────────────────────
export const PrimaryBtn = ({
  children,
  onClick,
  disabled,
  loading,
  style: extraStyle,
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      padding: "10px 22px",
      borderRadius: 8,
      border: "none",
      background:
        disabled || loading
          ? "#A5B4FC"
          : "linear-gradient(135deg,#4F46E5,#7C3AED)",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      cursor: disabled || loading ? "not-allowed" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      transition: "opacity 0.15s",
      ...extraStyle,
    }}
  >
    {loading ? "Saving…" : children}
  </button>
);

export const SecondaryBtn = ({ children, onClick, style: extraStyle }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 18px",
      borderRadius: 8,
      border: "1px solid #E2E8F0",
      background: "#F8FAFC",
      color: "#374151",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      ...extraStyle,
    }}
  >
    {children}
  </button>
);
