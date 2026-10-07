import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, X, RotateCcw, Check, Loader2, ZoomIn, Move } from "lucide-react";
import { cropToPassport } from "./cardFiles";

const PREVIEW_W = 240;
const PREVIEW_H = 320;

const loadImageFromUrl = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

// Pick a file or take a picture, frame it to a passport crop, then save it
// as the student's official photo.
const PhotoCaptureModal = ({ studentName, saving, onSave, onClose }) => {
  const [step, setStep] = useState("choose"); // choose | camera | adjust
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const drag = useRef(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
  useEffect(() => stopCamera, [stopCamera]);

  const adoptImage = (img) => {
    stopCamera();
    setImage(img);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setStep("adjust");
  };

  const onFile = async (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (JPG or PNG).");
    if (file.size > 12 * 1024 * 1024) return setError("That image is too large. Choose one under 12 MB.");
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImageFromUrl(url);
      adoptImage(img);
    } catch {
      setError("That image couldn't be opened.");
    }
  };

  const startCamera = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      return setError("This browser can't use the camera. Upload a photo instead.");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setStep("camera");
    } catch {
      setError("Camera access was blocked or no camera was found. Allow camera access, or upload a photo.");
    }
  };

  // Attach the stream once the <video> exists.
  useEffect(() => {
    if (step === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [step]);

  const snap = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    const img = await loadImageFromUrl(c.toDataURL("image/jpeg", 0.95));
    adoptImage(img);
  };

  // Live preview of exactly what will be saved.
  useEffect(() => {
    if (step !== "adjust" || !image || !canvasRef.current) return;
    const ratio = PREVIEW_W / 600;
    const out = cropToPassport(image, {
      zoom,
      offsetX: offset.x * ratio,
      offsetY: offset.y * ratio,
      width: PREVIEW_W,
      asCanvas: true,
    });
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.drawImage(out, 0, 0);
  }, [step, image, zoom, offset]);

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const k = 600 / PREVIEW_W;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x) * k,
      y: drag.current.oy + (e.clientY - drag.current.y) * k,
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const save = async () => {
    const blob = await cropToPassport(image, { zoom, offsetX: offset.x, offsetY: offset.y });
    const previewUrl = URL.createObjectURL(blob);
    await onSave(blob, previewUrl);
  };

  const retake = () => {
    setImage(null);
    setStep("choose");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">Student photo</h3>
            <p className="text-xs font-medium text-slate-500">
              {studentName} — saved as the official picture in the system
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <p className="mb-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">{error}</p>
          )}

          {step === "choose" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-8 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                <span className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload size={24} />
                </span>
                <span className="text-sm font-black text-slate-800">Select a photo</span>
                <span className="text-[11px] font-medium text-slate-400">JPG or PNG from this device</span>
              </button>
              <button
                onClick={startCamera}
                className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-8 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
              >
                <span className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera size={24} />
                </span>
                <span className="text-sm font-black text-slate-800">Take a photo</span>
                <span className="text-[11px] font-medium text-slate-400">Use the camera now</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {step === "camera" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900" style={{ width: PREVIEW_W * 1.4, height: PREVIEW_H * 1.4 * 0.75 }}>
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="h-[92%] aspect-[3/4] rounded-[40%] border-2 border-dashed border-white/60" />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    stopCamera();
                    setStep("choose");
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={snap}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <Camera size={16} /> Capture
                </button>
              </div>
            </div>
          )}

          {step === "adjust" && (
            <div className="flex flex-col items-center gap-4">
              <canvas
                ref={canvasRef}
                width={PREVIEW_W}
                height={PREVIEW_H}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="rounded-2xl shadow-lg ring-4 ring-white cursor-grab active:cursor-grabbing touch-none bg-slate-100"
                style={{ width: PREVIEW_W, height: PREVIEW_H }}
              />
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Move size={12} /> Drag to position the face in the frame
              </p>
              <label className="flex items-center gap-3 w-64 text-slate-500">
                <ZoomIn size={16} />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
              </label>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={retake}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  <RotateCcw size={15} /> Choose another
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Use this photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoCaptureModal;
