// view/Scholarship/ScholarshipPlanListView.jsx
import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Percent,
  DollarSign,
  Calendar,
  X
} from "lucide-react";

const ScholarshipPlanListView = ({
  controllerData,
  filters,
  updateFilters,
  clearFilters,
  onPageChange,
  onOpenCreate,
  onOpenEdit,
  onOpenDetails,
  onOpenConfirmation,
  onOpenExport,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState([]);

  const {
    scholarshipPlans = [],
    plansPagination = {},
    isLoadingPlans,
    isCreatingPlan,
    isDeletingPlan,
    isTogglingStatus,
    error,
    handleTogglePlanStatus,
    handleDeletePlan,
    handleRefresh,
    setSearchTerm,
    searchTerm,
    refetchPlans,
  } = controllerData;

  // --- Helpers ---

  const togglePlanSelection = (planId) => {
    setSelectedPlans((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPlans.length === scholarshipPlans.length) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(scholarshipPlans.map((plan) => plan.id));
    }
  };

  const handleStatusToggle = async (planId, currentStatus) => {
    onOpenConfirmation({
      title: currentStatus ? "Deactivate Plan" : "Activate Plan",
      message: `Are you sure you want to ${
        currentStatus ? "deactivate" : "activate"
      } this scholarship plan?`,
      confirmText: currentStatus ? "Deactivate" : "Activate",
      onConfirm: async () => {
        const result = await handleTogglePlanStatus(planId, !currentStatus);
        if (result.success) {
          refetchPlans();
        }
      },
      type: "warning",
    });
  };

  const handleDelete = async (planId) => {
    onOpenConfirmation({
      title: "Delete Scholarship Plan",
      message:
        "Are you sure you want to delete this scholarship plan? This action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        const result = await handleDeletePlan(planId);
        if (result.success) {
          refetchPlans();
        }
      },
      type: "error",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return `Rs ${Number(amount).toLocaleString()}`;
  };

  // --- Render ---

  return (
    <div className="flex flex-col space-y-4">
      
      {/* --- CONTROL BAR --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        
        {/* Left: Search & Filter Toggle */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search plans by title..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              showFilters 
                ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Filter size={16} /> <span>Filters</span>
          </button>

          {(filters.active || filters.type || showFilters) && (
             <button onClick={clearFilters} className="text-sm text-rose-500 font-medium hover:text-rose-700 px-2 self-center">
               Reset
             </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <button onClick={handleRefresh} disabled={isLoadingPlans} className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100">
            <RefreshCw size={18} className={isLoadingPlans ? "animate-spin" : ""} />
          </button>
          
          <button onClick={onOpenExport} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
            <Download size={16} /> <span className="hidden sm:inline">Export</span>
          </button>
          
          <button 
            onClick={onOpenCreate}
            disabled={isCreatingPlan}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
          >
            <Plus size={18} /> <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* --- EXPANDABLE FILTER PANEL --- */}
      {showFilters && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={filters.active || ""}
              onChange={(e) => updateFilters({ active: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
            <select
              value={filters.type || ""}
              onChange={(e) => updateFilters({ type: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Items Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => updateFilters({ limit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="10">10 Rows</option>
              <option value="25">25 Rows</option>
              <option value="50">50 Rows</option>
            </select>
          </div>
        </div>
      )}

      {/* --- ERROR MESSAGE --- */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X size={16} /> {error}
        </div>
      )}

      {/* --- DATA TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedPlans.length === scholarshipPlans.length && scholarshipPlans.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Plan Details</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Term</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Grant Value</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Created Date</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingPlans ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="animate-spin text-indigo-500" size={24} />
                      <span className="text-sm font-medium">Loading plans...</span>
                    </div>
                  </td>
                </tr>
              ) : scholarshipPlans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <BarChart3 size={24} />
                      </div>
                      <h3 className="text-slate-900 font-bold">No plans found</h3>
                      <p className="text-slate-500 text-sm">Create a new plan to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                scholarshipPlans.map((plan) => (
                  <tr key={plan.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedPlans.includes(plan.id)}
                        onChange={() => togglePlanSelection(plan.id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-sm">{plan.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{plan.description}</div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                      {plan.termName || (
                        <span className="text-slate-400 italic">Any Term</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                        plan.type === "percentage"
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {plan.type === "percentage" ? <Percent size={12} className="mr-1"/> : <DollarSign size={12} className="mr-1"/>}
                        {plan.type === "percentage" ? "Percentage" : "Fixed Amount"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900">
                        {plan.type === "percentage" ? `${plan.maxPercentage}%` : formatCurrency(plan.maxAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Maximum</div>
                      <div className="text-[10px] text-indigo-500 font-bold mt-1">
                        {plan.activeAssignments || 0} active · {plan.totalAssignments || 0} total
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        plan.active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {plan.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400"/>
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => onOpenDetails(plan)} 
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => onOpenEdit(plan)} 
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Plan"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusToggle(plan.id, plan.active)}
                          disabled={isTogglingStatus}
                          className={`p-2 rounded-lg transition-colors ${
                            plan.active 
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" 
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={plan.active ? "Deactivate" : "Activate"}
                        >
                          {plan.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(plan.id)}
                          disabled={isDeletingPlan}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Plan"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        {plansPagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Page {filters.page} of {plansPagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => onPageChange(filters.page - 1)} 
                disabled={filters.page <= 1 || isLoadingPlans}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <button 
                onClick={() => onPageChange(filters.page + 1)} 
                disabled={filters.page >= plansPagination.totalPages || isLoadingPlans}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipPlanListView;