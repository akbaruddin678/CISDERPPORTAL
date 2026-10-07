import React, { useEffect, useState } from "react";
import {
  Save,
  X,
  Zap,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Banknote,
} from "lucide-react";
import { Switch } from "@mui/material";
import { Controller, useFieldArray } from "react-hook-form";
import InputField from "../../../../shared/shared/InputField/UI/InputField";

const FEE_TITLES = [
  "Tuition Fee",
  "Admission Setup",
  "Re-Admission Setup",
  "Exam Fee",
];

const formatPKR = (val) =>
  Number(val || 0).toLocaleString("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  });

const StudentFeeModal = (props) => {
  const {
    isOpen,
    onClose,
    onSubmit,
    control,
    errors,
    watch,
    setValue,
    activeTab,
    feeHeadOptions = [],
    generateBreakdown,
    loadingHeads,
  } = props;

  const [isAutoMode, setIsAutoMode] = useState(true);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "feeItems",
  });

  const totalAmount = Number(watch("totalAmount") || 0);
  const feeItems = watch("feeItems") || [];

  const admissionFee = Number(watch("admissionFee") || 0);
  const registrationFee = Number(watch("registrationFee") || 0);
  const securityFee = Number(watch("securityFee") || 0);
  const admissionTotal = admissionFee + registrationFee + securityFee;

  const title = FEE_TITLES[activeTab] || "Fee Setup";
  const isAdmission = activeTab === 1 || activeTab === 2;
  const isAcademic = activeTab === 0 || activeTab === 3;

  useEffect(() => {
    if (!isAutoMode || !isOpen || !isAcademic) return;
    if (totalAmount > 0) {
      const items = generateBreakdown(totalAmount, activeTab);
      if (items.length > 0) setValue("feeItems", items, { shouldDirty: true });
    }
  }, [totalAmount, isAutoMode, activeTab, isOpen, isAcademic]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit(e);
  };

  const breakdownTotal = feeItems.reduce(
    (s, i) => s + (Number(i.amount) || 0),
    0,
  );
  const mathDiff = totalAmount - breakdownTotal;
  const isBalanced = totalAmount > 0 && Math.abs(mathDiff) < 1;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-base">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmission
                ? "Configure straightforward processing fees"
                : "Define mathematical breakdown"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAcademic && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-500">
                  Auto-calc
                </span>
                <Switch
                  checked={isAutoMode}
                  onChange={(e) => setIsAutoMode(e.target.checked)}
                  size="small"
                />
              </label>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 sr-scroll">
            {/* Fee Title — only Exam needs a named sub-fee (e.g. "Supplementary
                Exam" vs "Exam Fee" as separate records for the same student).
                Tuition has exactly one fee per term, so the field is dropped
                there and a fixed title is used instead (see controller). */}
            {activeTab !== 0 && (
              <div className="bg-white">
                <InputField
                  name="title"
                  control={control}
                  label="Fee Title (e.g. Supplementary Exam)"
                  placeholder={
                    activeTab === 3
                      ? "e.g., Mid-Term, Supplementary Exam..."
                      : "e.g., Standard Admission Setup..."
                  }
                  errors={errors}
                  type="text"
                />
              </div>
            )}

            {/* ======================= */}
            {/* ADMISSION TABS (1 & 2)  */}
            {/* ======================= */}
            {isAdmission && (
              <div className="space-y-4">
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex gap-3 text-emerald-800">
                  <Banknote
                    size={18}
                    className="shrink-0 mt-0.5 text-emerald-500"
                  />
                  <p className="text-xs font-medium leading-relaxed">
                    Set specific intake fees. These will automatically be
                    consolidated into the student's admission record.
                  </p>
                </div>

                <div className="space-y-3">
                  <InputField
                    name="admissionFee"
                    control={control}
                    label={
                      activeTab === 1 ? "Admission Fee" : "Re-Admission Fee"
                    }
                    type="number"
                    errors={errors}
                    InputProps={{
                      startAdornment: (
                        <span className="mr-2 font-bold text-slate-400 text-sm">
                          ₨
                        </span>
                      ),
                    }}
                  />
                  <InputField
                    name="registrationFee"
                    control={control}
                    label="Registration Fee"
                    type="number"
                    errors={errors}
                    InputProps={{
                      startAdornment: (
                        <span className="mr-2 font-bold text-slate-400 text-sm">
                          ₨
                        </span>
                      ),
                    }}
                  />
                  <InputField
                    name="securityFee"
                    control={control}
                    label="Security Deposit (Refundable)"
                    type="number"
                    errors={errors}
                    InputProps={{
                      startAdornment: (
                        <span className="mr-2 font-bold text-slate-400 text-sm">
                          ₨
                        </span>
                      ),
                    }}
                  />
                </div>

                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                    Calculated Total
                  </span>
                  <span className="text-xl font-black jmono text-indigo-600">
                    ₨ {admissionTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* ======================= */}
            {/* ACADEMIC TABS (0 & 3)   */}
            {/* ======================= */}
            {isAcademic && (
              <div className="space-y-6">
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 space-y-4">
                  <InputField
                    name="totalAmount"
                    control={control}
                    label="Total Base Amount"
                    type="number"
                    required
                    errors={errors}
                    InputProps={{
                      startAdornment: (
                        <span className="mr-2 font-bold text-slate-400 text-sm">
                          ₨
                        </span>
                      ),
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-400" /> Fee Breakdown
                    </p>
                    {breakdownTotal > 0 && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border ${isBalanced ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
                      >
                        Calculated: {formatPKR(breakdownTotal)}
                      </span>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {fields.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3">
                          <AlertCircle size={20} className="text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-semibold mb-1">
                          Breakdown Empty
                        </p>
                        <p className="text-xs text-slate-400">
                          Enter a base amount to auto-generate.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 sr-scroll">
                        {fields.map((item, idx) => {
                          const name =
                            item.headName ||
                            feeHeadOptions.find(
                              (opt) => opt.value === item.headId,
                            )?.label ||
                            "Fee";
                          return (
                            <div
                              key={item.id}
                              className="px-4 py-3 flex gap-2 items-center group hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                                  {name}
                                </label>
                                <Controller
                                  name={`feeItems.${idx}.amount`}
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="number"
                                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none font-bold jmono text-slate-700"
                                    />
                                  )}
                                />
                              </div>
                              <div className="shrink-0 mt-4">
                                <button
                                  type="button"
                                  onClick={() => remove(idx)}
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          headId: null,
                          headName: "Custom Item",
                          isPercentage: false,
                          percentageValue: 0,
                          amount: 0,
                          frequency: "SEMESTER",
                        })
                      }
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Optional note about this fee setup — kept separate from the
                system remarks text, surfaced later in Installment
                Management (not shown in Challan Management). */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Remark{" "}
                <span className="normal-case font-medium text-slate-400">
                  (optional)
                </span>
              </label>
              <Controller
                name="feeSetupRemark"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 resize-none"
                    placeholder="Optional note about this fee setup"
                  />
                )}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingHeads}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-100"
            >
              {loadingHeads ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={16} /> Save Setup
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFeeModal;
