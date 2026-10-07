import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit3,
  Trash2,
  Save,
  CalendarDays,
  Loader2,
  BookOpenCheck,
  NotebookPen,
  Sparkles,
  Paperclip,
  BookOpen,
} from "lucide-react";
import SimpleRichTextEditor from "../components/SimpleRichTextEditor";
import StateCard from "../../components/StateCard";
import PageHero from "../../components/PageHero";
import AttachmentCard from "../../components/AttachmentCard";
import AttachmentDropzone from "../../components/AttachmentDropzone";
import { FieldLabel, fieldClass } from "../../components/FormField";

const WEEKS = Array.from({ length: 16 }).map((_, i) => `Week ${i + 1}`);

const LectureEditorView = ({
  isNew,
  isEditMode,
  setIsEditMode,
  lecture,
  isFetchingLecture,
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
}) => {
  const navigate = useNavigate();

  const removedIds = (lecture?.attachments || [])
    .filter((a) => !visibleAttachments.some((v) => v.id === a.id))
    .map((a) => a.id);

  if (!isNew && isFetchingLecture) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <StateCard variant="loading" title="Loading lecture…" className="w-full max-w-sm" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
        {/* Hero header */}
        <PageHero
          onBack={() => (isEditMode && !isNew ? handleCancelEdit() : isNew ? navigate(-1) : handleBack())}
          icon={BookOpen}
          badges={[
            !isNew && lecture?.week ? { label: lecture.week, icon: Sparkles } : null,
            !isNew && lecture?.date
              ? {
                  label: new Date(lecture.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
                  icon: CalendarDays,
                  className: "bg-transparent text-white/70 normal-case font-bold px-0",
                }
              : null,
          ].filter(Boolean)}
          title={isNew ? "New Lecture" : isEditMode ? "Edit Lecture" : form.topic || "Lecture"}
          subtitle={
            (courseTitle || isNew) && (
              <p className="flex items-center gap-1.5">
                <BookOpenCheck size={14} className="text-white/40" />
                {courseTitle} {courseCode ? `(${courseCode})` : ""}
                {courseSection ? ` · Sec ${courseSection}` : ""}
              </p>
            )
          }
          actions={
            !isEditMode &&
            !isNew && (
              <>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Edit3 size={15} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 text-white hover:text-red-200 text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
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
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
              {form.description && (
                <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 p-5 rounded-xl mb-6">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white flex-shrink-0">
                    <Sparkles size={15} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-1.5">
                      Lecture Summary
                    </h4>
                    <p className="text-indigo-900 font-medium leading-relaxed">{form.description}</p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <NotebookPen size={17} className="text-slate-400" />
                  <h4 className="text-base sm:text-lg font-bold text-slate-800">Detailed Notes</h4>
                </div>
                {form.notes ? (
                  <div
                    className="text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1 [&_img]:rounded-xl [&_img]:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: form.notes }}
                  />
                ) : (
                  <p className="text-slate-500 italic p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    No detailed notes were provided for this lecture.
                  </p>
                )}
              </div>
            </div>

            {(lecture?.attachments || []).length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Paperclip size={17} className="text-slate-400" />
                  <h4 className="text-base sm:text-lg font-bold text-slate-800">
                    Attachments <span className="text-slate-400 font-semibold">({lecture.attachments.length})</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lecture.attachments.map((a) => (
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-1/3">
                <FieldLabel>Week</FieldLabel>
                <select
                  value={form.week}
                  onChange={(e) => updateField("week", e.target.value)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  {WEEKS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <FieldLabel>Lecture Topic</FieldLabel>
                <input
                  required
                  type="text"
                  value={form.topic}
                  onChange={(e) => updateField("topic", e.target.value)}
                  className={fieldClass}
                  placeholder="E.g., Intro to Neural Networks"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Short Description</FieldLabel>
              <textarea
                rows="2"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="A brief 1-2 sentence summary of what was covered..."
                className={`${fieldClass} resize-none`}
              />
            </div>

            <div>
              <FieldLabel>Detailed Notes / Class Log</FieldLabel>
              <SimpleRichTextEditor value={form.notes} onChange={(val) => updateField("notes", val)} />
            </div>

            {visibleAttachments.length > 0 || removedIds.length > 0 ? (
              <div>
                <FieldLabel>Existing Attachments</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(lecture?.attachments || []).map((a) => (
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
              label="Attachments — Slides, Docs, Sheets, Images, Video, Audio, or any other file"
              hint="PowerPoint, Word, Excel, Images, Video, Audio, PDF, or any other file type"
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
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Saving..." : "Save Lecture"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureEditorView;
