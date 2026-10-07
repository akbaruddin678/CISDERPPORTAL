import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CardFront, CardBack, CARD_W, CARD_H } from "./StudentCardFaces";

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function waitForImages(root) {
  const imgs = [...root.querySelectorAll("img")];
  await Promise.all(
    imgs.map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }),
    ),
  );
  // Background photos aren't <img>; give the browser a frame to paint them.
  await nextFrame();
  await nextFrame();
}

// Renders the two card faces off-screen and turns them into a 2-page CR80
// PDF (front, back). Kept off-screen so a card can be exported for any
// student without it being on the page.
const CardExporter = forwardRef((_props, ref) => {
  const [model, setModel] = useState(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  useImperativeHandle(ref, () => ({
    async createPdf(cardModel) {
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(`CISD|${cardModel.regNo}|${cardModel.cardNumber || ""}`, {
        margin: 0,
        width: 320,
        errorCorrectionLevel: "M",
      });
      flushSync(() => setModel({ ...cardModel, qr }));
      await waitForImages(frontRef.current.parentElement);

      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");
      const opts = { scale: 3, backgroundColor: "#ffffff", useCORS: true, logging: false };
      const [front, back] = await Promise.all([
        html2canvas(frontRef.current, opts),
        html2canvas(backRef.current, opts),
      ]);

      const doc = new jsPDF({ unit: "mm", format: [54, 85.6], orientation: "portrait" });
      doc.addImage(front.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 54, 85.6);
      doc.addPage([54, 85.6], "portrait");
      doc.addImage(back.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 54, 85.6);
      return doc.output("blob");
    },
  }));

  return (
    <div
      aria-hidden
      style={{ position: "fixed", left: -10000, top: 0, width: CARD_W * 2 + 40, height: CARD_H, pointerEvents: "none" }}
    >
      {model && (
        <div style={{ display: "flex", gap: 40 }}>
          <CardFront ref={frontRef} model={model} />
          <CardBack ref={backRef} model={model} />
        </div>
      )}
    </div>
  );
});
CardExporter.displayName = "CardExporter";

export default CardExporter;
