import React, { useState } from "react";
import { X, Loader2, Calendar, AlertTriangle, Trash2 } from "lucide-react";

const ModalOverlay = ({ title, onClose, children, size = "max-w-md" }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div
      className={`bg-white w-full ${size} rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={20} />
      </button>
      <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
        {title}
      </h3>
      {children}
    </div>
  </div>
);

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "N/A");

export const ShiftUnpaidDateModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [date, setDate] = useState("");
  if (!isOpen) return null;
  return (
    <ModalOverlay title="Change Unpaid Invoice Date" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(date);
        }}
        className="space-y-4"
      >
        <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 border border-amber-100 flex gap-2">
          <Calendar size={16} className="shrink-0" />
          <span>
            This will set the due date on <b>every unpaid invoice</b> matching your current
            filters. This does not affect already-paid invoices.
          </span>
        </div>
        <input
          type="date"
          required
          className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Apply New Date"}
        </button>
      </form>
    </ModalOverlay>
  );
};

export const ClearUnpaidModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay title="Clear Unpaid Invoices" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-rose-50 p-3 rounded text-xs text-rose-800 border border-rose-100 flex gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            This will cancel <b>every unpaid invoice</b> matching your current filters. Records
            are not deleted — they're marked cancelled and stay in the system for history.
          </span>
        </div>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" size={18} />
          ) : (
            "Clear Unpaid Invoices"
          )}
        </button>
      </div>
    </ModalOverlay>
  );
};

export const EditInvoiceDateModal = ({ isOpen, onClose, target, onConfirm, isLoading }) => {
  const [date, setDate] = useState(
    target?.dueDate ? new Date(target.dueDate).toISOString().split("T")[0] : "",
  );
  React.useEffect(() => {
    setDate(target?.dueDate ? new Date(target.dueDate).toISOString().split("T")[0] : "");
  }, [target]);
  if (!isOpen || !target) return null;
  return (
    <ModalOverlay title="Update Due Date" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(date);
        }}
        className="space-y-4"
      >
        <div className="text-sm text-slate-600">
          <span className="font-semibold">{target.name}</span> — {target.regNo}
        </div>
        <input
          type="date"
          required
          className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Update Date"}
        </button>
      </form>
    </ModalOverlay>
  );
};

export const DeleteInvoiceModal = ({ isOpen, onClose, target, onConfirm, isLoading }) => {
  if (!isOpen || !target) return null;
  return (
    <ModalOverlay title="Cancel Invoice" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-rose-50 p-3 rounded text-xs text-rose-800 border border-rose-100 flex gap-2">
          <Trash2 size={16} className="shrink-0" />
          <span>
            Cancel invoice <b>{target.challanNo}</b> for <b>{target.name}</b>? This does not
            delete the record — it stays visible for history but is marked cancelled.
          </span>
        </div>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Cancel Invoice"}
        </button>
      </div>
    </ModalOverlay>
  );
};

export const ViewInvoiceModal = ({ isOpen, onClose, target }) => {
  if (!isOpen || !target) return null;
  const rows = [
    ["Invoice No", target.challanNo],
    ["Reg No", target.regNo],
    ["Challan No", target.challanNo || "N/A"],
    ["Name", target.name],
    ["Mobile", target.mobile],
    ["Due Date", fmtDate(target.dueDate)],
    ["Amount", fmtMoney(target.amount)],
    ["After Due Date", fmtMoney(target.afterDueDateAmount)],
    ["Amount Paid", fmtMoney(target.amountPaid)],
    ["Paid Date", target.paidDate ? fmtDate(target.paidDate) : "—"],
    ["Status", target.status === "PAID" ? "Paid" : "Unpaid"],
    ["Paid By", target.paidBy || "—"],
  ];
  return (
    <ModalOverlay title="Invoice Details" onClose={onClose}>
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-2 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </ModalOverlay>
  );
};
