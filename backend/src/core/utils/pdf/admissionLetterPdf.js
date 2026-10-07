import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend-owned copies — a Node process can't reach into the frontend
// bundle's src/ for these at runtime, so the logo and signature both live
// here too (copied from frontend/src/assets/ and frontend/src/components/
// images/). The letter still renders correctly (just without a signature
// image, falling back to the line + caption) if admission-sign.png isn't
// present at this exact path.
const LOGO_PATH = path.join(__dirname, "../../../assets/cisd-logo.png");
const SIGNATURE_PATH = path.join(
  __dirname,
  "../../../assets/admission-sign.png",
);

const PRIMARY = "#1e3a8a";
const ACCENT = "#d97706";
const INK = "#1f2937";
const MUTED = "#6b7280";

// Renders a formal admission-acceptance letter and resolves with the
// finished PDF as a Buffer, ready to attach to an email.
export function generateAdmissionLetterPdfBuffer({
  fullName,
  programName,
  departmentName,
  sessionName,
  acceptedDate,
  guardianPhone,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentX = 44;
      const contentWidth = pageWidth - 88;

      // --- Header band ---
      const headerH = 132;
      doc.rect(0, 0, pageWidth, headerH).fill(PRIMARY);
      // Thin accent strip under the header — a small polish touch that
      // separates the letterhead from the body more deliberately than a
      // flat color change alone.
      doc.rect(0, headerH, pageWidth, 4).fill(ACCENT);

      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, contentX, 30, { width: 72, height: 72 });
      }

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("CISD", contentX + 88, 38, {
          width: contentWidth - 88,
        });
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#dbeafe")
        .text("Islamabad, Pakistan", contentX + 88, 68);
      doc
        .font("Helvetica-Bold")
        .fontSize(12.5)
        .fillColor("#fde68a")
        .text("OFFICIAL LETTER OF ADMISSION", contentX + 88, 92, {
          characterSpacing: 0.5,
        });

      // --- Date / contact line ---
      let y = headerH + 26;
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(MUTED)
        .text(`Date: ${acceptedDate}`, contentX, y, {
          width: contentWidth,
          align: "right",
        });
      if (guardianPhone) {
        y += 14;
        doc.text(`Guardian/Father Phone: ${guardianPhone}`, contentX, y, {
          width: contentWidth,
          align: "right",
        });
      }

      // --- Salutation ---
      y += 26;
      doc
        .fillColor(INK)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(`Dear ${fullName},`, contentX, y);

      // --- Body copy ---
      doc.moveDown(1.2);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(INK)
        .text(
          "Congratulations! We are delighted to inform you that your application for admission to CISD has been ACCEPTED.",
          contentX,
          doc.y,
          { width: contentWidth, align: "justify", lineGap: 4 },
        );

      doc.moveDown(1);
      doc.text(
        `You have been admitted to the ${programName} program under the ${departmentName} department, for the ${sessionName} session.`,
        contentX,
        doc.y,
        { width: contentWidth, align: "justify", lineGap: 4 },
      );

      // --- Payment callout box ---
      doc.moveDown(1.1);
      const calloutPad = 14;
      const calloutText =
        "To confirm your admission, please pay the first admission fee challan at your earliest convenience. The challan is available on the Student Portal and has also been sent to you by email.";
      const calloutTextWidth = contentWidth - calloutPad * 2 - 6;
      const calloutTextHeight = doc
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .heightOfString(calloutText, { width: calloutTextWidth, lineGap: 3 });
      const calloutY = doc.y;
      const calloutH = calloutTextHeight + calloutPad * 2;

      doc.rect(contentX, calloutY, contentWidth, calloutH).fill("#eef2ff");
      doc.rect(contentX, calloutY, 4, calloutH).fill(PRIMARY);
      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text(calloutText, contentX + calloutPad + 6, calloutY + calloutPad, {
          width: calloutTextWidth,
          lineGap: 3,
        });

      // --- Closing paragraph ---
      doc.y = calloutY + calloutH;
      doc.moveDown(1.1);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(INK)
        .text(
          "Our Admissions Office remains available to assist you with orientation, fee payment, and any other queries as you begin this new chapter with us. Once again, congratulations on this achievement — we look forward to welcoming you to our academic community.",
          contentX,
          doc.y,
          { width: contentWidth, align: "justify", lineGap: 4 },
        );

      // --- Signature block ---
      const sigY = Math.max(doc.y + 60, pageHeight - 190);
      if (fs.existsSync(SIGNATURE_PATH)) {
        doc.image(SIGNATURE_PATH, contentX, sigY - 52, { width: 140 });
      }
      doc
        .moveTo(contentX, sigY)
        .lineTo(contentX + 190, sigY)
        .strokeColor("#d1d5db")
        .lineWidth(1)
        .stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .fillColor(INK)
        .text("Admissions Office", contentX, sigY + 8);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED)
        .text("CISD", contentX, sigY + 22);

      // --- Footer ---
      const footerY = pageHeight - 62;
      doc
        .moveTo(contentX, footerY)
        .lineTo(pageWidth - contentX, footerY)
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .stroke();
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#9ca3af")
        .text(
          `This is a computer-generated document and does not require a physical signature to be valid. © ${new Date().getFullYear()} CISD. All rights reserved.`,
          contentX,
          footerY + 12,
          { width: contentWidth, align: "center" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
