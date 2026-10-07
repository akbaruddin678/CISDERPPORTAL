import React, { useState } from "react";
import { X, Save, Percent, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react";

// 1. Destructure 'handleCreatePlan' from props
const CreateScholarshipPlanModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  handleCreatePlan,
  terms = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "percentage",
    maxAmount: "",
    maxPercentage: "",
    termId: "",
    active: true,
    validFrom: new Date().toISOString().split("T")[0],
    validTo: "",
    remark: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Plan title is required";
    if (formData.type === "fixed" && !formData.maxAmount) {
      newErrors.maxAmount = "Maximum amount is required for fixed type";
    }
    if (formData.type === "percentage" && !formData.maxPercentage) {
      newErrors.maxPercentage =
        "Maximum percentage is required for percentage type";
    }
    if (formData.maxPercentage && parseFloat(formData.maxPercentage) > 100) {
      newErrors.maxPercentage = "Percentage cannot exceed 100%";
    }
    if (
      formData.validTo &&
      formData.validFrom &&
      new Date(formData.validTo) < new Date(formData.validFrom)
    ) {
      newErrors.validTo = "Valid To date must be after Valid From date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare data for backend
      const submitData = {
        title: formData.title,
        description: formData.description || "",
        type: formData.type,
        termId: formData.termId || null,
        active: formData.active,
        validFrom: formData.validFrom
          ? new Date(formData.validFrom).toISOString()
          : null,
        validTo: formData.validTo
          ? new Date(formData.validTo).toISOString()
          : null,
        remark: formData.remark || "",
      };

      // Add type-specific fields
      if (formData.type === "fixed") {
        submitData.maxAmount = parseFloat(formData.maxAmount);
      } else if (formData.type === "percentage") {
        submitData.maxPercentage = parseFloat(formData.maxPercentage);
      }

      const result = await handleCreatePlan(submitData);

      if (result && result.success) {
        if (onSuccess) onSuccess("Scholarship plan created successfully!");
        onClose();
      } else {
        if (onError) onError(result?.message || "Failed to create plan");
      }
    } catch (error) {
      console.error("Submission error:", error);
      if (onError) onError(error.message || "Failed to create plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Create Scholarship Plan
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Define a new scholarship plan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Identity */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  className={`w-full bg-slate-50 border-none ring-1 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700 ${
                    errors.title ? "ring-rose-300" : "ring-slate-200"
                  }`}
                  placeholder="e.g. Merit Scholarship 2024"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                {errors.title && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium ml-1">
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium text-slate-600 resize-none"
                  placeholder="Describe eligibility criteria..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 2. Logic Type */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest ml-1">
                Allocation Logic
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "percentage" })
                  }
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold ${
                    formData.type === "percentage"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Percent size={20} /> Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "fixed" })}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold ${
                    formData.type === "fixed"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                      : "border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <DollarSign size={20} /> Fixed Amount
                </button>
              </div>
            </div>

            {/* 3. Value Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">
                {formData.type === "percentage"
                  ? "Percentage Value (0-100)"
                  : "Maximum Amount (Rs)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  className={`w-full bg-white border-none ring-1 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-xl text-slate-800 shadow-sm ${
                    errors.maxAmount || errors.maxPercentage
                      ? "ring-rose-300"
                      : "ring-slate-300"
                  }`}
                  value={
                    formData.type === "percentage"
                      ? formData.maxPercentage
                      : formData.maxAmount
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [formData.type === "percentage"
                        ? "maxPercentage"
                        : "maxAmount"]: e.target.value,
                    })
                  }
                  min="0"
                  max={formData.type === "percentage" ? "100" : undefined}
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  {formData.type === "percentage" ? (
                    <Percent size={20} />
                  ) : (
                    <span className="text-sm font-black">Rs</span>
                  )}
                </div>
              </div>
              {(errors.maxAmount || errors.maxPercentage) && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium ml-1">
                  {errors.maxAmount || errors.maxPercentage}
                </p>
              )}
            </div>

            {/* 3b. Term / Session — optional, "Any Term" leaves the plan
                date-validity based instead of tied to one specific session. */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">
                Term / Session (Optional)
              </label>
              <select
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-slate-700"
                value={formData.termId}
                onChange={(e) =>
                  setFormData({ ...formData, termId: e.target.value })
                }
              >
                <option value="">Any Term</option>
                {terms.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">
                  End Date (Optional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className={`w-full bg-slate-50 border-none ring-1 rounded-2xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 ${
                      errors.validTo ? "ring-rose-300" : "ring-slate-200"
                    }`}
                    value={formData.validTo}
                    onChange={(e) =>
                      setFormData({ ...formData, validTo: e.target.value })
                    }
                    min={formData.validFrom}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                </div>
                {errors.validTo && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium ml-1">
                    {errors.validTo}
                  </p>
                )}
              </div>
            </div>

            {/* 5. Remark */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest ml-1">
                Remark / Internal Note
              </label>
              <textarea
                rows="3"
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium text-slate-600 resize-none"
                placeholder="Enter any internal remarks or notes here..."
                value={formData.remark}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
              />
            </div>

            {/* 6. Active Toggle */}
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    formData.active
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {formData.active ? (
                    <CheckCircle size={20} />
                  ) : (
                    <XCircle size={20} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Activate Immediately
                  </p>
                  <p className="text-xs text-slate-400">
                    {formData.active
                      ? "Selectable for new applications right away"
                      : "Saved but not selectable until activated"}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSubmitting ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateScholarshipPlanModal;
