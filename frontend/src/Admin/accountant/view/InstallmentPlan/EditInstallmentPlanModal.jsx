import React, { useState, useEffect } from "react";
import { X, Save, AlertTriangle, Calendar, Percent } from "lucide-react";

const EditInstallmentPlanModal = ({
  isOpen,
  onClose,
  plan,
  controllerData,
}) => {
  const { isUpdatingPlan, handleUpdatePlan } = controllerData;

  const [formData, setFormData] = useState({
    name: "",
    isActive: true,
    numberOfInstallments: "",
    intervalDays: "",
  });

  const [schedule, setSchedule] = useState([]);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [result, setResult] = useState(null);

  // Initialize Form Data from Plan
  useEffect(() => {
    if (plan) {
      const isCustom = plan.scheduleConfig && plan.scheduleConfig.length > 0;

      setFormData({
        name: plan.name || "",
        isActive: plan.isActive,
        numberOfInstallments: plan.numberOfInstallments || "",
        intervalDays: plan.intervalDays || 30,
      });

      setUseCustomDates(isCustom);

      if (isCustom) {
        // Load existing custom schedule
        setSchedule(
          plan.scheduleConfig.map((item) => ({
            number: item.installmentNumber,
            dueDate: item.specificDueDate
              ? item.specificDueDate.split("T")[0]
              : "",
            percentage: item.percentage,
          }))
        );
      } else {
        // Generate default schedule based on interval
        generateSchedule(plan.numberOfInstallments, plan.intervalDays || 30);
      }
    }
  }, [plan]);

  // Helper to generate default schedule
  const generateSchedule = (count, interval) => {
    const numCount = parseInt(count) || 0;
    const numInterval = parseInt(interval) || 30;

    if (numCount <= 0) return setSchedule([]);

    // Calculate percentages
    const basePercent = parseFloat((100 / numCount).toFixed(2));
    const diff = 100 - basePercent * numCount;

    const newSchedule = Array.from({ length: numCount }, (_, i) => {
      // Dates are relative for interval mode, but we show placeholders here
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (i + 1) * numInterval);

      let percent = basePercent;
      if (i === numCount - 1)
        percent = parseFloat((basePercent + diff).toFixed(2));

      return {
        number: i + 1,
        dueDate: nextDate.toISOString().split("T")[0],
        percentage: percent,
      };
    });
    setSchedule(newSchedule);
  };

  // Re-generate schedule when main inputs change (if not in custom mode)
  useEffect(() => {
    if (
      !useCustomDates &&
      formData.numberOfInstallments &&
      formData.intervalDays
    ) {
      generateSchedule(formData.numberOfInstallments, formData.intervalDays);
    }
  }, [formData.numberOfInstallments, formData.intervalDays, useCustomDates]);

  if (!isOpen || !plan) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
    if (!useCustomDates) setUseCustomDates(true); // Switch to custom mode on edit
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    // Validate Total Percentage
    const totalPercent = schedule.reduce(
      (sum, item) => sum + parseFloat(item.percentage || 0),
      0
    );
    if (Math.abs(totalPercent - 100) > 0.1) {
      setResult({
        type: "error",
        message: `Total percentage must equal 100% (Current: ${totalPercent.toFixed(
          2
        )}%)`,
      });
      return;
    }

    // Construct Payload
    const payload = {
      name: formData.name,
      isActive: formData.isActive,
      numberOfInstallments: parseInt(formData.numberOfInstallments),
      // If using custom dates, we might set interval to 0 or keep reference
      intervalDays: parseInt(formData.intervalDays),
      // Send the schedule config
      customSchedule: schedule.map((item) => ({
        installmentNumber: item.number,
        specificDueDate: item.dueDate, // Send date string, backend handles parsing
        percentage: parseFloat(item.percentage),
      })),
    };

    const res = await handleUpdatePlan(plan._id, payload);

    if (res?.success) {
      setResult({ type: "success", message: "Plan updated successfully" });
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1500);
    } else {
      setResult({ type: "error", message: res?.message || "Update failed" });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/50">
          {result && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                result.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}

          <form id="editForm" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Main Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Installments
                  </label>
                  <select
                    name="numberOfInstallments"
                    value={formData.numberOfInstallments}
                    onChange={(e) => {
                      setUseCustomDates(false);
                      handleChange(e);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    {[2, 3, 4, 5, 6, 9, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
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
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                      Days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Schedule */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Installment Breakdown
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editCustomMode"
                    checked={useCustomDates}
                    onChange={(e) => setUseCustomDates(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="editCustomMode"
                    className="text-xs text-slate-600 cursor-pointer select-none font-medium"
                  >
                    Manual Edit Mode
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                {schedule.map((inst, idx) => (
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
                            handleScheduleChange(idx, "dueDate", e.target.value)
                          }
                          className={`w-full text-sm pl-8 pr-2 py-1.5 border rounded-md focus:border-indigo-500 outline-none transition-all ${
                            useCustomDates
                              ? "bg-white border-slate-300"
                              : "bg-slate-50 border-transparent text-slate-500 cursor-default"
                          }`}
                          readOnly={!useCustomDates}
                        />
                      </div>
                    </div>

                    {/* Percentage */}
                    <div className="w-24 relative">
                      <Percent
                        size={14}
                        className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="number"
                        value={inst.percentage}
                        onChange={(e) =>
                          handleScheduleChange(
                            idx,
                            "percentage",
                            e.target.value
                          )
                        }
                        className={`w-full text-sm pl-3 pr-7 py-1.5 border rounded-md focus:border-indigo-500 outline-none text-right font-medium ${
                          useCustomDates
                            ? "bg-white border-slate-300"
                            : "bg-slate-50 border-transparent text-slate-500 cursor-default"
                        }`}
                        readOnly={!useCustomDates}
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Check */}
              <div className="flex justify-end mt-2 px-1">
                <span
                  className={`text-xs font-bold ${
                    Math.abs(
                      schedule.reduce(
                        (a, b) => a + parseFloat(b.percentage || 0),
                        0
                      ) - 100
                    ) < 0.1
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  Total:{" "}
                  {schedule
                    .reduce((a, b) => a + parseFloat(b.percentage || 0), 0)
                    .toFixed(2)}
                  %
                </span>
              </div>
            </div>

            {/* 3. Active Toggle */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-100 rounded-xl transition-colors w-fit">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">
                    Active Status
                  </span>
                  <span className="block text-xs text-slate-500">
                    {formData.isActive ? "Plan is active" : "Plan is archived"}
                  </span>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="editForm"
            disabled={isUpdatingPlan}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isUpdatingPlan ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInstallmentPlanModal;
