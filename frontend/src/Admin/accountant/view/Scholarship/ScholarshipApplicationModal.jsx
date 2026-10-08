// view/Scholarship/ScholarshipApplicationModal.js
import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Award,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Banknote,
  Save,
  Layers,
  ListChecks,
} from "lucide-react";

const fmtRs = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

// Mirrors ScholarshipService.calculateScholarshipAmount on the backend —
// a client-side preview only, the real deduction is always recomputed
// server-side at approval/challan-generation time.
const previewDeduction = (tuition, plan) => {
  if (!plan) return 0;
  if (plan.type === "fixed") return Math.min(plan.maxAmount || 0, tuition);
  const pct = Math.min(Math.max(plan.maxPercentage || 0, 0), 100);
  return Math.min(Math.round((tuition * pct) / 100), tuition);
};

const ScholarshipApplicationModal = ({
  isOpen,
  onClose,
  student: preSelectedStudent,
  students = [],
  scholarshipPlans = [],
  terms = [],
  departments = [],
  programs = [],
  semesters = [],
  studentListFilters,
  setStudentListFilters,
  isLoadingStudents,
  handleApplyForScholarship,
  handleCheckEligibility,
  handleFetchFeeContext,
  handleUpsertStudentFee,
  isSavingFee,
  onSuccess,
  onError,
}) => {
  // --- STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    studentId: "",
    planId: "",
    filterSessionId: "",
    filterDepartmentId: "",
    filterProgramId: "",
    filterSemesterId: "",
    search: "",
  });

  // Fee & Scholarship Preview state
  const [feeContext, setFeeContext] = useState(null);
  const [isFetchingFee, setIsFetchingFee] = useState(false);
  const [inlineFeeAmount, setInlineFeeAmount] = useState("");
  const [showInlineFeeForm, setShowInlineFeeForm] = useState(false);

  // Apply To (semester scope) state
  const [semesterScope, setSemesterScope] = useState("all");
  const [selectedSemesterIds, setSelectedSemesterIds] = useState([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isOpen) {
      const defaultTermId = terms.length > 0 ? terms[0]._id || terms[0].id : "";

      setFormData({
        studentId: preSelectedStudent
          ? preSelectedStudent._id || preSelectedStudent.id
          : "",
        planId: "",
        filterSessionId: defaultTermId,
        filterDepartmentId: "",
        filterProgramId: "",
        filterSemesterId: "",
        search: "",
      });
      setEligibilityResult(null);
      setErrors({});
      setFeeContext(null);
      setShowInlineFeeForm(false);
      setInlineFeeAmount("");
      setSemesterScope("all");
      setSelectedSemesterIds([]);
    }
  }, [isOpen, preSelectedStudent, terms]);

  // --- HELPERS ---
  const getStudentName = (s) =>
    s?.personalInfo?.fullName || s?.fullName || s?.name || "Unknown";
  const getStudentRoll = (s) =>
    s?.studentId || s?.rollNumber || s?.rollNo || "";

  // Filter students based on search input
  const displayStudents = students.filter((s) => {
    if (!formData.search) return true;
    const term = formData.search.toLowerCase();
    const name = getStudentName(s).toLowerCase();
    const roll = getStudentRoll(s).toLowerCase();
    const idStr = (s.id || s._id || "").toString().toLowerCase();
    return name.includes(term) || roll.includes(term) || idStr.includes(term);
  });

  // --- DYNAMIC OPTION LISTS (CASCADING) ---
  const filteredPrograms = formData.filterDepartmentId
    ? programs.filter(
        (p) =>
          (p.departmentId?._id || p.departmentId) ===
          formData.filterDepartmentId,
      )
    : programs;

  const rawSemesters = formData.filterProgramId
    ? semesters.filter(
        (s) => (s.programId?._id || s.programId) === formData.filterProgramId,
      )
    : semesters;

  const filteredSemesters = [...rawSemesters].sort(
    (a, b) => (a.number || 0) - (b.number || 0),
  );

  // --- HANDLERS ---
  const handleFilterChange = (key, value) => {
    setFormData((prev) => {
      const newState = { ...prev, [key]: value };
      if (key === "filterDepartmentId") {
        newState.filterProgramId = "";
        newState.filterSemesterId = "";
      }
      if (key === "filterProgramId") {
        newState.filterSemesterId = "";
      }
      return newState;
    });

    if (setStudentListFilters) {
      setStudentListFilters((prev) => {
        const newFilters = { ...prev, page: 1 };
        if (key === "search") newFilters.search = value;
        if (key === "filterSessionId") newFilters.termId = value;
        if (key === "filterDepartmentId") {
          newFilters.departmentId = value;
          newFilters.programId = "";
          newFilters.semesterId = "";
        }
        if (key === "filterProgramId") {
          newFilters.programId = value;
          newFilters.semesterId = "";
        }
        if (key === "filterSemesterId") newFilters.semesterId = value;
        return newFilters;
      });
    }
  };

  // Eligibility Check
  useEffect(() => {
    const checkEligibility = async () => {
      if (formData.planId && formData.studentId && handleCheckEligibility) {
        setIsChecking(true);
        try {
          const result = await handleCheckEligibility(
            formData.studentId,
            formData.planId,
          );
          if (result?.success) {
            setEligibilityResult({
              isEligible: result.isEligible,
              message:
                result.data?.message ||
                (result.isEligible
                  ? "Eligible"
                  : `Not Eligible: ${result.data.reason}`),
              ...result.data,
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsChecking(false);
        }
      } else {
        setEligibilityResult(null);
      }
    };
    const timer = setTimeout(checkEligibility, 500);
    return () => clearTimeout(timer);
  }, [formData.planId, formData.studentId]);

  // Fee & Scholarship Preview — fetched once a student is selected, so the
  // accountant sees the real tuition amount (and whether it's even set up
  // yet) before confirming, instead of assigning blind.
  useEffect(() => {
    const load = async () => {
      if (!formData.studentId || !handleFetchFeeContext) {
        setFeeContext(null);
        return;
      }
      setIsFetchingFee(true);
      try {
        const ctx = await handleFetchFeeContext(formData.studentId);
        setFeeContext(ctx);
        setShowInlineFeeForm(false);
        setInlineFeeAmount("");
      } finally {
        setIsFetchingFee(false);
      }
    };
    load();
  }, [formData.studentId]);

  const handleSaveInlineFee = async () => {
    if (!inlineFeeAmount || Number(inlineFeeAmount) <= 0) {
      setErrors((e) => ({ ...e, fee: "Enter a valid amount." }));
      return;
    }
    const result = await handleUpsertStudentFee({
      studentId: formData.studentId,
      termId: feeContext?.termId,
      semesterId: feeContext?.semesterId,
      totalAmount: Number(inlineFeeAmount),
    });
    if (result?.success) {
      const ctx = await handleFetchFeeContext(formData.studentId);
      setFeeContext(ctx);
      setShowInlineFeeForm(false);
      setInlineFeeAmount("");
      setErrors((e) => ({ ...e, fee: undefined }));
    } else {
      setErrors((e) => ({ ...e, fee: result?.message || "Failed to save fee." }));
    }
  };

  const toggleSelectedSemester = (id) => {
    setSelectedSemesterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.planId) {
      setErrors({ submit: "Please select a Student and a Plan." });
      return;
    }
    if (semesterScope === "selective" && selectedSemesterIds.length === 0) {
      setErrors({ submit: "Select at least one semester, or choose 'All Semesters'." });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await handleApplyForScholarship({
        studentId: formData.studentId,
        scholarshipPlanId: formData.planId,
        semesterScope,
        semesterIds: semesterScope === "selective" ? selectedSemesterIds : [],
      });

      if (result?.success) {
        onSuccess && onSuccess("Application submitted successfully");
        onClose();
      } else {
        setErrors({ submit: result?.message || "Submission failed" });
      }
    } catch (error) {
      setErrors({ submit: error.message || "An error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI Extraction Values
  const selectedPlan = scholarshipPlans.find(
    (p) => (p._id || p.id) === formData.planId,
  );
  const selectedStudentObj = students.find(
    (s) => (s.id || s._id) === formData.studentId,
  );

  const familyInfo = selectedStudentObj?.familyInfo || {};
  const personalInfo = selectedStudentObj?.personalInfo || {};
  const fatherName =
    familyInfo.fatherName ||
    personalInfo.fatherName ||
    selectedStudentObj?.fatherName ||
    "—";

  const deptName =
    selectedStudentObj?.departmentId?.name ||
    selectedStudentObj?.department?.name ||
    departments.find(
      (d) =>
        (d._id || d.id) ===
        (selectedStudentObj?.departmentId || selectedStudentObj?.department),
    )?.name ||
    "—";
  const progName =
    selectedStudentObj?.programId?.name ||
    selectedStudentObj?.program?.name ||
    programs.find(
      (p) =>
        (p._id || p.id) ===
        (selectedStudentObj?.programId || selectedStudentObj?.program),
    )?.name ||
    "—";
  const selectedStudentProgramId =
    selectedStudentObj?.programId?._id ||
    selectedStudentObj?.programId ||
    selectedStudentObj?.program?._id ||
    selectedStudentObj?.program;

  const semRef = selectedStudentObj?.semesterId || selectedStudentObj?.semester;
  const semNumber =
    semRef?.number || semesters.find((s) => (s._id || s.id) === semRef)?.number;
  const semName = semNumber ? `Section ${semNumber}` : "—";

  const sessionName =
    selectedStudentObj?.termId?.name ||
    selectedStudentObj?.term?.name ||
    terms.find(
      (t) =>
        (t._id || t.id) ===
        (selectedStudentObj?.termId || selectedStudentObj?.term),
    )?.name ||
    "—";

  // The selected student's OWN program's semesters, for the "Selected
  // Semesters" picker — independent of whatever the left-side student-list
  // filter happens to be set to.
  const studentProgramSemesters = selectedStudentProgramId
    ? [...semesters]
        .filter(
          (s) =>
            (s.programId?._id || s.programId) === selectedStudentProgramId,
        )
        .sort((a, b) => (a.number || 0) - (b.number || 0))
    : [];

  const tuitionAmount = feeContext?.tuitionAmount || 0;
  const hasFeeSetup = !!feeContext?.hasFeeSetup;
  const deductionPreview = previewDeduction(tuitionAmount, selectedPlan);
  const netPayable = Math.max(0, tuitionAmount - deductionPreview);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Assign Scholarship
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Link a student to a scholarship plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
          {/* LEFT: Selection Panel (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 border-r border-slate-100 bg-slate-50/50">
            <form
              id="application-form"
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* 1. Student Selection */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Select Candidate
                  </h3>
                </div>

                {!preSelectedStudent && (
                  <div className="space-y-3 mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      <Filter size={12} /> Filter Student List
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                          Search Student Name / ID
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type to search students..."
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 font-medium text-slate-700"
                            value={formData.search}
                            onChange={(e) =>
                              handleFilterChange("search", e.target.value)
                            }
                          />
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                          Session
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 font-medium text-slate-700"
                          onChange={(e) =>
                            handleFilterChange(
                              "filterSessionId",
                              e.target.value,
                            )
                          }
                          value={formData.filterSessionId}
                        >
                          <option value="">All Sessions</option>
                          {terms.map((t) => (
                            <option key={t.id || t._id} value={t.id || t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                          Class
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                          onChange={(e) =>
                            handleFilterChange(
                              "filterDepartmentId",
                              e.target.value,
                            )
                          }
                          value={formData.filterDepartmentId}
                        >
                          <option value="">All Classes</option>
                          {departments.map((d) => (
                            <option key={d.id || d._id} value={d.id || d._id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                          Program
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                          onChange={(e) =>
                            handleFilterChange(
                              "filterProgramId",
                              e.target.value,
                            )
                          }
                          value={formData.filterProgramId}
                          disabled={
                            !formData.filterDepartmentId &&
                            filteredPrograms.length === programs.length
                          }
                        >
                          <option value="">All Programs</option>
                          {filteredPrograms.map((p) => (
                            <option key={p.id || p._id} value={p.id || p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                          Section
                        </label>
                        <select
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                          onChange={(e) =>
                            handleFilterChange(
                              "filterSemesterId",
                              e.target.value,
                            )
                          }
                          value={formData.filterSemesterId}
                          disabled={!formData.filterProgramId}
                        >
                          <option value="">All Sections</option>
                          {filteredSemesters.map((s) => (
                            <option key={s.id || s._id} value={s.id || s._id}>
                              Section {s.number}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <select
                    value={formData.studentId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, studentId: e.target.value }))
                    }
                    disabled={!!preSelectedStudent}
                    className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm appearance-none"
                  >
                    <option value="">
                      {isLoadingStudents
                        ? "Loading Students..."
                        : "-- Choose Student --"}
                    </option>
                    {displayStudents.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {getStudentName(s)} ({getStudentRoll(s)})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                </div>
              </section>

              {/* 2. Plan Selection */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Scholarship Plan
                  </h3>
                </div>

                <div>
                  <div className="relative">
                    <select
                      value={formData.planId}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, planId: e.target.value }))
                      }
                      className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm appearance-none"
                    >
                      <option value="">-- Select Plan --</option>
                      {scholarshipPlans
                        .filter((p) => p.active)
                        .map((p) => (
                          <option key={p.id || p._id} value={p.id || p._id}>
                            {p.title} —{" "}
                            {p.type === "percentage"
                              ? `${p.maxPercentage}%`
                              : fmtRs(p.maxAmount)}
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Award size={18} />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Fee & Scholarship Preview */}
              {formData.studentId && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                      3
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Fee &amp; Scholarship Preview
                    </h3>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    {isFetchingFee ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                        <RefreshCw size={14} className="animate-spin" />{" "}
                        Loading fee details…
                      </div>
                    ) : !hasFeeSetup ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs font-medium">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          <span>
                            No tuition fee is set up yet for this student's
                            current semester. This is{" "}
                            <strong>optional</strong> — you can assign the
                            scholarship without it and set the fee up later.
                          </span>
                        </div>
                        {!showInlineFeeForm ? (
                          <button
                            type="button"
                            onClick={() => setShowInlineFeeForm(true)}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            <Banknote size={14} /> Set up tuition fee now
                          </button>
                        ) : (
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Total Tuition Fee
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={inlineFeeAmount}
                                onChange={(e) =>
                                  setInlineFeeAmount(e.target.value)
                                }
                                placeholder="e.g. 100000"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveInlineFee}
                              disabled={isSavingFee}
                              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isSavingFee ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Save size={14} />
                              )}
                              Save
                            </button>
                          </div>
                        )}
                        {errors.fee && (
                          <p className="text-xs text-rose-600">{errors.fee}</p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Tuition
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {fmtRs(tuitionAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Scholarship Deducts
                          </p>
                          <p className="text-sm font-bold text-indigo-600">
                            − {fmtRs(deductionPreview)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Student Pays
                          </p>
                          <p className="text-sm font-bold text-emerald-700">
                            {fmtRs(netPayable)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 4. Apply To (semester scope) */}
              {formData.studentId && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                      4
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Apply To
                    </h3>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSemesterScope("all")}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
                          semesterScope === "all"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Layers size={14} /> All Sections
                      </button>
                      <button
                        type="button"
                        onClick={() => setSemesterScope("selective")}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold border transition-colors ${
                          semesterScope === "selective"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <ListChecks size={14} /> Selected Sections
                      </button>
                    </div>

                    {semesterScope === "selective" && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {studentProgramSemesters.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            No sections found for this student's program.
                          </p>
                        ) : (
                          studentProgramSemesters.map((s) => {
                            const sid = s._id || s.id;
                            const checked = selectedSemesterIds.includes(sid);
                            return (
                              <button
                                type="button"
                                key={sid}
                                onClick={() => toggleSelectedSemester(sid)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                  checked
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                Section {s.number}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </form>
          </div>

          {/* RIGHT: Live Preview & Status (FIXED BUTTONS LAYOUT) */}
          <div className="w-full lg:w-[420px] bg-white flex flex-col border-t lg:border-t-0 border-slate-100 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
            {/* SCROLLABLE SUMMARY CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
                Summary Preview
              </h3>

              {/* Eligibility Card */}
              <div
                className={`p-6 rounded-2xl border mb-6 transition-all ${
                  !formData.planId || !formData.studentId
                    ? "bg-slate-50 border-slate-200"
                    : isChecking
                      ? "bg-blue-50 border-blue-100"
                      : eligibilityResult?.isEligible
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-rose-50 border-rose-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      !formData.planId
                        ? "bg-slate-200 text-slate-500"
                        : isChecking
                          ? "bg-blue-200 text-blue-700 animate-pulse"
                          : eligibilityResult?.isEligible
                            ? "bg-emerald-200 text-emerald-700"
                            : "bg-rose-200 text-rose-700"
                    }`}
                  >
                    {isChecking ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : eligibilityResult?.isEligible ? (
                      <CheckCircle size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                  </div>
                  <div>
                    <h4
                      className={`font-bold text-sm ${
                        !formData.planId
                          ? "text-slate-600"
                          : isChecking
                            ? "text-blue-800"
                            : eligibilityResult?.isEligible
                              ? "text-emerald-800"
                              : "text-rose-800"
                      }`}
                    >
                      {isChecking
                        ? "Checking Status..."
                        : eligibilityResult
                          ? eligibilityResult.isEligible
                            ? "Eligible for Grant"
                            : "Not Eligible"
                          : "Select Details"}
                    </h4>
                    {eligibilityResult?.message && (
                      <p className="text-xs mt-1 opacity-80">
                        {eligibilityResult.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Student
                  </span>
                  <span className="text-sm font-bold text-slate-700 text-right truncate max-w-[150px]">
                    {selectedStudentObj
                      ? getStudentName(selectedStudentObj)
                      : "—"}
                  </span>
                </div>

                {/* Academic Profile Block */}
                {selectedStudentObj && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Father's Name
                      </span>
                      <span className="text-xs font-semibold text-slate-700 text-right truncate max-w-[150px]">
                        {fatherName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Class
                      </span>
                      <span className="text-xs font-semibold text-slate-700 text-right truncate max-w-[150px]">
                        {deptName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Program
                      </span>
                      <span className="text-xs font-semibold text-slate-700 text-right truncate max-w-[150px]">
                        {progName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Section
                      </span>
                      <span className="text-xs font-semibold text-slate-700 text-right">
                        {semName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Session
                      </span>
                      <span className="text-xs font-semibold text-slate-700 text-right">
                        {sessionName}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Plan
                  </span>
                  <span className="text-sm font-bold text-slate-700 text-right truncate max-w-[150px]">
                    {selectedPlan?.title || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Plan Value
                  </span>
                  <span className="text-sm font-bold text-slate-700 text-right truncate max-w-[150px]">
                    {selectedPlan?.type === "percentage"
                      ? `${selectedPlan.maxPercentage}%`
                      : selectedPlan?.maxAmount
                        ? fmtRs(selectedPlan.maxAmount)
                        : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Applies To
                  </span>
                  <span className="text-sm font-bold text-slate-700 text-right truncate max-w-[180px]">
                    {semesterScope === "all"
                      ? "All Semesters"
                      : selectedSemesterIds.length > 0
                        ? `${selectedSemesterIds.length} Semester${selectedSemesterIds.length > 1 ? "s" : ""}`
                        : "— none selected —"}
                  </span>
                </div>
              </div>

              {/* Error Display inside scrollable area */}
              {errors.submit && (
                <div className="mt-6 p-3 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg border border-rose-100">
                  {errors.submit}
                </div>
              )}
            </div>

            {/* FIXED ACTIONS FOOTER */}
            <div className="p-6 sm:p-8 pt-5 border-t border-slate-100 bg-white shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  type="button"
                  className="py-3.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    (eligibilityResult && !eligibilityResult.isEligible)
                  }
                  className="py-3.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipApplicationModal;
