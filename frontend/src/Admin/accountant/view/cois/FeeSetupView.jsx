import React, { useRef, useCallback } from "react";
import {
  Search,
  X,
  ArrowLeft,
  Receipt,
  SlidersHorizontal,
  ChevronRight,
  GraduationCap,
  BookMarked,
  Sparkles,
  FileText,
  Loader2,
  Layers,
  Edit,
  Trash2,
} from "lucide-react";
import { Checkbox, IconButton, Tooltip } from "@mui/material";
import COISFeeModal from "./COISFeeModal";

// ✅ IMPORT THE CONTROLLER HOOK
import { useCOISFeeSetup } from "../../controller/useCOISFeeSetup";

const FEE_TABS = [
  { label: "Tuition", icon: GraduationCap },
  { label: "Admission", icon: FileText },
  { label: "Re-Admission", icon: Receipt },
  { label: "Exam", icon: BookMarked },
  { label: "Misc", icon: Sparkles },
];

export default function FeeSetupView() {
  // ✅ CALL THE HOOK DIRECTLY HERE (Added fallback arrays [] to prevent map errors)
  const {
    showGeneratorPage,
    setShowGeneratorPage,
    proceedToGenerator,
    activeTab,
    setActiveTab,
    selectedStudents,
    toggleStudentSelect,
    selectAll,
    studentsList = [],
    loadMoreStudents,
    loadingStudents,
    termOptions = [],
    selectedTerm,
    setSelectedTerm,
    progOptions = [],
    selectedProg,
    handleProgChange,
    partOptions = [],
    selectedPart,
    setSelectedPart,
    studentSearch,
    setStudentSearch,
    tableData = [],
    loadingFees,
    handleAdd,
    handleEdit,
    handleDelete,
    modalState,
    closeModal,
    onSubmit,
    watch,
    setValue,
    generateBreakdown,
  } = useCOISFeeSetup();

  const sentinelRef = useRef(null);
  const loaderCb = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && !loadingStudents) loadMoreStudents();
    },
    [loadingStudents, loadMoreStudents],
  );

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCb, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCb]);

  if (showGeneratorPage) {
    const isBulk = selectedStudents.length > 1;
    return (
      <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setShowGeneratorPage(false)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-black text-slate-800">
            Assign Fee Structure
          </h2>
          <div className="ml-auto flex items-center gap-3">
            <div className="px-3 py-1.5 bg-violet-100 text-violet-700 text-sm font-bold rounded-lg">
              {selectedStudents.length} Selected
            </div>
            <button
              onClick={handleAdd}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
            >
              {isBulk ? "Assign Bulk Fee" : "Assign Fee"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6 flex gap-6">
          {FEE_TABS.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === idx ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto">
          {isBulk ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Layers size={48} className="text-violet-200 mb-4" />
              <h3 className="text-lg font-black text-slate-800">
                Bulk Assignment Mode
              </h3>
              <p className="text-sm mt-2 max-w-sm text-center">
                You are assigning a master fee structure to{" "}
                {selectedStudents.length} students simultaneously.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Fee Category</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Remark</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingFees ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <Loader2
                          size={20}
                          className="animate-spin text-violet-500 mx-auto"
                        />
                      </td>
                    </tr>
                  ) : tableData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-slate-400"
                      >
                        No fees assigned for this category.
                      </td>
                    </tr>
                  ) : (
                    tableData.map((fee, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {fee.category}
                        </td>
                        <td className="px-6 py-4 font-black text-violet-600">
                          Rs. {fee.totalAmount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-[180px] truncate" title={fee.remarks}>
                          {fee.remarks || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(fee)}
                                className="!text-violet-600"
                              >
                                <Edit size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(fee)}
                                className="!text-rose-600"
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <COISFeeModal
          isOpen={modalState?.isOpen && modalState?.name === "studentFeeModal"}
          onClose={closeModal}
          activeTab={activeTab}
          onSubmit={onSubmit}
          watch={watch}
          setValue={setValue}
          generateBreakdown={generateBreakdown}
        />
      </div>
    );
  }

  // --- MAIN PAGE (STUDENT SELECTION) ---
  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
      {/* Filters Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 p-5 flex flex-col shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal size={18} className="text-violet-600" />
          <h2 className="font-black text-slate-800">Filter Students</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Academic Session
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:border-violet-500"
            >
              <option value="">All Sessions</option>
              {termOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Program (COIS)
            </label>
            <select
              value={selectedProg}
              onChange={(e) => handleProgChange(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:border-violet-500"
            >
              <option value="">All College Programs</option>
              {progOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Section / Part
            </label>
            <select
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:border-violet-500 disabled:opacity-50"
            >
              <option value="">All Parts</option>
              {partOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Topbar */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search roll number or name..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-500 font-medium"
            />
          </div>
          <button
            onClick={proceedToGenerator}
            disabled={selectedStudents.length === 0}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            Proceed to Setup <ChevronRight size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3 w-10">
                  <Checkbox
                    size="small"
                    checked={
                      studentsList.length > 0 &&
                      studentsList.every((s) =>
                        selectedStudents.some((sel) => sel._id === s._id),
                      )
                    }
                    indeterminate={
                      studentsList.some((s) =>
                        selectedStudents.some((sel) => sel._id === s._id),
                      ) &&
                      !studentsList.every((s) =>
                        selectedStudents.some((sel) => sel._id === s._id),
                      )
                    }
                    onChange={selectAll}
                  />
                </th>
                <th className="px-6 py-3">Roll No</th>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Program</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsList.map((student) => {
                const isSelected = selectedStudents.some(
                  (s) => s._id === student._id,
                );
                return (
                  <tr
                    key={student._id}
                    onClick={() => toggleStudentSelect(student)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-violet-50" : "hover:bg-slate-50"}`}
                  >
                    <td
                      className="px-6 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => toggleStudentSelect(student)}
                      />
                    </td>
                    <td className="px-6 py-3 font-mono font-bold text-slate-500">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-800">
                      {student.personalInfo?.fullName || "N/A"}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-600">
                      {student.programId?.name || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div ref={sentinelRef} className="h-4" />
          {loadingStudents && (
            <div className="py-4 flex justify-center">
              <Loader2 size={20} className="animate-spin text-violet-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
