import React, { useState } from "react";
import {
  Filter as FilterIcon,
  X as ClearIcon,
  Download,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useDailyInvoice } from "../../controller/useDailyInvoice";
import {
  ShiftUnpaidDateModal,
  ClearUnpaidModal,
  EditInvoiceDateModal,
  DeleteInvoiceModal,
  ViewInvoiceModal,
} from "./DailyInvoiceModals";

const diCss = `
  /* Self-contained — this component is rendered inside two different
     parent shells (College's COIS container and University's Challan
     Management dashboard), neither of which is guaranteed to provide
     .card/.data-table/.badge/etc., so every base style it needs lives here. */
  .di-page-header { margin-bottom: 24px; }
  .di-page-header h1 { font-size: 20px; font-weight: 700; color: #1C1917; margin: 0 0 4px; }
  .di-page-header p { font-size: 13px; color: #78716C; margin: 0; }
  .di-card { background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 10px; }
  .di-card-body { padding: 16px 20px; }
  .di-filter-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: #A8A29E; margin-bottom: 5px; display: block;
  }
  .di-filter-select {
    width: 100%; background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 7px;
    padding: 7px 10px; font-size: 12px; font-weight: 500; color: #1C1917;
    outline: none; font-family: inherit;
  }
  .di-filter-select:focus { border-color: #13294B; }
  .di-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .di-table thead th {
    background: #FAFAF9; padding: 10px 16px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em; color: #A8A29E;
    border-bottom: 1px solid #E7E5E4; text-align: left; white-space: nowrap;
  }
  .di-table tbody td {
    padding: 11px 16px; border-bottom: 1px solid #F5F4F1; color: #44403C;
    vertical-align: middle; white-space: nowrap;
  }
  .di-table tbody tr:last-child td { border-bottom: none; }
  .di-table tbody tr:hover td { background: #FAFAF9; }
  .di-badge {
    display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  }
  .di-badge-paid { background: #DCFCE7; color: #166534; }
  .di-badge-pending { background: #FEF9C3; color: #854D0E; }
  .di-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; font-size: 11px; }
  .di-filter-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    align-items: end;
  }
  .di-filter-actions {
    grid-column: span 5;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }
  .di-btn-navy {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 7px;
    font-size: 12px; font-weight: 600; cursor: pointer;
    border: 1px solid #13294B; background: #13294B; color: #fff;
    font-family: inherit; transition: background 0.12s;
    white-space: nowrap;
  }
  .di-btn-navy:hover { background: #0D1F38; }
  .di-btn-navy:disabled { opacity: 0.55; cursor: not-allowed; }
  .di-btn-navy-outline {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 7px;
    font-size: 12px; font-weight: 600; cursor: pointer;
    border: 1px solid #CBD5E1; background: #fff; color: #13294B;
    font-family: inherit; transition: background 0.12s;
  }
  .di-btn-navy-outline:hover { background: #F1F5F9; }
  .di-export-menu {
    position: absolute; top: calc(100% + 4px); right: 0; z-index: 20;
    background: #fff; border: 1px solid #E7E5E4; border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden; min-width: 140px;
  }
  .di-export-menu button {
    display: block; width: 100%; text-align: left; padding: 9px 14px;
    font-size: 12px; font-weight: 500; color: #1C1917; background: #fff;
    border: none; cursor: pointer; font-family: inherit;
  }
  .di-export-menu button:hover { background: #F5F4F1; }
  .di-export-menu button:disabled { opacity: 0.5; cursor: not-allowed; }
  .di-pagination { display: flex; align-items: center; gap: 4px; }
  .di-pagination button {
    min-width: 30px; height: 30px; padding: 0 8px;
    border-radius: 6px; border: 1px solid #E7E5E4; background: #fff;
    color: #44403C; font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: inherit;
  }
  .di-pagination button:hover:not(:disabled) { background: #F5F4F1; }
  .di-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
  .di-pagination button.active { background: #13294B; border-color: #13294B; color: #fff; }
  .di-ellipsis { padding: 0 4px; color: #A8A29E; font-size: 12px; }
  .di-row-actions { display: flex; gap: 6px; }
  .di-row-actions button {
    width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
    border-radius: 6px; border: 1px solid #E7E5E4; background: #fff; cursor: pointer;
    color: #57534E;
  }
  .di-row-actions button:hover { background: #F5F4F1; }
  .di-row-actions button.danger { color: #B91C1C; border-color: #FECACA; background: #FEF2F2; }
  .di-row-actions button.danger:hover { background: #FEE2E2; }
  .di-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  .di-summary-card {
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-left: 4px solid #13294B;
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .di-summary-card.paid { border-left-color: #16A34A; }
  .di-summary-card.outstanding { border-left-color: #DC2626; }
  .di-summary-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #A8A29E; }
  .di-summary-value { font-size: 20px; font-weight: 700; color: #1C1917; }
`;

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "");

const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pageSet = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pageSet].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const withEllipsis = [];
  let prev = 0;
  sorted.forEach((p) => {
    if (prev && p - prev > 1) withEllipsis.push(`e${prev}`);
    withEllipsis.push(p);
    prev = p;
  });
  return withEllipsis;
};

const DailyInvoiceView = ({ scope = "college" }) => {
  const {
    draftFilters,
    handleFilterFieldChange,
    applyFilters,
    clearFilters,

    rows,
    pagination,
    summary,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    isLoading,

    isExporting,
    exportPDF,
    exportExcel,

    isShiftDateModalOpen,
    openShiftDateModal,
    closeShiftDateModal,
    confirmShiftDate,
    isShiftingDate,

    isClearModalOpen,
    openClearModal,
    closeClearModal,
    confirmClearUnpaid,
    isClearing,

    viewTarget,
    openViewModal,
    closeViewModal,

    editTarget,
    openEditModal,
    closeEditModal,
    confirmEditDueDate,
    isSavingEdit,

    deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
  } = useDailyInvoice(scope);

  const [exportOpen, setExportOpen] = useState(false);

  const total = pagination.total || 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const scopeLabel = scope === "university" ? "University" : "College";

  return (
    <div>
      <style>{diCss}</style>

      <div className="di-page-header">
        <h1>Daily Invoice</h1>
        <p>All {scopeLabel} fee invoices — filter, review and manage in one place</p>
      </div>

      {/* Filter Bar */}
      <div className="di-card" style={{ marginBottom: 16 }}>
        <div className="di-card-body">
          <div className="di-filter-grid">
            <div>
              <label className="di-filter-label">Invoice No</label>
              <input
                className="di-filter-select"
                value={draftFilters.invoiceNo}
                onChange={(e) => handleFilterFieldChange("invoiceNo", e.target.value)}
                placeholder="Invoice or 1Bill No"
              />
            </div>
            <div>
              <label className="di-filter-label">Due Date Range</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="date"
                  className="di-filter-select"
                  value={draftFilters.dueFrom}
                  onChange={(e) => handleFilterFieldChange("dueFrom", e.target.value)}
                />
                <input
                  type="date"
                  className="di-filter-select"
                  value={draftFilters.dueTo}
                  onChange={(e) => handleFilterFieldChange("dueTo", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="di-filter-label">Paid Date Range</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="date"
                  className="di-filter-select"
                  value={draftFilters.paidFrom}
                  onChange={(e) => handleFilterFieldChange("paidFrom", e.target.value)}
                />
                <input
                  type="date"
                  className="di-filter-select"
                  value={draftFilters.paidTo}
                  onChange={(e) => handleFilterFieldChange("paidTo", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="di-filter-label">Name</label>
              <input
                className="di-filter-select"
                value={draftFilters.name}
                onChange={(e) => handleFilterFieldChange("name", e.target.value)}
                placeholder="Student name"
              />
            </div>
            <div>
              <label className="di-filter-label">Status</label>
              <select
                className="di-filter-select"
                value={draftFilters.status}
                onChange={(e) => handleFilterFieldChange("status", e.target.value)}
              >
                <option value="">-- Select --</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div className="di-filter-actions">
              <button className="di-btn-navy" onClick={applyFilters}>
                <FilterIcon size={14} /> Filter
              </button>
              <button className="di-btn-navy-outline" onClick={clearFilters}>
                <ClearIcon size={14} /> Clear
              </button>
              <div style={{ position: "relative" }}>
                <button className="di-btn-navy" onClick={() => setExportOpen((o) => !o)}>
                  <Download size={14} /> Export <ChevronDown size={12} />
                </button>
                {exportOpen && (
                  <div className="di-export-menu">
                    <button
                      disabled={isExporting}
                      onClick={() => {
                        setExportOpen(false);
                        exportPDF();
                      }}
                    >
                      Export PDF
                    </button>
                    <button
                      disabled={isExporting}
                      onClick={() => {
                        setExportOpen(false);
                        exportExcel();
                      }}
                    >
                      Export Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totals for the currently filtered set (whole set, not just this page) */}
      <div className="di-summary-grid">
        <div className="di-summary-card">
          <span className="di-summary-label">Amount ({total.toLocaleString()} invoices)</span>
          <span className="di-summary-value">{fmtMoney(summary.totalAmount)}</span>
        </div>
        <div className="di-summary-card paid">
          <span className="di-summary-label">Paid Amount</span>
          <span className="di-summary-value">{fmtMoney(summary.totalPaidAmount)}</span>
        </div>
        <div className="di-summary-card outstanding">
          <span className="di-summary-label">Outstanding</span>
          <span className="di-summary-value">
            {fmtMoney(Math.max(summary.totalAmount - summary.totalPaidAmount, 0))}
          </span>
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14 }}>
        <button className="di-btn-navy" onClick={openShiftDateModal}>
          Change Unpaid Invoice Date
        </button>
        <button className="di-btn-navy" onClick={openClearModal}>
          Clear Unpaid Invoices
        </button>
      </div>

      {/* Entries selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          fontSize: 13,
          color: "#78716C",
        }}
      >
        Show
        <select
          className="di-filter-select"
          style={{ width: 72 }}
          value={limit}
          onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        entries
      </div>

      {/* Table */}
      <div className="di-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="di-table" style={{ minWidth: 1400 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Reg No</th>
                <th>One Bill Invoice No</th>
                <th>Name</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>After Due Date</th>
                <th>Amount Paid</th>
                <th>Paid Date</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Paid By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: 32, color: "#A8A29E" }}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: 32, color: "#A8A29E" }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r._id}>
                    <td className="di-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="di-mono">{r.regNo}</td>
                    <td className="di-mono">{r.oneBillInvoiceNo || "—"}</td>
                    <td>{r.name}</td>
                    <td>{fmtDate(r.dueDate)}</td>
                    <td>{fmtMoney(r.amount)}</td>
                    <td>{fmtMoney(r.afterDueDateAmount)}</td>
                    <td>{fmtMoney(r.amountPaid)}</td>
                    <td>{r.paidDate ? fmtDate(r.paidDate) : "—"}</td>
                    <td>{r.mobile}</td>
                    <td>
                      <span
                        className={`di-badge ${r.status === "PAID" ? "di-badge-paid" : "di-badge-pending"}`}
                      >
                        {r.status === "PAID" ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td>{r.paidBy || "—"}</td>
                    <td>
                      <div className="di-row-actions">
                        <button title="View" onClick={() => openViewModal(r)}>
                          <Eye size={13} />
                        </button>
                        {r.status !== "PAID" && (
                          <>
                            <button title="Edit due date" onClick={() => openEditModal(r)}>
                              <Pencil size={13} />
                            </button>
                            <button
                              title="Cancel invoice"
                              className="danger"
                              onClick={() => openDeleteModal(r)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          fontSize: 13,
          color: "#78716C",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          Showing {from} to {to} of {total.toLocaleString()} entries
        </div>
        <div className="di-pagination">
          <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
            Previous
          </button>
          {buildPageList(page, pagination.totalPages).map((p) =>
            typeof p === "string" ? (
              <span key={p} className="di-ellipsis">
                …
              </span>
            ) : (
              <button
                key={p}
                className={p === page ? "active" : ""}
                onClick={() => handlePageChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <ShiftUnpaidDateModal
        isOpen={isShiftDateModalOpen}
        onClose={closeShiftDateModal}
        onConfirm={confirmShiftDate}
        isLoading={isShiftingDate}
      />
      <ClearUnpaidModal
        isOpen={isClearModalOpen}
        onClose={closeClearModal}
        onConfirm={confirmClearUnpaid}
        isLoading={isClearing}
      />
      <ViewInvoiceModal isOpen={!!viewTarget} onClose={closeViewModal} target={viewTarget} />
      <EditInvoiceDateModal
        isOpen={!!editTarget}
        onClose={closeEditModal}
        target={editTarget}
        onConfirm={confirmEditDueDate}
        isLoading={isSavingEdit}
      />
      <DeleteInvoiceModal
        isOpen={!!deleteTarget}
        onClose={closeDeleteModal}
        target={deleteTarget}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DailyInvoiceView;
