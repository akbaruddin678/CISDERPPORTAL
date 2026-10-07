import React from "react";
import {
  FaUndo,
  FaTrashAlt,
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaClock,
  FaFilePdf,
  FaFileExcel,
} from "react-icons/fa";

const PermanentDeleteModal = ({ open, name, remark, setRemark, onCancel, onConfirm, isDeleting }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-600">
            <FaExclamationTriangle size={16} />
            <h3 className="font-semibold text-base text-slate-800">Delete Permanently</h3>
          </div>
          <button onClick={() => !isDeleting && onCancel()} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
            <FaTimes size={14} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            This permanently removes <b>{name}</b>&apos;s record. This cannot be undone, and this action skips the
            remaining retention window.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Remark (required)</label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Reason for permanent deletion..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-300 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onCancel} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!remark.trim() || isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting && <FaSpinner className="animate-spin" size={12} />}
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentTrashPageView = ({
  trashRecords,
  isTrashLoading,
  restoreStudent,
  isRestoring,
  restoringId,
  permanentDeleteTarget,
  permanentDeleteRemark,
  setPermanentDeleteRemark,
  openPermanentDeleteModal,
  closePermanentDeleteModal,
  confirmPermanentDelete,
  isPermanentDeleting,
  exportPDF,
  exportExcel,
}) => {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-rose-600 mb-1.5">
              Admin · Audit
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Trash</h1>
            <p className="text-sm text-slate-500 mt-1">
              Deleted students from every source (University and College) — restorable for 60 days, then
              automatically and permanently removed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              disabled={trashRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaFilePdf size={13} /> PDF
            </button>
            <button
              onClick={exportExcel}
              disabled={trashRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaFileExcel size={13} /> Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Student", "Deleted By", "Deleted On", "Remark", "Purge In", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap bg-slate-50/80">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isTrashLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <FaSpinner className="animate-spin mx-auto mb-2" size={20} />
                      Loading trash…
                    </td>
                  </tr>
                ) : trashRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <FaTrashAlt className="mx-auto mb-3 opacity-30" size={28} />
                      <p className="font-bold text-slate-600">Trash is empty</p>
                    </td>
                  </tr>
                ) : (
                  trashRecords.map((r) => {
                    const name = r.snapshot?.personalInfo?.fullName || "Unknown";
                    const regNo = r.snapshot?.studentProfile?.studentId || "N/A";
                    const urgent = r.daysRemaining <= 7;
                    return (
                      <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{regNo}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{r.trashedBy?.email || "—"}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(r.trashedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="text-xs text-slate-600 truncate" title={r.trashRemark}>{r.trashRemark}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${urgent ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                            <FaClock size={10} /> {r.daysRemaining}d
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => restoreStudent(r._id)}
                              disabled={isRestoring}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            >
                              {isRestoring && restoringId === r._id ? <FaSpinner className="animate-spin" size={11} /> : <FaUndo size={11} />}
                              Restore
                            </button>
                            <button
                              onClick={() => openPermanentDeleteModal(r)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <FaTrashAlt size={11} /> Delete Now
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PermanentDeleteModal
        open={Boolean(permanentDeleteTarget)}
        name={permanentDeleteTarget?.snapshot?.personalInfo?.fullName || "this student"}
        remark={permanentDeleteRemark}
        setRemark={setPermanentDeleteRemark}
        onCancel={closePermanentDeleteModal}
        onConfirm={confirmPermanentDelete}
        isDeleting={isPermanentDeleting}
      />
    </div>
  );
};

export default StudentTrashPageView;
