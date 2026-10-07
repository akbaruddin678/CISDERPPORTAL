import React from "react";
import { Plus, X, Wallet, Download } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_META = {
  Generated: "bg-gray-100 text-gray-700",
  Approved: "bg-blue-100 text-blue-800",
  Paid: "bg-green-100 text-green-800",
};

const HrPayrollView = ({
  month,
  setMonth,
  year,
  setYear,
  staffList = [],
  slips = [],
  isFetching,

  showGenerateModal,
  openGenerateModal,
  closeGenerateModal,
  formData,
  handleFormChange,
  handleStaffSelect,
  isSuggesting,
  addLineItem,
  updateLineItem,
  removeLineItem,
  handleGenerate,
  isGenerating,

  handleApprove,
  handleMarkPaid,
  handleDownloadPayslip,
  isUpdating,
}) => {
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Payroll &amp; Salary</h1>
            <p className="text-gray-600 mt-1">Generate and track monthly payroll slips.</p>
          </div>
          <button
            onClick={openGenerateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> Generate Slip
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-md">
            {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetching ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : slips.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Wallet className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No payroll slips for this month yet.
                    </td>
                  </tr>
                ) : (
                  slips.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {s.staffId?.personalInfo?.name || "Unknown"}
                        <div className="text-xs text-gray-400">{s.staffId?.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{s.basicSalary}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{s.netPayable}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_META[s.status] || "bg-gray-100 text-gray-800"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          {s.status === "Generated" && (
                            <button onClick={() => handleApprove(s)} disabled={isUpdating} className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">
                              Approve
                            </button>
                          )}
                          {s.status === "Approved" && (
                            <button onClick={() => handleMarkPaid(s)} disabled={isUpdating} className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50">
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPayslip(s)}
                            title="Download Payslip"
                            className="text-gray-500 hover:text-gray-800 flex items-center gap-1"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Generate Payroll Slip</h3>
              <button onClick={closeGenerateModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff *</label>
                <select
                  value={formData.staffId}
                  onChange={(e) => handleStaffSelect(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select staff</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>{s.personalInfo?.name} ({s.employeeId})</option>
                  ))}
                </select>
                {isSuggesting && (
                  <p className="text-xs text-blue-600 mt-1">Loading salary details from employment record...</p>
                )}
                {!isSuggesting && formData.staffId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pre-filled from the employee's payroll record and this month's attendance/leave — edit freely below.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select value={formData.month} onChange={(e) => handleFormChange("month", Number(e.target.value))} className="w-full p-2 border rounded-md">
                    {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" value={formData.year} onChange={(e) => handleFormChange("year", Number(e.target.value))} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary *</label>
                  <input type="number" value={formData.basicSalary} onChange={(e) => handleFormChange("basicSalary", e.target.value)} required className="w-full p-2 border rounded-md" />
                </div>
              </div>

              {["allowances", "deductions"].map((type) => (
                <div key={type}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 capitalize">{type}</label>
                    <button type="button" onClick={() => addLineItem(type)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add Line</button>
                  </div>
                  {formData[type].map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text" placeholder="Name" value={item.name}
                        onChange={(e) => updateLineItem(type, i, "name", e.target.value)}
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                      <input
                        type="number" placeholder="Amount" value={item.amount}
                        onChange={(e) => updateLineItem(type, i, "amount", e.target.value)}
                        className="w-28 p-2 border rounded-md text-sm"
                      />
                      <button type="button" onClick={() => removeLineItem(type, i)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeGenerateModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isGenerating} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isGenerating ? "Generating..." : "Generate Slip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrPayrollView;
