// view/Scholarship/ScholarshipPlanDetailsModal.js
import React from "react";
import {
  Calendar,
  DollarSign,
  Percent,
  Clock,
  User,
  X,
  Award,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
  MessageSquare, // <--- Added specific icon for Remarks
} from "lucide-react";

const ScholarshipPlanDetailsModal = ({ isOpen, onClose, plan }) => {
  if (!isOpen || !plan) return null;

  // --- Helpers ---
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return `Rs ${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getPlanStatusConfig = (plan) => {
    if (!plan.active)
      return {
        label: "Inactive",
        bg: "bg-slate-100",
        text: "text-slate-500",
        border: "border-slate-200",
        icon: X,
      };

    const now = new Date();
    const validFrom = plan.validFrom ? new Date(plan.validFrom) : null;
    const validTo = plan.validTo ? new Date(plan.validTo) : null;

    if (validFrom && validFrom > now) {
      return {
        label: "Scheduled",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: Clock,
      };
    } else if (validTo && validTo < now) {
      return {
        label: "Expired",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        icon: Clock,
      };
    } else {
      return {
        label: "Active",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: ShieldCheck,
      };
    }
  };

  const statusConfig = getPlanStatusConfig(plan);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* --- HEADER --- */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm text-indigo-600">
              <Award size={32} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                >
                  <StatusIcon size={12} /> {statusConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-white border border-slate-200 text-slate-600">
                  {plan.type === "percentage" ? "Percentage" : "Fixed Amount"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {plan.title || "Untitled Plan"}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                ID: {plan.id || "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* 1. Key Metrics Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  Max Grant Value
                </p>
                <div className="text-3xl font-black text-indigo-900 flex items-baseline gap-1">
                  {plan.type === "percentage" ? (
                    <>
                      {plan.maxPercentage}
                      <span className="text-lg text-indigo-400">%</span>
                    </>
                  ) : (
                    <>{formatCurrency(plan.maxAmount)}</>
                  )}
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                {plan.type === "percentage" ? (
                  <Percent size={24} />
                ) : (
                  <DollarSign size={24} />
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Duration
                </p>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-16 text-slate-400 text-xs font-medium uppercase">
                      Start:
                    </span>
                    {formatDate(plan.validFrom)}
                  </span>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-16 text-slate-400 text-xs font-medium uppercase">
                      End:
                    </span>
                    {plan.validTo ? formatDate(plan.validTo) : "Indefinite"}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400">
                <Calendar size={24} />
              </div>
            </div>
          </section>

          {/* 2. Description */}
          {plan.description && (
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> Description
              </h3>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed">
                {plan.description}
              </div>
            </section>
          )}

          {/* 3. Remark (Using Different Icon and Key) */}
          {plan.remark && (
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-orange-500" /> Remark /
                Note
              </h3>
              <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 text-slate-700 text-sm leading-relaxed">
                {plan.remark}
              </div>
            </section>
          )}

          {/* 4. Metadata Grid */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Layers size={16} className="text-indigo-500" /> System Metadata
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase mb-1">
                  Academic Term
                </p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Activity size={14} className="text-slate-400" />
                  {plan.termName || "All Terms"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium uppercase mb-1">
                  Created By
                </p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  {plan.createdByName || "System Admin"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium uppercase mb-1">
                  Created On
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {formatDate(plan.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium uppercase mb-1">
                  Last Updated
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {formatDate(plan.updatedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium uppercase mb-1">
                  Students Assigned
                </p>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  {plan.activeAssignments || 0} active · {plan.totalAssignments || 0} total
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipPlanDetailsModal;
