import React, { useState } from "react";
import { X, Receipt, Loader2, Download } from "lucide-react";

// Picks a Fine used across every selected challan to generate the bulk
// "Invoice Sheet" .xlsx (the payment gateway's bulk upload template) — a
// separate, non-destructive action from "Apply to N records" above it:
// nothing here is saved to the challans themselves, it only shapes the
// exported file. Due date isn't picked here at all — each row uses that
// challan's own already-stored due date (see invoiceSheetExport.js).
const InvoiceSheetModal = ({ isOpen, count, isGenerating, onClose, onGenerate }) => {
  const [fineAmount, setFineAmount] = useState("");

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate({ fineAmount: fineAmount === "" ? 0 : Number(fineAmount) });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Receipt size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-none">
                Generate Invoice Sheet
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {count} record{count === 1 ? "" : "s"} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Fine After Due Date (PKR)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 2000"
              autoFocus
              value={fineAmount}
              onChange={(e) => setFineAmount(e.target.value)}
              className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Added on top of each record's current base amount to produce the
              "after due date" figure. Leave blank for no penalty. The due
              date used is each challan's own current due date.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-500 leading-relaxed space-y-1">
            <p>
              This only builds the Excel file — it does not change the due
              date or fine stored on these challans. Use "Apply to N records"
              for that.
            </p>
            <p>
              Invoice Number is built from each challan's payment reference —
              any selected record that hasn't been synced yet is skipped and
              reported after generating.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-[2] py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {isGenerating ? "Generating..." : "Generate Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSheetModal;
