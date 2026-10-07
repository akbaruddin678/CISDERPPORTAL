import React from "react";
import { X, Calendar, DollarSign, Clock, List } from "lucide-react";

const InstallmentPlanDetailsModal = ({ isOpen, onClose, plan }) => {
  if (!isOpen || !plan) return null;

  // Helper to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-PK", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Determine Schedule Data to Display
  let schedule = [];

  if (plan.scheduleConfig && plan.scheduleConfig.length > 0) {
    // 1. Use Stored Schedule (New Logic)
    schedule = plan.scheduleConfig.map((item, index) => ({
      num: item.installmentNumber,
      percent: item.percentage,
      displayDate: item.specificDueDate
        ? formatDate(item.specificDueDate)
        : `Due ${
            item.daysAfterAssignment || (index + 1) * 30
          } days after start`,
      isSpecific: !!item.specificDueDate,
    }));
  } else {
    // 2. Fallback for Legacy Data (Interval Logic)
    const count = plan.numberOfInstallments || 0;
    const interval = plan.intervalDays || 30;
    schedule = Array.from({ length: count }, (_, i) => ({
      num: i + 1,
      percent: (100 / count).toFixed(2),
      displayDate: `Due ${(i + 1) * interval} days after start`,
      isSpecific: false,
    }));
  }

  // Calculate Duration
  let durationText = "Variable";
  if (plan.scheduleConfig && plan.scheduleConfig.length > 0) {
    const lastItem = plan.scheduleConfig[plan.scheduleConfig.length - 1];
    if (lastItem.specificDueDate) {
      const start = new Date(plan.createdAt);
      const end = new Date(lastItem.specificDueDate);
      const months = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
      durationText = `~${Math.max(1, months)} Months`;
    }
  } else if (plan.intervalDays) {
    durationText = `~${Math.ceil(
      (plan.numberOfInstallments * plan.intervalDays) / 30
    )} Months`;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* ADDED: min-h-[500px] to ensure it has height even if empty, and flex-col */}
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] min-h-[500px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-start text-white flex-shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border border-white/20 ${
                  plan.isActive
                    ? "bg-emerald-500/20 text-emerald-50"
                    : "bg-red-500/20 text-red-50"
                }`}
              >
                {plan.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - CRITICAL FIX: Added 'flex-1' so it takes up remaining height */}
        <div className="p-6 overflow-y-auto space-y-8 bg-slate-50/50 flex-1">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-indigo-600 mb-2 flex justify-center">
                <Clock size={24} />
              </div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Interval
              </p>
              <p className="text-lg font-bold text-slate-800">
                {plan.intervalDays ? `${plan.intervalDays} Days` : "Custom"}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-indigo-600 mb-2 flex justify-center">
                <DollarSign size={24} />
              </div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Installments
              </p>
              <p className="text-lg font-bold text-slate-800">
                {plan.numberOfInstallments}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-indigo-600 mb-2 flex justify-center">
                <Calendar size={24} />
              </div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Duration
              </p>
              <p className="text-lg font-bold text-slate-800">{durationText}</p>
            </div>
          </div>

          {/* Payment Schedule Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <List className="text-indigo-600" size={20} />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Payment Schedule
              </h3>
            </div>

            <div className="relative pl-4 border-l-2 border-indigo-200 space-y-4">
              {schedule.length > 0 ? (
                schedule.map((item, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white ring-2 ring-indigo-100"></div>
                    <div className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                          {item.num}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            Installment {item.num}
                          </p>
                          <p
                            className={`text-xs ${
                              item.isSpecific
                                ? "text-indigo-600 font-medium"
                                : "text-slate-500"
                            }`}
                          >
                            {item.displayDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right bg-indigo-50 px-3 py-1 rounded-lg">
                        <span className="text-sm font-bold text-indigo-700">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic pl-2">
                  No schedule data available.
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200 text-xs text-slate-400">
            <div>Created: {formatDate(plan.createdAt)}</div>
            <div>Updated: {formatDate(plan.updatedAt)}</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallmentPlanDetailsModal;
