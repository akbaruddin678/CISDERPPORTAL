import React from "react";
import {
  Plus, Paperclip, CalendarClock, Pencil, Trash2, Loader2,
  ClipboardList, Target, History, AlertTriangle, CheckCircle2, Clock4,
} from "lucide-react";
import StateCard from "../../components/StateCard";
import ExtendDueDateModal from "../components/ExtendDueDateModal";

const dueStatus = (dueDate) => {
  const diffMs = new Date(dueDate).getTime() - Date.now();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 0) return { label: "Overdue", className: "bg-rose-100 text-rose-700", icon: AlertTriangle };
  if (diffHrs <= 48) return { label: "Due Soon", className: "bg-amber-100 text-amber-700", icon: Clock4 };
  return { label: "Upcoming", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
};

const formatDueDate = (date) =>
  new Date(date).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const AssignmentsListView = ({
  assignments = [],
  isFetchingAssignments = false,
  openCreate,
  openEdit,
  extendTarget,
  openExtendDialog,
  closeExtendDialog,
  handleExtend,
  isExtending,
  handleDelete,
  isDeleting,
  deletingId,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={17} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Assignments</h2>
            {assignments.length > 0 && (
              <p className="text-xs text-slate-400 font-semibold">
                {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-md transition-all text-sm shadow-sm"
        >
          <Plus size={16} /> Create Assignment
        </button>
      </div>

      {isFetchingAssignments ? (
        <StateCard variant="loading" size="sm" title="Loading assignments…" />
      ) : assignments.length === 0 ? (
        <StateCard
          icon={ClipboardList}
          title="No assignments created yet"
          description='Click "Create Assignment" to set one up for your students.'
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => {
            const status = dueStatus(a.dueDate);
            const StatusIcon = status.icon;
            const wasExtended = (a.dueDateExtensions || []).length > 0;

            const isOverdue = status.label === "Overdue";
            const isDueSoon = status.label === "Due Soon";

            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col ${
                  isOverdue ? "border-rose-200" : "border-slate-200"
                }`}
              >
                <div className={`h-1.5 w-full ${isOverdue ? "bg-rose-500" : isDueSoon ? "bg-amber-400" : "bg-emerald-400"}`} />
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      onClick={() => openEdit(a.id)}
                      className="font-bold text-slate-800 leading-snug cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2"
                    >
                      {a.title}
                    </h3>
                    {a.status === "Draft" && (
                      <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>

                  {a.instructions && (
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-3">
                      {a.instructions.replace(/<[^>]*>/g, " ")}
                    </p>
                  )}

                  <div className="mt-auto space-y-2 pt-3">
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg w-fit ${status.className}`}>
                      <StatusIcon size={13} />
                      {status.label} · {formatDueDate(a.dueDate)}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {wasExtended && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          <History size={11} /> Extended {a.dueDateExtensions.length}x
                        </span>
                      )}
                      {a.totalMarks !== null && a.totalMarks !== undefined && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          <Target size={11} /> {a.totalMarks} marks
                        </span>
                      )}
                      {a.attachments?.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          <Paperclip size={11} /> {a.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center border-t border-slate-100 divide-x divide-slate-100">
                  <button
                    onClick={() => openEdit(a.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => openExtendDialog(a)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <CalendarClock size={13} /> Extend
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    disabled={isDeleting && deletingId === a.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    {isDeleting && deletingId === a.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {extendTarget && (
        <ExtendDueDateModal
          assignment={extendTarget}
          onClose={closeExtendDialog}
          onSubmit={handleExtend}
          isSubmitting={isExtending}
        />
      )}
    </div>
  );
};

export default AssignmentsListView;
