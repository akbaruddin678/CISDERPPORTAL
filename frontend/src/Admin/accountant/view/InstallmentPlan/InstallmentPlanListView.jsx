import React, { useState } from "react";
import {
  Plus,
  Search,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit3,
  Eye,
  UserPlus,
  Power,
  AlertCircle,
} from "lucide-react";

const InstallmentPlanListView = ({
  controllerData,
  filters,
  updateFilters,
  clearFilters,
  onOpenCreate,
  onOpenEdit,
  onOpenDetails,
  onOpenAssign,
}) => {
  // --- SAFETY CHECK: PREVENT CRASH IF DATA IS UNDEFINED ---
  if (!controllerData) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const {
    installmentPlans = [],
    stats = { total: 0, active: 0, averageInstallments: 0, monthlyPlans: 0 },
    isLoadingPlans,
    searchTerm,
    setSearchTerm,
    handleTogglePlanStatus,
  } = controllerData;

  const [statusFilter, setStatusFilter] = useState(filters?.isActive || "");

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    updateFilters({ isActive: status });
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setSearchTerm("");
    clearFilters();
  };

  // --- SUB-COMPONENTS ---
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  const ActionButton = ({ onClick, icon: Icon, label, color }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${color}`}
      title={label}
    >
      <Icon size={18} />
    </button>
  );

  // --- RENDER ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Plans"
          value={stats.total}
          icon={Layers}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Plans"
          value={stats.active}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Avg Installments"
          value={stats.averageInstallments}
          icon={Clock}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Monthly Plans"
          value={stats.monthlyPlans}
          icon={Calendar}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* 2. Toolbar (Search & Actions) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {(statusFilter || searchTerm) && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-2"
            >
              Reset
            </button>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={onOpenCreate}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={18} /> New Plan
        </button>
      </div>

      {/* 3. Data Grid */}
      {isLoadingPlans ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-200 animate-pulse rounded-2xl"
            ></div>
          ))}
        </div>
      ) : installmentPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {installmentPlans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br from-white to-slate-50/50 rounded-t-2xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        plan.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    ></span>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        plan.isActive ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Archived"}
                    </span>
                  </div>
                  <h3
                    className="font-bold text-slate-900 text-lg line-clamp-1"
                    title={plan.name}
                  >
                    {plan.name}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                  {plan.numberOfInstallments}
                </div>
              </div>

              {/* Card Info */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between text-sm">
                  <div className="text-slate-500">Interval</div>
                  <div className="font-medium text-slate-800">
                    {plan.intervalDays
                      ? `${plan.intervalDays} Days`
                      : "Custom Dates"}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="text-slate-500">No. Installment</div>
                  <div className="font-medium text-slate-800">
                    {Math.ceil(plan.numberOfInstallments)}
                  </div>
                </div>
                <div className="h-px bg-slate-100 my-2"></div>
                <div className="flex gap-2">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                    {plan.scheduleConfig?.length > 0
                      ? "Custom Config"
                      : "Auto Config"}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 border-t border-slate-100 grid grid-cols-4 gap-2 bg-slate-50/30 rounded-b-2xl">
                <ActionButton
                  onClick={() => onOpenDetails(plan)}
                  icon={Eye}
                  label="View"
                  color="text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                />
                <ActionButton
                  onClick={() => onOpenEdit(plan)}
                  icon={Edit3}
                  label="Edit"
                  color="text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                />
                <ActionButton
                  // onClick={() => onOpenAssign(plan)}
                  icon={UserPlus}
                  label="Assign"
                  color="text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
                />
                <ActionButton
                  onClick={() =>
                    handleTogglePlanStatus(plan._id, !plan.isActive)
                  }
                  icon={Power}
                  label={plan.isActive ? "Disable" : "Enable"}
                  color={
                    plan.isActive
                      ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-slate-300" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            No Plans Found
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            {searchTerm
              ? `No results for "${searchTerm}"`
              : "Get started by creating your first installment plan."}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenCreate}
              className="mt-4 text-indigo-600 font-medium hover:text-indigo-700"
            >
              Create New Plan
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InstallmentPlanListView;
