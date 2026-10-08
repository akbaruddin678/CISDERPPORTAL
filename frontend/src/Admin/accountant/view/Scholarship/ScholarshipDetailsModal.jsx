// view/Scholarship/ScholarshipDetailsModal.js
import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  Hash,
  Banknote,
  RefreshCw,
  Layers,
} from "lucide-react";

const fmtRs = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

const previewDeduction = (tuition, application) => {
  if (application.planType === "fixed") {
    return Math.min(application.planMaxAmount || 0, tuition);
  }
  const pct = Math.min(Math.max(application.planMaxPercentage || 0, 0), 100);
  return Math.min(Math.round((tuition * pct) / 100), tuition);
};

const ScholarshipDetailsModal = ({
  isOpen,
  onClose,
  application,
  handleFetchFeeContext,
  onOpenRevoke,
}) => {
  const [feeContext, setFeeContext] = useState(null);
  const [isFetchingFee, setIsFetchingFee] = useState(false);

  useEffect(() => {
    if (!isOpen || !application?.studentId || !handleFetchFeeContext) {
      setFeeContext(null);
      return;
    }
    setIsFetchingFee(true);
    handleFetchFeeContext(application.studentId)
      .then(setFeeContext)
      .finally(() => setIsFetchingFee(false));
  }, [isOpen, application?.studentId]);

  if (!isOpen || !application) return null;

  const tuitionAmount = feeContext?.tuitionAmount || 0;
  const hasFeeSetup = !!feeContext?.hasFeeSetup;
  const deductionPreview = previewDeduction(tuitionAmount, application);
  const netPayable = Math.max(0, tuitionAmount - deductionPreview);
  const scopeLabel =
    application.semesterScope === "selective"
      ? application.semesterNumbers?.length > 0
        ? `Section ${application.semesterNumbers.join(", ")}`
        : "Selected Semesters"
      : "All Semesters";

  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase() || "pending";
    switch (s) {
      case "approved":
        return {
          color: "text-emerald-700",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          icon: CheckCircle,
          label: "Approved",
        };
      case "rejected":
        return {
          color: "text-rose-700",
          bg: "bg-rose-50",
          border: "border-rose-200",
          icon: XCircle,
          label: "Rejected",
        };
      case "revoked":
        return {
          color: "text-slate-600",
          bg: "bg-slate-100",
          border: "border-slate-200",
          icon: Ban,
          label: "Revoked",
        };
      default:
        return {
          color: "text-amber-700",
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: Clock,
          label: "Pending Review",
        };
    }
  };

  const statusStyle = getStatusConfig(application.status);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* --- HEADER --- */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm text-indigo-600 font-bold text-2xl">
              {application.studentName
                ? application.studentName.charAt(0)
                : "S"}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
                >
                  <StatusIcon size={12} strokeWidth={2.5} /> {statusStyle.label}
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Hash size={10} />{" "}
                  {application.id ? application.id.slice(-8) : "N/A"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {application.studentName || "Unknown Student"}
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {application.studentEmail}
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

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* 1. Rejection Reason (Conditional) */}
          {application.status === "rejected" && application.rejectionReason && (
            <section className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                <XCircle size={16} /> Rejection Reason
              </h3>
              <p className="text-rose-900 text-sm leading-relaxed">
                {application.rejectionReason}
              </p>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 2. Student Details */}
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={16} className="text-indigo-500" /> Student Profile
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                    CNIC / ID
                  </label>
                  <p className="text-sm font-medium text-slate-700">
                    {application.studentCNIC || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                    Contact
                  </label>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Phone size={14} className="text-slate-300" />{" "}
                      {application.studentPhone || "—"}
                    </span>
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Mail size={14} className="text-slate-300" />{" "}
                      {application.studentEmail || "—"}
                    </span>
                  </div>
                </div>
                {application.studentCurrentAddress && (
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                      Address
                    </label>
                    <p className="text-sm font-medium text-slate-700 flex items-start gap-2">
                      <MapPin
                        size={14}
                        className="text-slate-300 mt-0.5 shrink-0"
                      />
                      <span>
                        {application.studentCurrentAddress.address},{" "}
                        {application.studentCurrentAddress.district}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Plan & Academic Details */}
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Award size={16} className="text-indigo-500" /> Plan
                Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                    Scholarship Plan
                  </label>
                  <p className="text-sm font-bold text-slate-800">
                    {application.planTitle}
                  </p>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                    {application.planType === "percentage"
                      ? "Percentage Based"
                      : "Fixed Amount"}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                    Academic Session
                  </label>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar size={14} className="text-slate-300" />
                    {application.termName || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                    Submission Date
                  </label>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock size={14} className="text-slate-300" />
                    {formatDate(application.appliedAt)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase block mb-1">
                    Applies To
                  </label>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Layers size={14} className="text-slate-300" />
                    {scopeLabel}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Fee & Scholarship Preview */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Banknote size={16} className="text-indigo-500" /> Fee &amp;
              Scholarship
            </h3>
            {isFetchingFee ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw size={14} className="animate-spin" /> Loading fee
                details…
              </div>
            ) : !hasFeeSetup ? (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                No tuition fee is set up yet for this student — the deduction
                will show as Rs 0 until it is.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Tuition
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {fmtRs(tuitionAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Deducts
                  </p>
                  <p className="text-sm font-bold text-indigo-600">
                    − {fmtRs(deductionPreview)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Student Pays
                  </p>
                  <p className="text-sm font-bold text-emerald-700">
                    {fmtRs(netPayable)}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          {application.status === "approved" && onOpenRevoke ? (
            <button
              onClick={() => onOpenRevoke(application)}
              className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2"
            >
              <Ban size={16} /> Remove From Scholarship
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDetailsModal;
