import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Same assets used by the real challan print template
// (frontend/src/Admin/accountant/common/ChallanPrintTemplate.js) — copied
// here since a Node process can't reach into the frontend bundle at
// runtime. This generator is a faithful port of THAT template (same
// fields, same layout, same footer/signature copy), not a redesigned
// voucher, so an emailed challan looks like the one staff print/the
// student already sees on the portal.
const LOGO_PATH = path.join(__dirname, "../../../assets/cisd-logo.png");
const ONEBILL_LOGO_PATH = path.join(__dirname, "../../../assets/onelink.png");
const STAMP_PATH = path.join(__dirname, "../../../assets/accountss.jpeg");

const NAVY = "#1a237e";
const RED = "#d32f2f";
const INK = "#111111";
const GRAY = "#333333";

const fmtPKR = (v) => `Rs ${Number(v || 0).toLocaleString("en-PK")}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "N/A");

// Ported from ChallanPrintTemplate.js's toWords — same wording/rules.
const toWords = (n) => {
  if (!n || n === 0) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
    "Eighty", "Ninety",
  ];
  const convert = (num) => {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100)
      return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "") + " ";
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " Hundred " + convert(num % 100);
    if (num < 100000)
      return convert(Math.floor(num / 1000)) + "Thousand " + convert(num % 1000);
    if (num < 10000000)
      return convert(Math.floor(num / 100000)) + "Lakh " + convert(num % 100000);
    return convert(Math.floor(num / 10000000)) + "Crore " + convert(num % 10000000);
  };
  const rupees = Math.floor(n);
  const paisa = Math.round((n - rupees) * 100);
  let result = convert(rupees).trim() + " Rupees";
  if (paisa > 0) result += " and " + convert(paisa).trim() + " Paisa";
  return result + " Only";
};

// Draws a 2-cell-pair info row: label | value | label | value (or a single
// label | value spanning the rest, when col3/col4 are omitted).
function drawInfoRow(doc, x, y, w, h, cells) {
  const colW = [w * 0.16, w * 0.34, w * 0.16, w * 0.34];
  let cx = x;
  cells.forEach((cell, i) => {
    const cw = i === 1 && cells.length === 2 ? colW[1] + colW[2] + colW[3] : colW[i];
    doc.rect(cx, y, cw, h).strokeColor("#000000").lineWidth(0.7).stroke();
    if (i % 2 === 0) {
      doc.rect(cx, y, cw, h).fill("#f5f5f5");
      doc.strokeColor("#000000").lineWidth(0.7).rect(cx, y, cw, h).stroke();
      doc.font("Helvetica-Bold").fillColor(INK);
    } else {
      doc.font("Helvetica").fillColor(INK);
    }
    doc.fontSize(8.5).text(String(cell), cx + 5, y + h / 2 - 5, {
      width: cw - 10,
      height: h,
      ellipsis: true,
    });
    cx += cw;
  });
}

export function generateChallanPdfBuffer({
  challanNo,
  studentName,
  fatherName,
  guardianPhone,
  registrationNo,
  programName,
  semesterLabel,
  sessionName,
  challanTypeLabel,
  paymentReference,
  dueDate,
  feeDetails,
  originalTotal,
  fineAmount,
  arrears,
  discountAmount,
  discountReason,
  scholarshipAmount,
  netAmount,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const contentX = 40;
      const contentWidth = pageWidth - 80;
      let y = 30;

      // --- Header ---
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, contentX, y, { width: 55, height: 55 });
      }
      if (fs.existsSync(ONEBILL_LOGO_PATH)) {
        doc.image(ONEBILL_LOGO_PATH, contentX + contentWidth - 55, y, {
          width: 55,
          height: 55,
        });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor(NAVY)
        .text("CISD", contentX + 60, y + 4, {
          width: contentWidth - 120,
          align: "center",
        });
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(RED)
        .text("FEE CHALLAN", contentX + 60, y + 24, {
          width: contentWidth - 120,
          align: "center",
        });
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(GRAY)
        .text(
          "Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad",
          contentX + 60,
          y + 40,
          { width: contentWidth - 120, align: "center" },
        );

      y += 62;
      const invoiceSuffix =
        paymentReference && paymentReference !== "00000000"
          ? paymentReference
          : challanNo;
      const invoiceId = `101340${invoiceSuffix || ""}`;
      const boxW = 180;
      const boxX = contentX + (contentWidth - boxW) / 2;
      doc.rect(boxX, y, boxW, 28).fillAndStroke("#e0f7fa", "#000000");
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(INK)
        .text("1BILL INVOICE NO.", boxX, y + 5, { width: boxW, align: "center" });
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(invoiceId, boxX, y + 15, { width: boxW, align: "center" });

      y += 42;
      doc
        .moveTo(contentX, y)
        .lineTo(contentX + contentWidth, y)
        .strokeColor("#000000")
        .lineWidth(1)
        .stroke();

      // --- Info table ---
      y += 10;
      const rowH = 20;
      drawInfoRow(doc, contentX, y, contentWidth, rowH, [
        "Due Date", fmtDate(dueDate), "Reg ID", registrationNo || "N/A",
      ]);
      y += rowH;
      drawInfoRow(doc, contentX, y, contentWidth, rowH, [
        "Name", studentName || "N/A", "Father Name", fatherName || "N/A",
      ]);
      y += rowH;
      drawInfoRow(doc, contentX, y, contentWidth, rowH, [
        "Program", programName || "N/A", "Semester", semesterLabel || "N/A",
      ]);
      y += rowH;
      drawInfoRow(doc, contentX, y, contentWidth, rowH, [
        "Session", sessionName || "N/A", "Type", challanTypeLabel || "FEE",
      ]);
      y += rowH;
      drawInfoRow(doc, contentX, y, contentWidth, rowH, [
        "Challan No.", challanNo || "N/A", "Guardian Phone", guardianPhone || "N/A",
      ]);
      y += rowH;

      y += 8;
      doc
        .moveTo(contentX, y)
        .lineTo(contentX + contentWidth, y)
        .strokeColor("#000000")
        .lineWidth(1)
        .stroke();

      // --- Fee details ---
      y += 10;
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(INK)
        .text("FEE DETAILS", contentX, y, { width: contentWidth, align: "center", underline: true });
      y += 20;

      const descW = contentWidth * 0.7;
      const amtW = contentWidth * 0.3;

      const drawFeeRow = (label, value, opts = {}) => {
        const h = 18;
        doc.rect(contentX, y, descW, h).strokeColor("#000000").lineWidth(0.6).stroke();
        doc.rect(contentX + descW, y, amtW, h).strokeColor("#000000").lineWidth(0.6).stroke();
        if (opts.shade) {
          doc.rect(contentX, y, contentWidth, h).fill(opts.shade);
          doc.strokeColor("#000000").lineWidth(0.6);
          doc.rect(contentX, y, descW, h).stroke();
          doc.rect(contentX + descW, y, amtW, h).stroke();
        }
        doc
          .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(9)
          .fillColor(opts.color || INK)
          .text(label, contentX + 6, y + h / 2 - 5, { width: descW - 12 });
        doc.text(value, contentX + descW + 6, y + h / 2 - 5, {
          width: amtW - 12,
          align: "right",
        });
        y += h;
      };

      drawFeeRow(
        `${challanTypeLabel || "FEE"} (Base)`,
        fmtPKR(originalTotal ?? netAmount),
        { shade: "#f0f0f0", bold: true },
      );

      const items = Object.entries(feeDetails || {});
      items.forEach(([key, amount]) => {
        if (!amount || Number(amount) <= 0) return;
        if (String(key).toLowerCase().includes("arrears")) return;
        const label = String(key)
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase());
        drawFeeRow(label, "—");
      });

      if (arrears > 0) drawFeeRow("Arrears / Previous", fmtPKR(arrears));
      if (fineAmount > 0)
        drawFeeRow("Late Fine", fmtPKR(fineAmount), { color: "#dc2626" });
      if (scholarshipAmount > 0)
        drawFeeRow("Scholarship", `(${fmtPKR(scholarshipAmount)})`, {
          color: "#16a34a",
        });
      if (discountAmount > 0)
        drawFeeRow(
          `Discount${discountReason ? ` (${discountReason})` : ""}`,
          `(${fmtPKR(discountAmount)})`,
          { color: "#16a34a" },
        );

      drawFeeRow("GRAND TOTAL", fmtPKR(netAmount), {
        shade: "#e0e0e0",
        bold: true,
      });

      // --- Amount in words ---
      y += 8;
      const wordsText = `Amount in Words: ${toWords(netAmount)}`;
      const wordsH = doc.font("Helvetica").fontSize(8).heightOfString(wordsText, {
        width: contentWidth - 12,
      }) + 8;
      doc.rect(contentX, y, contentWidth, wordsH).strokeColor("#cccccc").lineWidth(0.6).stroke();
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(8).text("Amount in Words: ", contentX + 6, y + 4, {
        continued: true,
      });
      doc.font("Helvetica").text(toWords(netAmount), { width: contentWidth - 12 });
      y += wordsH + 8;

      // --- Footer notes ---
      const notesLines = [
        "Note:",
        "1- Pay via 1Link/1-Bill, Banking Apps, ATMs, Easypaisa, JazzCash, etc.",
        "2- Direct deposit by visiting any bank branch nationwide.",
        "A late fee of 2,000 will be charged after the due date. Five days after the due date, the fee increases to 5,000.",
      ];
      const notesText = notesLines.join("\n");
      const notesH = doc.font("Helvetica").fontSize(8).heightOfString(notesText, {
        width: contentWidth - 12,
        lineGap: 2,
      }) + 10;
      doc.rect(contentX, y, contentWidth, notesH).fillAndStroke("#fffde7", "#000000");
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(8).text("Note:", contentX + 6, y + 5);
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(notesLines.slice(1).join("\n"), contentX + 6, y + 15, {
          width: contentWidth - 12,
          lineGap: 2,
        });
      y += notesH + 20;

      // --- Signatures ---
      const sigBoxW = contentWidth * 0.42;
      const sig1X = contentX;
      const sig2X = contentX + contentWidth - sigBoxW;
      const lineY = y + 40;

      if (fs.existsSync(STAMP_PATH)) {
        doc.image(STAMP_PATH, sig2X + sigBoxW / 2 - 25, y, { width: 50, height: 40 });
      }

      doc.moveTo(sig1X, lineY).lineTo(sig1X + sigBoxW, lineY).strokeColor("#000000").lineWidth(0.8).stroke();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(INK).text("BANK OFFICIAL", sig1X, lineY + 4, {
        width: sigBoxW,
        align: "center",
      });

      doc.moveTo(sig2X, lineY).lineTo(sig2X + sigBoxW, lineY).strokeColor("#000000").lineWidth(0.8).stroke();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(INK).text("ACCOUNTS OFFICER", sig2X, lineY + 4, {
        width: sigBoxW,
        align: "center",
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
