import React, { useEffect } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import {
  X,
  Plus,
  Trash2,
  Calculator,
  Settings2,
  Info,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Receipt,
} from "lucide-react";

const ChallanSettingsModal = ({
  isOpen,
  onClose,
  activeTab,
  control,
  errors,
  watch,
  setValue,
  onSubmit,
  feeHeadOptions,
  generateBreakdown,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "feeItems",
  });

  // Watch necessary fields for dynamic rendering
  const watchedTotalRec = watch("totalRecurringFee");
  const watchedTotalOne = watch("totalOneTimeFee");
  const watchedSecurity = watch("securityFee");
  const watchedRegistration = watch("registrationFee"); // ✅ ADDED REGISTRATION FEE
  const watchedItems = watch("feeItems");

  if (!isOpen) return null;

  const tabNames = [
    "Academic (Tuition)",
    "Admission (Fresh)",
    "Re-Admission",
    "Exam Fee",
    "Miscellaneous / General",
    "Basic Fee (Semester)",
  ];

  const handleAutoGenerate = () => {
    const baseAmount =
      activeTab === 0 || activeTab === 3 || activeTab === 5
        ? Number(watchedTotalRec)
        : Number(watchedTotalOne);
    const secAmount = Number(watchedSecurity) || 0;

    if (!baseAmount || baseAmount <= 0) {
      alert("Please enter a Total Base Amount first to generate a breakdown.");
      return;
    }

    const generatedItems = generateBreakdown(baseAmount, activeTab, secAmount);
    setValue("feeItems", generatedItems, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Calculate the running total of the breakdown to show the user if it matches the Base Amount
  const currentBreakdownTotal =
    watchedItems?.reduce((acc, item) => acc + (Number(item.amount) || 0), 0) ||
    0;
  const targetAmount =
    activeTab === 0 || activeTab === 3 || activeTab === 5
      ? Number(watchedTotalRec)
      : Number(watchedTotalOne);
  const mathDiff = targetAmount - currentBreakdownTotal;
  const isBalanced = targetAmount > 0 && Math.abs(mathDiff) < 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              <Settings2 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Configure {tabNames[activeTab]}
              </h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                Fee Structure Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 sr-scroll">
          {/* ======================================= */}
          {/* TAB 4: MISCELLANEOUS (Simple Form)      */}
          {/* ======================================= */}
          {activeTab === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex gap-3 text-blue-800 shadow-sm">
                <Info size={20} className="shrink-0 mt-0.5 text-blue-600" />
                <p className="text-sm font-semibold leading-relaxed">
                  Miscellaneous fees are standalone, general-purpose templates
                  (e.g., Degree Issuance, Transcript Fee). They apply globally
                  and do not require Program or Session bindings.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    Fee Name / Description{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="miscellaneousRemark"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="e.g. Transcript Issuance Fee"
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-semibold text-slate-800 shadow-sm"
                      />
                    )}
                  />
                  {errors.miscellaneousRemark && (
                    <p className="text-xs text-rose-500 mt-1.5 font-semibold">
                      {errors.miscellaneousRemark.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    Fee Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      Rs
                    </span>
                    <Controller
                      name="miscellaneousFee"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-black text-lg jmono text-slate-800 shadow-sm"
                        />
                      )}
                    />
                  </div>
                  {errors.miscellaneousFee && (
                    <p className="text-xs text-rose-500 mt-1.5 font-semibold">
                      {errors.miscellaneousFee.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* TABS 0-3, 5: COMPLEX ACADEMIC STRUCTURES */}
          {/* ======================================= */}
          {activeTab !== 4 && (
            <div className="space-y-8">
              {/* Top Configuration Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                {/* Academic/Exam/Basic Level Config (Tabs 0, 3, 5) */}
                {(activeTab === 0 || activeTab === 3 || activeTab === 5) && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Duration Level
                      </label>
                      <Controller
                        name="academicLevel"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-slate-700"
                          >
                            <option value="SEMESTER">Semester</option>
                            <option value="YEAR">Year</option>
                          </select>
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Level Number <span className="text-rose-500">*</span>
                      </label>
                      <Controller
                        name="levelNumber"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="1"
                            placeholder="e.g. 1"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-black text-slate-800"
                          />
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Base Amount Config */}
                <div
                  className={
                    activeTab === 1 || activeTab === 2
                      ? "lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6"
                      : ""
                  }
                >
                  <div>
                    <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                      Total Base Amount (PKR){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        Rs
                      </span>
                      <Controller
                        name={
                          activeTab === 0 || activeTab === 3 || activeTab === 5
                            ? "totalRecurringFee"
                            : "totalOneTimeFee"
                        }
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="0"
                            className="w-full pl-11 pr-4 py-3 bg-indigo-50/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none font-black text-lg jmono text-indigo-900 shadow-sm transition-all"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* ✅ ADDED REGISTRATION FEE & SECURITY (Tab 1 & 2) */}
                  {(activeTab === 1 || activeTab === 2) && (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                          Registration Fee (PKR)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                            Rs
                          </span>
                          <Controller
                            name="registrationFee"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="number"
                                min="0"
                                placeholder="0"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                              />
                            )}
                          />
                        </div>
                      </div>

                      {/* Security Deposit only typically on Fresh Admission */}
                      {activeTab === 1 && (
                        <div>
                          <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                            Security Deposit (Refundable)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                              Rs
                            </span>
                            <Controller
                              name="securityFee"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="w-full pl-11 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl outline-none font-bold text-amber-900"
                                />
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Fee Breakdown Engine */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <Receipt size={18} className="text-indigo-500" />{" "}
                      Mathematical Breakdown
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                      Sum of sub-heads must equal the Total Base Amount.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAutoGenerate}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      <Wand2 size={14} /> Auto-Generate
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          headId: "",
                          isPercentage: false,
                          percentageValue: 0,
                          amount: 0,
                          frequency: "ONCE",
                        })
                      }
                      className="flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/30">
                  {fields.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                      <Calculator size={36} className="mb-3 text-slate-300" />
                      <p className="font-bold text-slate-600">
                        No Breakdown Added
                      </p>
                      <p className="text-xs font-medium mt-1">
                        Click Auto-Generate to create standard percentages
                        automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 transition-colors group"
                        >
                          {/* Head Selection */}
                          <div className="w-full md:flex-1">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                              Fee Head
                            </label>
                            <Controller
                              name={`feeItems.${index}.headId`}
                              control={control}
                              render={({ field }) => (
                                <select
                                  {...field}
                                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-slate-700"
                                >
                                  <option value="">Select Head...</option>
                                  {feeHeadOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            />
                          </div>

                          {/* Percentage Toggle */}
                          <div className="w-1/2 md:w-32">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                              Calc. Mode
                            </label>
                            <Controller
                              name={`feeItems.${index}.isPercentage`}
                              control={control}
                              render={({ field }) => (
                                <button
                                  type="button"
                                  onClick={() => field.onChange(!field.value)}
                                  className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors ${field.value ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                                >
                                  {field.value ? "% Percentage" : "Fixed Rs"}
                                </button>
                              )}
                            />
                          </div>

                          {/* Dynamic Input (Pct or Fixed) */}
                          <div className="w-1/2 md:w-40 relative">
                            {watchedItems[index]?.isPercentage ? (
                              <>
                                <label className="block text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 ml-1">
                                  Percent (%)
                                </label>
                                <div className="relative">
                                  <Controller
                                    name={`feeItems.${index}.percentageValue`}
                                    control={control}
                                    render={({ field }) => (
                                      <input
                                        {...field}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="any"
                                        className="w-full pl-4 pr-8 py-2.5 text-sm bg-indigo-50/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-indigo-900"
                                      />
                                    )}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-xs">
                                    %
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <label className="block text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">
                                  Amount (PKR)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">
                                    Rs
                                  </span>
                                  <Controller
                                    name={`feeItems.${index}.amount`}
                                    control={control}
                                    render={({ field }) => (
                                      <input
                                        {...field}
                                        type="number"
                                        min="0"
                                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-100 outline-none font-bold jmono text-emerald-900"
                                      />
                                    )}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Real-time calculated display for percentages */}
                          {watchedItems[index]?.isPercentage && (
                            <div className="hidden lg:block w-32 px-4 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-right shrink-0 mt-5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                                Equals
                              </span>
                              <span className="text-sm font-black jmono text-slate-700">
                                {Math.round(
                                  (targetAmount *
                                    (watchedItems[index].percentageValue ||
                                      0)) /
                                    100,
                                )}
                              </span>
                            </div>
                          )}

                          {/* Delete Button */}
                          <div className="shrink-0 mt-5 md:mt-0 self-end md:self-auto">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all shadow-sm"
                            >
                              <Trash2 size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Math Validation Footer */}
                  {fields.length > 0 && (
                    <div
                      className={`mt-6 p-5 rounded-2xl border flex items-center justify-between transition-colors ${isBalanced ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}
                    >
                      <div className="flex items-center gap-3">
                        {isBalanced ? (
                          <CheckCircle2
                            size={24}
                            className="text-emerald-500"
                          />
                        ) : (
                          <AlertTriangle size={24} className="text-rose-500" />
                        )}
                        <div>
                          <p
                            className={`font-black text-sm ${isBalanced ? "text-emerald-800" : "text-rose-800"}`}
                          >
                            {isBalanced
                              ? "Breakdown perfectly matches Base Amount"
                              : "Math Mismatch"}
                          </p>
                          {!isBalanced && (
                            <p className="text-xs font-semibold text-rose-600 mt-0.5">
                              Difference:{" "}
                              <span className="jmono font-bold">
                                Rs {Math.abs(mathDiff)}
                              </span>{" "}
                              {mathDiff > 0
                                ? "remaining to allocate"
                                : "over-allocated"}
                              .
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Total Breakdown Sum
                        </p>
                        <p
                          className={`text-xl font-black jmono leading-none ${isBalanced ? "text-emerald-700" : "text-rose-700"}`}
                        >
                          Rs {currentBreakdownTotal}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-100"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanSettingsModal;
