import React, { useState } from "react";
import { FaExclamationTriangle, FaTimes, FaSpinner, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// Shared by both single-row delete and bulk delete on the Student
// Management screen. Two gates before the request even fires: a required
// remark (why this student is being deleted) and the acting staff
// member's own account password — moving a student to trash is
// reversible for 60 days, but it's still destructive enough to warrant
// re-confirming identity, not just a click.
const DeleteStudentModal = ({
  open,
  mode = "single",
  targetName,
  count = 0,
  remark,
  setRemark,
  password,
  setPassword,
  onCancel,
  onConfirm,
  isDeleting,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  if (!open) return null;

  const canConfirm = remark.trim().length > 0 && password.length > 0 && !isDeleting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-600">
            <FaExclamationTriangle size={16} />
            <h3 className="font-semibold text-base text-slate-800">
              {mode === "bulk" ? `Delete ${count} Students` : "Delete Student"}
            </h3>
          </div>
          <button
            onClick={() => !isDeleting && onCancel()}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {mode === "bulk" ? (
              <>Moving <b>{count} selected students</b> to Trash. They will be hidden everywhere and can be restored within 60 days — after that they are automatically and permanently removed.</>
            ) : (
              <>Moving <b>{targetName}</b> to Trash. They will be hidden everywhere and can be restored within 60 days — after that they are automatically and permanently removed.</>
            )}
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Remark (required)</label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Reason for deleting this record..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-300 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <FaLock size={10} /> Confirm your password (required)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your account password"
                className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting && <FaSpinner className="animate-spin" size={12} />}
            {mode === "bulk" ? `Delete ${count}` : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteStudentModal;
