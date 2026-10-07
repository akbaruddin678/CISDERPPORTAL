export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Prints the PDF through a hidden frame; falls back to a new tab if the
// browser won't print from it.
export function printBlob(blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      window.open(url, "_blank");
    }
    setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 60000);
  };
  document.body.appendChild(frame);
}

// Crops the image to a 3:4 passport frame (zoom + pan in source-pixel space)
// and returns a 600x800 JPEG blob — small enough to upload quickly and
// consistent on every card.
export function cropToPassport(img, { zoom = 1, offsetX = 0, offsetY = 0, width = 600, asCanvas = false }) {
  const OUT_W = width;
  const OUT_H = (width * 4) / 3;
  const baseScale = Math.max(OUT_W / img.width, OUT_H / img.height);
  const scale = baseScale * zoom;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const maxX = Math.max(0, (drawW - OUT_W) / 2);
  const maxY = Math.max(0, (drawH - OUT_H) / 2);
  const dx = (OUT_W - drawW) / 2 + Math.max(-maxX, Math.min(maxX, offsetX));
  const dy = (OUT_H - drawH) / 2 + Math.max(-maxY, Math.min(maxY, offsetY));

  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUT_W, OUT_H);
  ctx.drawImage(img, dx, dy, drawW, drawH);
  if (asCanvas) return canvas;
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9));
}
