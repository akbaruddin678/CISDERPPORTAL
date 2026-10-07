import React, { useState, useEffect } from "react";
import { X, Calendar, Percent, Clock, AlertCircle } from "lucide-react";

const CreateInstallmentPlanModal = ({ isOpen, onClose, controllerData }) => {
  const { isCreatingPlan, handleCreatePlan } = controllerData;

  const [formData, setFormData] = useState({
    name: "",
    numberOfInstallments: 3,
    intervalDays: 30,
    isActive: true,
    // Store specific details for each installment
    installments: [],
  });

  const [useCustomDates, setUseCustomDates] = useState(false);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);

  // Common templates for quick setup
  const commonConfigs = [
    { label: "Bi-Monthly", sub: "2 Months", installments: 2, interval: 60 },
    { label: "Quarterly", sub: "3 Months", installments: 3, interval: 90 },
    { label: "Monthly-3", sub: "30 Days", installments: 3, interval: 30 },
    { label: "Monthly-4", sub: "30 Days", installments: 4, interval: 30 },
  ];

  // Initialize installments when configuration changes
  useEffect(() => {
    if (!useCustomDates) {
      const count = parseInt(formData.numberOfInstallments) || 0;
      const interval = parseInt(formData.intervalDays) || 30;

      if (count > 0) {
        // 1. Precise Percentage Split Logic
        // Calculate base percentage
        const rawSplit = 100 / count;
        // Fix to 2 decimal places
        const basePercent = parseFloat(rawSplit.toFixed(2));
        // Calculate difference caused by rounding
        const diff = 100 - basePercent * count;

        const newInstallments = Array.from({ length: count }, (_, i) => {
          // Add the difference to the last installment to ensure exactly 100%
          let percent = basePercent;
          if (i === count - 1) {
            percent = parseFloat((basePercent + diff).toFixed(2));
          }

          // 2. Date Calculation Logic
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + (i + 1) * interval);

          return {
            number: i + 1,
            dueDate: nextDate.toISOString().split("T")[0],
            percentage: percent,
          };
        });

        setFormData((prev) => ({ ...prev, installments: newInstallments }));
      }
    }
  }, [formData.numberOfInstallments, formData.intervalDays, useCustomDates]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleInstallmentChange = (index, field, value) => {
    const updated = [...formData.installments];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, installments: updated }));
    // If user manually edits, enable custom mode to prevent auto-overwrite
    if (!useCustomDates) setUseCustomDates(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Plan Name is required";
    if (formData.numberOfInstallments < 1)
      newErrors.numberOfInstallments = "Invalid count";

    // Validate Percentages Sum
    const totalPercent = formData.installments.reduce(
      (sum, item) => sum + parseFloat(item.percentage || 0),
      0
    );
    // Allow tiny floating point margin error (0.01)
    if (Math.abs(totalPercent - 100) > 0.01) {
      newErrors.general = `Total percentage must equal 100% (Current: ${totalPercent.toFixed(
        2
      )}%)`;
    }

    // Validate Dates
    const hasEmptyDates = formData.installments.some((i) => !i.dueDate);
    if (hasEmptyDates) newErrors.general = "All due dates must be selected";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name,
      numberOfInstallments: parseInt(formData.numberOfInstallments),
      // If custom dates are used, we might set interval to 0 or average,
      // but usually keeping the base interval is fine for reference.
      intervalDays: parseInt(formData.intervalDays),
      isActive: formData.isActive,
      customSchedule: formData.installments.map((i) => ({
        installmentNumber: i.number,
        specificDueDate: i.dueDate,
        percentage: parseFloat(i.percentage),
      })),
    };

    const res = await handleCreatePlan(payload);

    if (res.success) {
      setResult({ type: "success", message: res.message });
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1500);
    } else {
      setResult({ type: "error", message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              New Installment Plan
            </h2>
            <p className="text-xs text-slate-500">
              Configure payment split and schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/50">
          {/* Messages */}
          {result && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                result.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.type === "error" && <AlertCircle size={16} />}
              {result.message}
            </div>
          )}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} /> {errors.general}
            </div>
          )}

          <form id="createForm" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Quick Configs */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Quick Templates
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {commonConfigs.map((cfg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUseCustomDates(false);
                      setFormData((p) => ({
                        ...p,
                        numberOfInstallments: cfg.installments,
                        intervalDays: cfg.interval,
                      }));
                    }}
                    className="border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 rounded-lg p-3 text-left transition-all group shadow-sm"
                  >
                    <div className="font-semibold text-slate-700 text-sm group-hover:text-indigo-700">
                      {cfg.label}
                    </div>
                    <div className="text-xs text-slate-400 group-hover:text-indigo-500">
                      {cfg.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Main Configuration */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-2.5 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ${
                      errors.name ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="e.g. Semester Spring 2026 Plan"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Installments
                  </label>
                  <select
                    name="numberOfInstallments"
                    value={formData.numberOfInstallments}
                    onChange={(e) => {
                      setUseCustomDates(false);
                      handleChange(e);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {[2, 3, 4, 5, 6, 9, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Interval
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="intervalDays"
                      value={formData.intervalDays}
                      onChange={(e) => {
                        setUseCustomDates(false);
                        handleChange(e);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                      Days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Detailed Schedule */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Installment Breakdown
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="customMode"
                    checked={useCustomDates}
                    onChange={(e) => setUseCustomDates(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="customMode"
                    className="text-xs text-slate-600 cursor-pointer select-none"
                  >
                    Manual Edit Mode
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                {formData.installments.map((inst, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors"
                  >
                    {/* Badge */}
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                      {inst.number}
                    </div>

                    {/* Date */}
                    <div className="flex-1">
                      <div className="relative">
                        <Calendar
                          size={14}
                          className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"
                        />
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) =>
                            handleInstallmentChange(
                              idx,
                              "dueDate",
                              e.target.value
                            )
                          }
                          className={`w-full text-sm pl-8 pr-2 py-1.5 border rounded-md focus:border-indigo-500 outline-none transition-all ${
                            useCustomDates
                              ? "bg-white border-slate-300"
                              : "bg-slate-50 border-transparent text-slate-600 cursor-default"
                          }`}
                          readOnly={!useCustomDates}
                        />
                      </div>
                    </div>

                    {/* Percentage */}
                    <div className="w-28 relative">
                      <Percent
                        size={14}
                        className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="number"
                        value={inst.percentage}
                        onChange={(e) =>
                          handleInstallmentChange(
                            idx,
                            "percentage",
                            e.target.value
                          )
                        }
                        className={`w-full text-sm pl-3 pr-8 py-1.5 border rounded-md focus:border-indigo-500 outline-none transition-all font-medium ${
                          useCustomDates
                            ? "bg-white border-slate-300"
                            : "bg-slate-50 border-transparent text-slate-600 cursor-default"
                        }`}
                        readOnly={!useCustomDates}
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Check */}
              <div className="flex justify-end mt-2">
                <span
                  className={`text-xs font-bold ${
                    Math.abs(
                      formData.installments.reduce(
                        (a, b) => a + parseFloat(b.percentage || 0),
                        0
                      ) - 100
                    ) < 0.1
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  Total:{" "}
                  {formData.installments
                    .reduce((a, b) => a + parseFloat(b.percentage || 0), 0)
                    .toFixed(2)}
                  %
                </span>
              </div>
            </div>

            {/* 4. Footer Toggles */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors w-fit">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Plan Active Status
                </span>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="createForm"
            disabled={isCreatingPlan}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isCreatingPlan ? <>Creating...</> : <>Create Plan</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInstallmentPlanModal;
