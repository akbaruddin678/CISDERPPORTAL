import React from "react";
import { Search, Loader2, ChevronRight, Inbox, Undo2, GraduationCap, Award } from "lucide-react";
import { StudentAvatar } from "../../HeadofDepartment/view/HodStudentBits";
import {
  StageDots,
  StagePill,
  StepPill,
  EmptyState,
  ErrorBox,
  ToastView,
} from "../common/graduationUi";
import { STAGES, fmtDate } from "../common/graduationHelpers";
import CandidatesPanel from "./CandidatesPanel";
import GraduatesPanel from "./GraduatesPanel";
import BulkActionBar from "./BulkActionBar";

const PipelineStage = ({ icon, label, value, active, last, tone = "default" }) => {
  const Icon = icon;
  return (
  <div className="flex items-center flex-1 min-w-[120px]">
    <div
      className={`flex-1 flex items-center gap-3 rounded-2xl px-3.5 py-3 ring-1 transition-all ${
        active
          ? "bg-white text-indigo-700 ring-white shadow-xl shadow-indigo-900/20 scale-[1.02]"
          : "bg-white/10 text-white ring-white/15 backdrop-blur-sm"
      }`}
    >
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          active
            ? "bg-indigo-100 text-indigo-600"
            : tone === "success"
              ? "bg-emerald-400/25 text-emerald-100"
              : "bg-white/15 text-white"
        }`}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none">{value ?? 0}</p>
        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 truncate ${active ? "text-indigo-400" : "text-indigo-100"}`}>
          {label}
        </p>
      </div>
    </div>
    {!last && <ChevronRight size={16} className="text-white/40 mx-1 shrink-0 hidden md:block" />}
  </div>
  );
};

const ClearanceRow = ({ row, mode, onOpen, selectable, picked, onPick }) => {
  const returned = row.currentStage === "hod" && row.stages.exam.status === "rejected";
  const myOffices = mode === "desk" ? row.offices.filter((o) => row.permissions.officeKeys.includes(o.key)) : [];
  return (
    <div className={`flex items-center ${picked ? "bg-indigo-50/60" : ""}`}>
    {selectable && (
      <input
        type="checkbox"
        checked={picked}
        onChange={() => onPick(row._id)}
        aria-label={`Select ${row.student?.fullName}`}
        className="ml-5 w-[18px] h-[18px] rounded-md accent-indigo-600 cursor-pointer shrink-0"
      />
    )}
    <button
      onClick={() => onOpen(row._id)}
      className="group flex-1 min-w-0 flex items-center gap-4 px-4 py-3.5 text-left hover:bg-indigo-50/50 transition-colors"
    >
      <StudentAvatar name={row.student?.fullName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
          {row.student?.fullName}
        </p>
        <p className="text-[11px] font-mono font-semibold text-slate-400 truncate">
          {row.student?.regNo}
          <span className="font-sans text-slate-400"> · {row.program?.name || "—"}</span>
        </p>
      </div>
      {returned && (
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 ring-1 ring-rose-200">
          <Undo2 size={11} /> Returned
        </span>
      )}
      {myOffices.map((o) => (
        <span key={o.key} className="hidden sm:inline-flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">{o.name}</span>
          <StepPill status={o.status} />
        </span>
      ))}
      <span className="hidden md:block">
        <StageDots clearance={row} />
      </span>
      <StagePill stage={row.currentStage} />
      <span className="hidden lg:block w-24 text-right text-[11px] font-medium text-slate-400">
        {fmtDate(row.updatedAt)}
      </span>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
    </div>
  );
};

const GraduationWorkspaceView = ({ w, drawer }) => {
  const isList = w.activeTab === "awaiting" || w.activeTab === "progress";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
              <GraduationCap size={22} />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{w.config.title}</h1>
              <p className="text-sm font-medium text-indigo-100 mt-0.5 max-w-2xl">{w.config.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-y-3 mt-7">
            {STAGES.map((st) => (
              <PipelineStage
                key={st.key}
                icon={st.icon}
                label={st.short}
                value={w.counts[st.key]}
                active={w.config.stage === st.key}
              />
            ))}
            <PipelineStage icon={Award} label="Graduated" value={w.counts.graduated} tone="success" last />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/50 p-2 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {w.tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => w.setActiveTab(t.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  w.activeTab === t.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
                {t.count != null && (
                  <span
                    className={`min-w-[22px] px-1.5 py-0.5 rounded-full text-[10px] font-black text-center ${
                      w.activeTab === t.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={w.search}
              onChange={(e) => w.setSearch(e.target.value)}
              placeholder="Search name, reg. no. or CNIC"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
            />
          </div>
        </div>

        <div className="mt-5">
          {w.activeTab === "candidates" && <CandidatesPanel w={w} />}
          {w.activeTab === "graduates" && <GraduatesPanel w={w} />}
          {isList && (
            <div className="space-y-4">
              {w.listErrorMessage && <ErrorBox message={w.listErrorMessage} />}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {w.listSelectable && w.rows.length > 0 && (
                  <div className="flex items-center gap-4 px-5 py-3 bg-slate-50/80">
                    <input
                      type="checkbox"
                      checked={w.allRowsPicked}
                      onChange={w.toggleAllRows}
                      aria-label="Select all"
                      className="w-[18px] h-[18px] rounded-md accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      {w.pickedRows.length ? `${w.pickedRows.length} selected` : "Select all"}
                    </span>
                  </div>
                )}
                {w.isLoadingList && !w.rows.length ? (
                  <div className="flex justify-center py-16 text-slate-400">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : w.rows.length === 0 ? (
                  <EmptyState
                    icon={w.activeTab === "awaiting" ? Inbox : Award}
                    title={w.activeTab === "awaiting" ? "Nothing waiting for you" : "No clearances in progress"}
                    hint={
                      w.activeTab === "awaiting"
                        ? "New requests will appear here as soon as they reach your desk."
                        : "Clearances that are still moving through the process show up here."
                    }
                  />
                ) : (
                  w.rows.map((r) => (
                    <ClearanceRow
                      key={r._id}
                      row={r}
                      mode={w.mode}
                      onOpen={w.openClearance}
                      selectable={w.listSelectable}
                      picked={w.pickedRows.some((p) => p._id === r._id)}
                      onPick={w.toggleRow}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isList && <BulkActionBar w={w} />}
      {drawer}
      <ToastView toast={w.toast} />
    </div>
  );
};

export default GraduationWorkspaceView;
