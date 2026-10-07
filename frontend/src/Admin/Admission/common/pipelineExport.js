import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Shared by every Admission Process tab (Incomplete/Complete/Accepted/
// Challan Generated/Fee Paid/Fee Overdue) so each one's PDF/Excel export
// uses the same layout instead of hand-rolling its own jsPDF/XLSX
// boilerplate. `columns` is [{ header, value(row) }] — the same shape
// drives both exports so a tab only defines its columns once.
export function exportRowsToPDF({ title, columns, rows, filename }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB")} — Total: ${rows.length}`,
    14,
    21,
  );
  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => c.value(r) ?? "N/A")),
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
  });
  doc.save(filename);
}

export function exportRowsToExcel({ columns, rows, filename, sheetName = "Sheet1" }) {
  const data = rows.map((r) => {
    const obj = {};
    columns.forEach((c) => {
      obj[c.header] = c.value(r) ?? "N/A";
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = columns.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
