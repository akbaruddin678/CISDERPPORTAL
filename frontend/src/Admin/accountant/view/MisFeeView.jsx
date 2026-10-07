import React, { useState, useEffect } from "react";
import {
  Building2,
  Receipt,
  User,
  DollarSign,
  Calendar,
  Printer,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  FileText,
  MessageSquare,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  Wallet,
} from "lucide-react";

// ==========================================
// 0. MODAL OVERLAY WRAPPER
// ==========================================
const ModalOverlay = ({ title, onClose, children, size = "max-w-md" }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
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

// ==========================================
// 1. MARK PAID MODAL
// ==========================================
const MarkPaidModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [paymentDate, setPaymentDate] = useState("");
  const [remark, setRemark] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setRemark("");
      setFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay title="Confirm Payment Receipt" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!remark.trim() || !file)
            return alert("Payment remark and proof image are required.");
          const formData = new FormData();
          formData.append("paymentDate", paymentDate);
          formData.append("paymentRemark", remark);
          formData.append("paymentProof", file);
          onConfirm(formData);
        }}
        className="space-y-5"
      >
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 font-medium">
          Marking this challan as paid will settle all dues. <br />
          <strong>Note:</strong> A payment receipt and remark are mandatory.
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Payment Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Payment Remark <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows="2"
            placeholder="e.g. Paid via Bank Transfer, ID: 12345"
            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-sm"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Payment Proof Image <span className="text-rose-500">*</span>
          </label>
          <input
            type="file"
            required
            accept="image/*,application/pdf"
            className="w-full border border-slate-200 p-2.5 rounded-xl outline-none bg-white text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Processing...
            </>
          ) : (
            "Confirm & Save Payment"
          )}
        </button>
      </form>
    </ModalOverlay>
  );
};

// ==========================================
// 2. DETAIL MODAL (NO BREAKDOWN)
// ==========================================
const DetailModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;
  const fmt = (v) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(v || 0);

  const exactFeeTitle = `${data.studentId?.personalInfo?.fullName || "Organization"} Fee`;

  return (
    <ModalOverlay title="Receipt Details" onClose={onClose} size="max-w-xl">
      <div className="space-y-6">
        <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Ref Number
            </span>
            <div className="text-2xl font-mono font-bold text-indigo-900 mt-1">
              {data.challanNo}
            </div>
          </div>
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 ${data.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
          >
            {data.status}
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Fee Details
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr className="hover:bg-slate-50">
                <td className="p-3 pl-4 text-slate-700 font-medium">
                  {exactFeeTitle}
                </td>
                <td className="p-3 pr-4 text-right font-mono text-slate-600">
                  {fmt(data.netAmount)}
                </td>
              </tr>
              <tr className="bg-slate-100 border-t border-slate-200">
                <td className="p-3 pl-4 text-slate-800 font-bold text-xs uppercase">
                  Gross Total
                </td>
                <td className="p-3 pr-4 text-right text-slate-900 font-bold font-mono">
                  {fmt(data.netAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {data.remarks && (
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-1">
            <span className="text-xs font-bold text-indigo-800 uppercase">
              Remarks / Notes
            </span>
            <p className="text-sm text-indigo-900">{data.remarks}</p>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};

// ==========================================
// 3. STATUS BADGE HELPER
// ==========================================
const StatusBadge = ({ status, isVoid }) => {
  if (isVoid)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded border border-slate-200">
        <XCircle size={12} /> VOID
      </span>
    );
  const c =
    {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      issued: "bg-blue-50 text-blue-700 border-blue-200",
      partial: "bg-amber-50 text-amber-700 border-amber-200",
    }[status] || "bg-slate-50 border-slate-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${c} text-[10px] font-black uppercase rounded border`}
    >
      <Clock size={12} /> {status}
    </span>
  );
};

// ==========================================
// MAIN VIEW COMPONENT
// ==========================================
const MisFeeView = ({
  formData,
  studentsList,
  handleChange,
  handleSubmit,
  loading,
  fetching,
  challans,
  payModalId,
  setPayModalId,
  handlePay,
  isPaying,
  detailModalData,
  setDetailModalData,
  deleteModalId,
  setDeleteModalId,
  handleDelete,
  isDeleting,
  handlePrint,
}) => {
  const fmt = (v) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(v || 0);

  // --- Calculate Statistics ---
  const activeChallans = challans.filter(
    (c) => c.status !== "cancelled" && c.status !== "merged" && !c.isDeleted,
  );
  const totalGeneratedCount = activeChallans.length;
  const totalAmount = activeChallans.reduce(
    (sum, c) => sum + (c.netAmount || 0),
    0,
  );
  const totalPaidAmount = activeChallans.reduce(
    (sum, c) => sum + (c.paidAmount || 0),
    0,
  );
  const totalPendingAmount = activeChallans.reduce(
    (sum, c) => sum + (c.remainingAmount || 0),
    0,
  );

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          Organization Fees
        </h1>
        <p className="text-slate-500 mt-1">
          Select an organization to load its profiles, then generate and track
          custom fee challans.
        </p>
      </div>

      {/* FORM SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 border-b border-slate-200 p-5">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            Create New Receipt
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Category Filter
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black appearance-none cursor-pointer"
                >
                  <option value="Tevta">Tevta</option>
                  <option value="John Safe Foundation">
                    John Safe Foundation
                  </option>
                </select>
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Select Organization Profile *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  name="studentRegNo"
                  required
                  value={formData.studentRegNo}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#E81D3A] outline-none font-medium appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select a profile --
                  </option>
                  {studentsList.map((student) => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.personalInfo?.fullName} ({student.studentId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Amount (PKR) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  name="amount"
                  min="1"
                  required
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#E81D3A] outline-none font-bold text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="dueDate"
                  required
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#E81D3A] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Remarks / Notes
              </label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Optional notes..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#E81D3A] outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || !formData.studentRegNo}
              className="px-8 py-3 bg-gradient-to-r from-[#E81D3A] to-[#c21830] text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Receipt className="w-5 h-5" /> Generate Challan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* STATS SECTION */}
      {formData.studentRegNo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Total Generated
              </p>
              <h3 className="text-xl font-black text-slate-800">
                {totalGeneratedCount}{" "}
                <span className="text-sm font-bold text-slate-400">
                  Challans
                </span>
              </h3>
              <p className="text-xs font-bold text-indigo-600 mt-0.5">
                {fmt(totalAmount)}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-200 transition-colors">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Total Collected
              </p>
              <h3 className="text-xl font-black text-slate-800">
                {fmt(totalPaidAmount)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-rose-200 transition-colors">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Pending Dues
              </p>
              <h3 className="text-xl font-black text-slate-800">
                {fmt(totalPendingAmount)}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-center">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            Records for{" "}
            {studentsList.find((s) => s.studentId === formData.studentRegNo)
              ?.personalInfo?.fullName || "Selected Profile"}
            {fetching && (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            )}
          </h2>
          <span className="bg-[#eef2ff] text-[#6366f1] text-xs font-bold px-3 py-1 rounded-full">
            {challans.length} Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-4">Ref #</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Net Payable</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challans.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    No records found. Select an organization profile to view
                    history.
                  </td>
                </tr>
              ) : (
                challans.map((c) => {
                  const isVoid =
                    c.status === "cancelled" ||
                    c.status === "merged" ||
                    c.isDeleted;
                  const isPaid = c.status === "paid";

                  return (
                    <tr
                      key={c._id}
                      className={`transition-colors ${isVoid ? "bg-slate-50/50" : "hover:bg-slate-50"}`}
                    >
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-700">
                          {c.challanNo}
                        </div>
                        {isVoid && (
                          <span className="text-[10px] text-rose-500 font-bold uppercase">
                            Soft Deleted
                          </span>
                        )}
                      </td>
                      <td
                        className={`p-4 font-medium text-xs align-top ${isVoid ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {new Date(c.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 align-top">
                        <div
                          className={`font-bold ${isVoid ? "text-slate-400" : "text-slate-900"}`}
                        >
                          {fmt(c.netAmount)}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={c.status} isVoid={isVoid} />
                          {isPaid && c.paymentRemark && (
                            <div
                              className="flex items-start gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded w-fit max-w-[150px]"
                              title={c.paymentRemark}
                            >
                              <MessageSquare
                                size={10}
                                className="shrink-0 mt-0.5"
                              />
                              <span className="truncate">
                                {c.paymentRemark}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top flex justify-end gap-1">
                        {/* Actions */}
                        <button
                          onClick={() => setDetailModalData(c)}
                          className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 border border-indigo-100"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {!isVoid && !isPaid && (
                          <>
                            <button
                              onClick={() => setPayModalId(c._id)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-100"
                              title="Mark Paid"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteModalId(c._id)}
                              className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 border border-rose-100"
                              title="Void Challan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {isPaid && c.paymentProof && (
                          <a
                            href={c.paymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-100"
                            title="View Proof"
                          >
                            <ImageIcon size={14} />
                          </a>
                        )}
                        {!isVoid && (
                          <button
                            onClick={() => handlePrint(c)}
                            className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 border border-slate-200"
                            title="Print Challan"
                          >
                            <Printer size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MarkPaidModal
        isOpen={!!payModalId}
        onClose={() => setPayModalId(null)}
        isLoading={isPaying}
        onConfirm={handlePay}
      />
      <DetailModal
        isOpen={!!detailModalData}
        onClose={() => setDetailModalData(null)}
        data={detailModalData}
      />

      {!!deleteModalId && (
        <ModalOverlay
          title="Confirm Deletion"
          onClose={() => setDeleteModalId(null)}
        >
          <div className="space-y-4">
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm border border-rose-100 flex gap-3">
              <AlertTriangle size={24} className="shrink-0" />
              <p>
                Are you sure you want to permanently void this challan? This
                action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Yes, Void Challan"
              )}
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default MisFeeView;
