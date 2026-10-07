import React, { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import AttachmentCard from "./AttachmentCard";
import { FieldLabel } from "./FormField";

const DEFAULT_ACCEPT = "image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip";

// Shared drag-and-drop upload zone + staged-files list — was hand-rolled
// identically in both the Lecture and Assignment editors. Files are only
// staged here (`newFiles`); nothing uploads until the parent form is saved.
const AttachmentDropzone = ({
  label = "Attachments",
  hint = "Images, video, audio, PDF, Office documents, or any other file",
  newFiles = [],
  addFiles,
  removeNewFile,
  accept = DEFAULT_ACCEPT,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all relative ${
          isDragging
            ? "border-indigo-400 bg-indigo-50 scale-[1.01]"
            : "border-slate-200 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-300"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          accept={accept}
          className="hidden"
        />
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <UploadCloud size={22} />
        </div>
        <p className="text-sm font-bold text-slate-700">Click or Drag & Drop Files Here</p>
        <p className="text-xs text-slate-500 mt-1">{hint}</p>
      </div>

      {newFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {newFiles.map((f) => (
            <AttachmentCard
              key={f.id}
              name={f.file.name}
              fileType={f.fileType}
              size={f.file.size}
              isNew
              onRemove={() => removeNewFile(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentDropzone;
