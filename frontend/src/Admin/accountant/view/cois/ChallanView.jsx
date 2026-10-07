import React, { useState } from "react";
import { Receipt, Loader2 } from "lucide-react";
import { useCOISFinance } from "../../controller/useCOISFinance";

const ChallanView = () => {
  const [formData, setFormData] = useState({
    programId: "",
    semesterId: "",
    termId: "",
    challanType: "TUITION",
    dueDate: "",
  });

  // Cleanly import logic from the controller
  const {
    challan: { programs, semesters, terms, generate, isGenerating },
  } = useCOISFinance();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await generate(formData);
    alert(result.message);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="text-lg font-black text-slate-800">
            Generate Bulk Challans
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Program
            </label>
            <select
              required
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, programId: e.target.value })
              }
            >
              <option value="">Select Program</option>
              {programs?.data?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name || p.programName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Semester / Part
            </label>
            <select
              required
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, semesterId: e.target.value })
              }
            >
              <option value="">Select Semester</option>
              {semesters?.data?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s.semesterName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Term / Session
            </label>
            <select
              required
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, termId: e.target.value })
              }
            >
              <option value="">Select Term</option>
              {terms?.data?.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name || t.termName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Due Date
            </label>
            <input
              type="date"
              required
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-3 flex justify-end mt-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              {isGenerating ? "Generating..." : "Generate Challans"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallanView;
