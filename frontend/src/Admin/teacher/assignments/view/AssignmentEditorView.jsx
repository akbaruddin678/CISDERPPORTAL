import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit3, Trash2, Save, Loader2,
  ClipboardList, Target, CalendarClock, History,
  AlertTriangle, CheckCircle2, Clock4, Send, FileText,
} from "lucide-react";
import SimpleRichTextEditor from "../../lectures/components/SimpleRichTextEditor";
import StateCard from "../../components/StateCard";
import PageHero from "../../components/PageHero";
import AttachmentCard from "../../components/AttachmentCard";
import AttachmentDropzone from "../../components/AttachmentDropzone";
import { FieldLabel, fieldClass } from "../../components/FormField";
import ExtendDueDateModal from "../components/ExtendDueDateModal";

const dueStatus = (dueDate) => {
  const diffMs = new Date(dueDate).getTime() - Date.now();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 0) return { label: "Overdue", className: "bg-rose-100 text-rose-700", icon: AlertTriangle };
  if (diffHrs <= 48) return { label: "Due Soon", className: "bg-amber-100 text-amber-700", icon: Clock4 };
  return { label: "Upcoming", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
};

const formatDateTime = (date) =>
  new Date(date).toLocaleString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const AssignmentEditorView = ({
  isNew,
  isEditMode,
  setIsEditMode,
  assignment,
  isFetchingAssignment,
  courseTitle,
  courseCode,
  courseSection,
  form,
  updateField,
  newFiles,
  addFiles,
  removeNewFile,
  visibleAttachments,
  removeExistingAttachment,
  isSaving,
  isDeleting,
  handleSave,
  handleDelete,
  handleBack,
  handleCancelEdit,
  showExtendDialog,
  setShowExtendDialog,
  handleExtendDueDate,
  isExtending,
}) => {
  const navigate = useNavigate();

  const removedIds = (assignment?.attachments || [])
    .filter((a) => !visibleAttachments.some((v) => v.id === a.id))
    .map((a) => a.id);

  if (!isNew && isFetchingAssignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <StateCard variant="loading" title="Loading assignment…" className="w-full max-w-sm" />
      </div>
    );
  }

  const status = assignment ? dueStatus(assignment.dueDate) : null;
  const StatusIcon = status?.icon;
  const wasExtended = (assignment?.dueDateExtensions || []).length > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        {/* Hero header */}
        <PageHero
          onBack={() => (isEditMode && !isNew ? handleCancelEdit() : isNew ? navigate(-1) : handleBack())}
          icon={ClipboardList}
          badges={[
            !isNew && status ? { label: status.label, icon: StatusIcon, className: status.className } : null,
            !isNew && assignment?.status === "Draft" ? { label: "Draft" } : null,
            wasExtended ? { label: `Extended ${assignment.dueDateExtensions.length}x`, icon: History } : null,
          ].filter(Boolean)}
          title={isNew ? "New Assignment" : isEditMode ? "Edit Assignment" : form.title || "Assignment"}
          subtitle={
            <>
              {(courseTitle || isNew) && (
                <p className="flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-white/40" />
                  {courseTitle} {courseCode ? `(${courseCode})` : ""}
                  {courseSection ? ` · Sec ${courseSection}` : ""}
                </p>
              )}
              {!isNew && assignment?.dueDate && <p>Due {formatDateTime(assignment.dueDate)}</p>}
            </>
          }
          actions={
            !isEditMode &&
            !isNew && (
              <>
                <button
                  onClick={() => setShowExtendDialog(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
                >
                  <CalendarClock size={15} /> Extend Due Date
                </button>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap"
                >
                  <Edit3 size={15} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 text-white hover:text-red-200 text-sm font-bold rounded-xl transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Delete
                </button>
              </>
            )
          }
        />

        {/* ── VIEW MODE ── */}
        {!isEditMode && !isNew && (
          <div className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                  <Target size={13} /> Total Marks
                </div>
                <p className="mt-1 text-xl font-black text-slate-800">
                  {assignment?.totalMarks ?? "—"}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                  <Clock4 size={13} /> Late Submission
                </div>
                <p className="mt-1 text-xl font-black text-slate-800">
                  {assignment?.allowLateSubmission ? "Allowed" : "Not Allowed"}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                  <FileText size={13} /> Attachments
                </div>
                <p className="mt-1 text-xl font-black text-slate-800">
                  {assignment?.attachments?.length || 0}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <ClipboardList size={17} className="text-slate-400" />
                <h4 className="text-base sm:text-lg font-bold text-slate-800">Instructions</h4>
              </div>
              {form.instructions ? (
                <div
                  className="text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1 [&_img]:rounded-xl [&_img]:shadow-sm"
                  dangerouslySetInnerHTML={{ __html: form.instructions }}
                />
              ) : (
                <p className="text-slate-500 italic p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  No instructions were provided for this assignment.
                </p>
              )}
            </div>

            {wasExtended && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <History size={17} className="text-slate-400" />
                  <h4 className="text-base sm:text-lg font-bold text-slate-800">Due Date History</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-semibold">Original due date</span>
                    <span className="font-bold text-slate-700">{formatDateTime(assignment.originalDueDate)}</span>
                  </div>
                  {assignment.dueDateExtensions.map((ext, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-indigo-700 font-semibold">Extended to</span>
                        <span className="font-bold text-indigo-800">{formatDateTime(ext.newDueDate)}</span>
                      </div>
                      {ext.reason && (
                        <p className="text-xs text-indigo-600/80 font-medium mt-1.5">{ext.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(assignment?.attachments || []).length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={17} className="text-slate-400" />
                  <h4 className="text-base sm:text-lg font-bold text-slate-800">
                    Attachments <span className="text-slate-400 font-semibold">({assignment.attachments.length})</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignment.attachments.map((a) => (
                    <AttachmentCard key={a.id} {...a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EDIT / CREATE MODE ── */}
        {isEditMode && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 space-y-6">
            <div>
              <FieldLabel>Assignment Title</FieldLabel>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={fieldClass}
                placeholder="E.g., Chapter 4 Problem Set"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <FieldLabel>Due Date & Time</FieldLabel>
                <input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => updateField("dueDate", e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="sm:w-40">
                <FieldLabel>Total Marks</FieldLabel>
                <input
                  type="number"
                  min="0"
                  value={form.totalMarks}
                  onChange={(e) => updateField("totalMarks", e.target.value)}
                  className={fieldClass}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex-1 flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-transparent cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.allowLateSubmission}
                  onChange={(e) => updateField("allowLateSubmission", e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm font-semibold text-slate-700">Allow late submission</span>
              </label>

              <div className="flex-1">
                <FieldLabel>Visibility</FieldLabel>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("status", "Published")}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      form.status === "Published"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <Send size={14} /> Published
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("status", "Draft")}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      form.status === "Draft"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Instructions</FieldLabel>
              <SimpleRichTextEditor value={form.instructions} onChange={(val) => updateField("instructions", val)} />
            </div>

            {visibleAttachments.length > 0 || removedIds.length > 0 ? (
              <div>
                <FieldLabel>Existing Attachments</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(assignment?.attachments || []).map((a) => (
                    <AttachmentCard
                      key={a.id}
                      {...a}
                      removed={removedIds.includes(a.id)}
                      onRemove={() => removeExistingAttachment(a.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <AttachmentDropzone
              label="Attachments — Question Papers, Rubrics, Reference Files"
              hint="Question papers, rubrics, PDFs, images, or any other reference file"
              newFiles={newFiles}
              addFiles={addFiles}
              removeNewFile={removeNewFile}
            />

            <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end border-t border-slate-100">
              {!isNew && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showExtendDialog && assignment && (
        <ExtendDueDateModal
          assignment={assignment}
          onClose={() => setShowExtendDialog(false)}
          onSubmit={handleExtendDueDate}
          isSubmitting={isExtending}
        />
      )}
    </div>
  );
};

export default AssignmentEditorView;
