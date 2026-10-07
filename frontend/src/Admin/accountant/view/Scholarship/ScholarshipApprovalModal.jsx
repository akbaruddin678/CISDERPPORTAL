// view/Scholarship/ScholarshipApprovalModal.js
import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  User,
  Award,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const fmtRs = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

// Mirrors ScholarshipService.calculateScholarshipAmount — preview only,
// the real deduction is recomputed server-side.
const previewDeduction = (tuition, application) => {
  if (application.planType === "fixed") {
    return Math.min(application.planMaxAmount || 0, tuition);
  }
  const pct = Math.min(Math.max(application.planMaxPercentage || 0, 0), 100);
  return Math.min(Math.round((tuition * pct) / 100), tuition);
};

const ScholarshipApprovalModal = ({
  isOpen,
  onClose,
  application,
  handleApproveScholarship,
  handleFetchFeeContext,
  onSuccess,
  onError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Logic: strictly update status to 'approved' based on schema
      const result = await handleApproveScholarship({
        id: application.id
      });

      if (result && result.success) {
        onSuccess(result.message || 'Scholarship approved successfully!');
        onClose();
      } else {
        onError(result?.message || 'Approval failed');
      }
    } catch (error) {
      onError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <ShieldCheck size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Approve Grant</h2>
              <p className="text-xs text-slate-500 font-medium">Confirm scholarship allocation</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="p-6">
          
          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Application Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Student</p>
                  <p className="text-sm font-bold text-slate-900">{application.studentName}</p>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Award size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Scholarship Plan</p>
                  <p className="text-sm font-bold text-indigo-700">{application.planTitle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fee & Scholarship Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Fee &amp; Scholarship Preview
            </h3>
            {isFetchingFee ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
                <RefreshCw size={14} className="animate-spin" /> Loading fee details…
              </div>
            ) : !hasFeeSetup ? (
              <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs font-medium">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  No tuition fee is set up yet for this student — the
                  deduction will show as Rs 0 until it is. Approval isn't
                  blocked by this; it can be set up later.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tuition</p>
                  <p className="text-sm font-bold text-slate-800">{fmtRs(tuitionAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Deducts</p>
                  <p className="text-sm font-bold text-indigo-600">− {fmtRs(deductionPreview)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student Pays</p>
                  <p className="text-sm font-bold text-emerald-700">{fmtRs(netPayable)}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 text-center mb-6 px-2">
            Are you sure you want to approve this application? This action will formally link the student to the selected plan.
          </p>

          {/* Footer Actions */}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {isSubmitting ? 'Processing...' : 'Confirm Approval'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScholarshipApprovalModal;