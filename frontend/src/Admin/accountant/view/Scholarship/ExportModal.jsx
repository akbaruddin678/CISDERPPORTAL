// components/common/ExportModal.js
import React, { useState } from "react";
import { Download, X, FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import {
  exportScholarshipPlansExcel,
  exportScholarshipPlansPDF,
  exportScholarshipApplicationsExcel,
  exportScholarshipApplicationsPDF,
} from "../../common/scholarshipExport";

const ExportModal = ({
  isOpen,
  onClose,
  title = "Export Data",
  dataType = "plans",
  filters = {},
  fetchAllPlans,
  fetchAllApplications,
  onSuccess,
  onError,
}) => {
  const [exportFormat, setExportFormat] = useState("excel");
  const [includeFilters, setIncludeFilters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const scopeLabel = includeFilters && (filters.search || filters.status || filters.planId || filters.active || filters.type)
    ? "Filtered Results"
    : dataType === "plans"
      ? "All Plans"
      : "All Applications";

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const queryArgs = includeFilters
        ? { ...filters, page: 1, limit: 2000 }
        : { page: 1, limit: 2000 };

      if (dataType === "plans") {
        const result = await fetchAllPlans(queryArgs).unwrap();
        const records = result?.data || [];
        if (records.length === 0) {
          onError?.("No plans match the current filters to export.");
          setIsExporting(false);
          return;
        }
        if (exportFormat === "excel") {
          await exportScholarshipPlansExcel(records, { scopeLabel });
        } else {
          await exportScholarshipPlansPDF(records, { scopeLabel });
        }
      } else {
        const result = await fetchAllApplications(queryArgs).unwrap();
        const records = result?.data || [];
        if (records.length === 0) {
          onError?.("No applications match the current filters to export.");
          setIsExporting(false);
          return;
        }
        if (exportFormat === "excel") {
          await exportScholarshipApplicationsExcel(records, { scopeLabel });
        } else {
          await exportScholarshipApplicationsPDF(records, { scopeLabel });
        }
      }

      onSuccess?.("Export downloaded successfully!");
      onClose();
    } catch (error) {
      onError?.(error?.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isExporting ? onClose : undefined}
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* --- HEADER --- */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm">
              <Download size={22} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {dataType === "plans" ? "Scholarship plans" : "Student applications"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="p-6 space-y-5">
          {/* Format */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat("excel")}
                className={`flex items-center justify-center gap-2 px-3 py-3 border rounded-xl text-sm font-bold transition-colors ${
                  exportFormat === "excel"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileSpreadsheet size={18} />
                Excel
              </button>
              <button
                type="button"
                onClick={() => setExportFormat("pdf")}
                className={`flex items-center justify-center gap-2 px-3 py-3 border rounded-xl text-sm font-bold transition-colors ${
                  exportFormat === "pdf"
                    ? "bg-rose-50 border-rose-300 text-rose-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText size={18} />
                PDF
              </button>
            </div>
          </div>

          {/* Include Filters */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeFilters}
              onChange={(e) => setIncludeFilters(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
            />
            <span className="text-sm text-slate-600 font-medium">
              Only export records matching the current filters
            </span>
          </label>

          {/* Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Export Summary
            </h4>
            <div className="text-sm text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Data Type</span>
                <span className="font-bold text-slate-800 capitalize">{dataType}</span>
              </div>
              <div className="flex justify-between">
                <span>Format</span>
                <span className="font-bold text-slate-800 uppercase">{exportFormat}</span>
              </div>
              <div className="flex justify-between">
                <span>Scope</span>
                <span className="font-bold text-slate-800">{scopeLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? "Exporting..." : "Export Data"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
