import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  Music,
  Presentation,
  File as FileIcon,
} from "lucide-react";

// Visual identity per attachment category — used for both the upload
// picker (before saving) and the read-only attachment list.
export const FILE_TYPE_META = {
  pdf: { label: "PDF", icon: FileText, className: "text-red-600 bg-red-50" },
  word: { label: "Word", icon: FileText, className: "text-blue-600 bg-blue-50" },
  excel: { label: "Excel", icon: FileSpreadsheet, className: "text-emerald-600 bg-emerald-50" },
  powerpoint: { label: "PowerPoint", icon: Presentation, className: "text-orange-600 bg-orange-50" },
  image: { label: "Image", icon: ImageIcon, className: "text-violet-600 bg-violet-50" },
  video: { label: "Video", icon: Video, className: "text-pink-600 bg-pink-50" },
  audio: { label: "Audio", icon: Music, className: "text-amber-600 bg-amber-50" },
  other: { label: "File", icon: FileIcon, className: "text-slate-500 bg-slate-50" },
};

// Mirrors the backend's classifyFileType() so the picker shows the right
// icon immediately, before the file is even uploaded.
export const classifyFileType = (file) => {
  const mimetype = file?.type || "";
  const ext = (file?.name?.split(".").pop() || "").toLowerCase();

  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype === "application/pdf" || ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["ppt", "pptx"].includes(ext)) return "powerpoint";
  return "other";
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 || size >= 10 ? 0 : 1)} ${units[i]}`;
};
