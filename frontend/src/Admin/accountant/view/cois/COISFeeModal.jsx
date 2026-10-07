import React, { useEffect, useState } from "react";
import { Save, X, Zap } from "lucide-react";
import { Switch } from "@mui/material";

export default function COISFeeModal(props) {
  const {
    isOpen,
    onClose,
    onSubmit,
    watch,
    setValue,
    activeTab,
    generateBreakdown,
  } = props;
  const [isAutoMode, setIsAutoMode] = useState(true);

  const totalAmount = Number(watch("totalAmount") || 0);
  const securityFee = Number(watch("securityFee") || 0);
  const feeItems = watch("feeItems") || [];

  useEffect(() => {
    if (isAutoMode && isOpen && (totalAmount > 0 || securityFee > 0)) {
      setValue(
        "feeItems",
        generateBreakdown(totalAmount, activeTab, securityFee),
      );
    }
  }, [
    totalAmount,
    securityFee,
    isAutoMode,
    activeTab,
    isOpen,
    generateBreakdown,
    setValue,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h2 className="font-black text-slate-800">Setup Fee Structure</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Total Amount (PKR)
              </label>
              <input
                type="number"
                onChange={(e) => setValue("totalAmount", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-lg font-black rounded-xl px-4 py-3 outline-none focus:border-violet-500"
                placeholder="e.g. 45000"
              />
            </div>
            {activeTab === 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Security Deposit (PKR)
                </label>
                <input
                  type="number"
                  onChange={(e) => setValue("securityFee", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-base font-bold rounded-xl px-4 py-2.5 outline-none focus:border-violet-500"
                  placeholder="e.g. 5000"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Remark <span className="normal-case font-medium text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={watch("remarks") || ""}
              onChange={(e) => setValue("remarks", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 resize-none"
              placeholder="Optional note about this fee setup — shown later in Challan Management"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Zap size={14} className="text-amber-500" /> Breakdown
              </span>
              <Switch
                size="small"
                checked={isAutoMode}
                onChange={(e) => setIsAutoMode(e.target.checked)}
              />
            </div>
            <div className="space-y-2">
              {feeItems.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm font-medium text-slate-700"
                >
                  <span>{item.headName}</span>
                  <span className="font-black text-violet-600">
                    Rs. {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Structure
          </button>
        </form>
      </div>
    </div>
  );
}
