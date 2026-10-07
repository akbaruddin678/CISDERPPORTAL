import React from "react";
import { Download, X } from "lucide-react";
import { FILE_TYPE_META, formatFileSize } from "../lectures/utils/fileTypeMeta";

// Shared attachment row — was hand-rolled identically in both the Lecture
// and Assignment editors; one component now covers staged ("pending
// upload") files and already-saved attachments (with a download link and
// a remove/undo toggle).
const AttachmentCard = ({ name, fileType, size, url, removed, onRemove, isNew }) => {
  const meta = FILE_TYPE_META[fileType] || FILE_TYPE_META.other;
  const Icon = meta.icon;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        removed
          ? "border-red-200 bg-red-50/60 opacity-60"
          : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${meta.className}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold truncate ${removed ? "line-through text-slate-400" : "text-slate-800"}`}>
          {name}
        </p>
        <p className="text-xs text-slate-400 font-medium">
          {meta.label}
          {size ? ` · ${formatFileSize(size)}` : ""}
          {isNew ? " · pending upload" : ""}
        </p>
      </div>
      {url && !removed && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
          title="View / download"
        >
          <Download size={16} />
        </a>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            removed
              ? "text-indigo-600 hover:bg-indigo-50"
              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          }`}
          title={removed ? "Undo remove" : "Remove"}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AttachmentCard;
