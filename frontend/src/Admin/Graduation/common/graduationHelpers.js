import { GraduationCap, ClipboardCheck, Building2, Wallet, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";

export const STAGES = [
  { key: "hod", label: "Academic (HOD)", short: "HOD", icon: GraduationCap },
  { key: "exam", label: "Examination Office", short: "Exam Office", icon: ClipboardCheck },
  { key: "offices", label: "Auxiliary Offices", short: "Offices", icon: Building2 },
  { key: "finance", label: "Accounts & Finance", short: "Accounts", icon: Wallet },
  { key: "registrar", label: "Registrar", short: "Registrar", icon: BadgeCheck },
];

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
export const fmtRs = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

export const errorText = (err) =>
  err?.data?.message || err?.data?.error || err?.error || "Something went wrong. Please try again.";

// done | current | rejected | upcoming — for one node of the stage tracker.
export function stageState(clearance, key) {
  if (clearance.status === "graduated") return "done";
  if (clearance.status === "cancelled") return "upcoming";
  if (key === "offices") {
    const offices = clearance.offices || [];
    if (offices.some((o) => o.status === "rejected")) return "rejected";
    if (
      clearance.stages?.exam?.status === "approved" &&
      offices.every((o) => ["approved", "not_applicable"].includes(o.status))
    ) {
      return "done";
    }
    return clearance.currentStage === "offices" ? "current" : "upcoming";
  }
  const step = clearance.stages?.[key];
  if (step?.status === "approved") return "done";
  if (step?.status === "rejected") return "rejected";
  return clearance.currentStage === key ? "current" : "upcoming";
}

export const useToast = () => {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, (message, type = "success") => setToast({ message, type, id: Date.now() })];
};

