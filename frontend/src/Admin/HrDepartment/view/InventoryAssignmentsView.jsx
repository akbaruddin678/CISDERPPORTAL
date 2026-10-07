import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Skeleton,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Person,
  Inventory2,
  Close,
  AssignmentReturn,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";

const STATUS_MAP = {
  Active: { label: "Active", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  Returned: { label: "Returned", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  Lost: { label: "Lost", color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
  Damaged: { label: "Damaged", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  Consumed: { label: "Consumed", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
};

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const PickerBox = ({ icon: Icon, label, query, setQuery, results, onPick, selected, onClear, renderResult, isLoading }) => (
  <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5, bgcolor: "#fff", position: "relative" }}>
    <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
      <Icon sx={{ fontSize: 14, color: "#94a3b8" }} />
      <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em">
        {label}
      </Typography>
    </Box>
    {selected ? (
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        <Box minWidth={0}>{renderResult(selected, true)}</Box>
        <IconButton size="small" onClick={onClear}><Close sx={{ fontSize: 15 }} /></IconButton>
      </Box>
    ) : (
      <>
        <input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, fontWeight: 700, color: "#1e293b", fontFamily: "'Montserrat', sans-serif", background: "transparent" }}
        />
        {query && (
          <Paper elevation={4} sx={{ position: "absolute", top: "100%", left: 0, right: 0, mt: 0.5, zIndex: 20, maxHeight: 260, overflowY: "auto", borderRadius: 2 }}>
            {isLoading ? (
              <Box p={1.5}><Typography fontSize={12} color="#94a3b8">Loading...</Typography></Box>
            ) : results.length === 0 ? (
              <Box p={1.5}><Typography fontSize={12} color="#94a3b8">No matches.</Typography></Box>
            ) : (
              results.map((r) => (
                <Box
                  key={r._id}
                  onClick={() => onPick(r)}
                  sx={{ px: 1.5, py: 1, cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" }, borderBottom: "1px solid #f1f5f9" }}
                >
                  {renderResult(r, false)}
                </Box>
              ))
            )}
          </Paper>
        )}
      </>
    )}
  </Box>
);

const InventoryAssignmentsView = ({
  tab, setTab,
  assignments, isLoadingAssignments,
  staffQuery, setStaffQuery, staffResults, selectedStaff, pickStaff, clearStaff, isFetchingStaff,
  itemQuery, setItemQuery, itemResults, selectedItem, pickItem, clearItem, isFetchingItems,
  issueForm, updateIssueField, submitIssue, isIssuing, issueError, issueSuccess,
  returnTarget, returnForm, openReturnModal, closeReturnModal, updateReturnField, submitReturn, isReturning, returnError,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Staff Asset Assignment
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25}>
          Issue inventory against a staff record, and track returns, losses, and damage.
        </Typography>
      </Box>

      {/* Issue New Item */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden", mb: 3 }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: "0.5px solid #e2e8f0", bgcolor: "#f8fafc" }}>
          <Typography fontSize={13} fontWeight={800} color="#0f172a">Issue New Item</Typography>
        </Box>
        <Box sx={{ p: 2.25, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          <PickerBox
            icon={Person} label="Staff Member"
            query={staffQuery} setQuery={setStaffQuery} results={staffResults}
            onPick={pickStaff} selected={selectedStaff} onClear={clearStaff} isLoading={isFetchingStaff}
            renderResult={(s) => (
              <>
                <Typography fontSize={13} fontWeight={700} color="#1e293b" noWrap>{s.personalInfo?.name || "Unknown"}</Typography>
                <Typography fontSize={11} color="#94a3b8" noWrap>{s.employeeId} · {s.designation}</Typography>
              </>
            )}
          />
          <PickerBox
            icon={Inventory2} label="Item"
            query={itemQuery} setQuery={setItemQuery} results={itemResults}
            onPick={pickItem} selected={selectedItem} onClear={clearItem} isLoading={isFetchingItems}
            renderResult={(i) => (
              <>
                <Typography fontSize={13} fontWeight={700} color="#1e293b" noWrap>{i.name}</Typography>
                <Typography fontSize={11} color="#94a3b8" noWrap>{i.category} · {i.availableQuantity} {i.unit} available</Typography>
              </>
            )}
          />
        </Box>

        {(selectedStaff || selectedItem) && (
          <Box sx={{ px: 2.25, pb: 2.25, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,1fr)" }, gap: 1.5 }}>
            <TextField
              label="Quantity" size="small" type="number"
              value={issueForm.quantity} onChange={(e) => updateIssueField("quantity", e.target.value)}
              inputProps={{ min: 1, max: selectedItem?.availableQuantity || undefined }}
            />
            {!selectedItem?.isConsumable && (
              <TextField
                label="Expected Return" size="small" type="date" InputLabelProps={{ shrink: true }}
                value={issueForm.expectedReturnDate} onChange={(e) => updateIssueField("expectedReturnDate", e.target.value)}
              />
            )}
            <TextField
              label="Condition at Issue" size="small"
              value={issueForm.conditionAtIssue} onChange={(e) => updateIssueField("conditionAtIssue", e.target.value)}
              placeholder={selectedItem?.condition || "Good"}
            />
            <TextField
              label="Remarks" size="small"
              value={issueForm.remarks} onChange={(e) => updateIssueField("remarks", e.target.value)}
            />
          </Box>
        )}

        <Box sx={{ px: 2.25, pb: 2.25, display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="contained" disableElevation onClick={submitIssue} disabled={isIssuing || !selectedStaff || !selectedItem}
            sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", borderRadius: 2, px: 3 }}
          >
            {isIssuing ? "Issuing..." : "Issue Item"}
          </Button>
          {issueError && <Typography fontSize={12.5} fontWeight={700} color="#dc2626">{issueError}</Typography>}
          {issueSuccess && <Typography fontSize={12.5} fontWeight={700} color="#059669">{issueSuccess}</Typography>}
        </Box>
      </Paper>

      {/* Assignments list */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{ borderBottom: "1px solid #e2e8f0", px: 2, minHeight: 44, "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: 13, minHeight: 44 } }}
        >
          <Tab label="Active Assignments" value="Active" />
          <Tab label="History" value="History" />
        </Tabs>

        {isLoadingAssignments ? (
          <Box p={2.5} display="flex" flexDirection="column" gap={1.5}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={64} />)}
          </Box>
        ) : assignments.length === 0 ? (
          <Box py={7} textAlign="center">
            <CheckCircle sx={{ fontSize: 36, color: "#cbd5e1" }} />
            <Typography fontSize={13.5} fontWeight={700} color="#64748b" mt={1}>
              {tab === "Active" ? "No items currently assigned." : "No history yet."}
            </Typography>
          </Box>
        ) : (
          <Box>
            {assignments.map((a) => {
              const st = STATUS_MAP[a.status] || STATUS_MAP.Active;
              const staffName = a.staffId?.personalInfo?.name || "Unknown Staff";
              return (
                <Box
                  key={a._id}
                  sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}
                >
                  <Box minWidth={180} flex={1}>
                    <Typography fontSize={13.5} fontWeight={800} color="#0f172a">{a.itemId?.name || "Unknown Item"}</Typography>
                    <Typography fontSize={11.5} color="#94a3b8">{a.itemId?.category} · Qty {a.quantity}</Typography>
                  </Box>
                  <Box minWidth={160} flex={1}>
                    <Typography fontSize={13} fontWeight={700} color="#334155">{staffName}</Typography>
                    <Typography fontSize={11.5} color="#94a3b8">{a.staffId?.employeeId} · {a.staffId?.designation}</Typography>
                  </Box>
                  <Box minWidth={140}>
                    <Typography fontSize={11.5} color="#94a3b8">Issued {fmtDate(a.assignedDate)}</Typography>
                    {a.expectedReturnDate && <Typography fontSize={11.5} color="#94a3b8">Due {fmtDate(a.expectedReturnDate)}</Typography>}
                  </Box>
                  <Chip
                    label={st.label} size="small"
                    sx={{ fontSize: 11, fontWeight: 800, height: 22, bgcolor: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                  />
                  {a.type === "Assignment" && a.status === "Active" && (
                    <Button
                      size="small" variant="outlined" startIcon={<AssignmentReturn sx={{ fontSize: 15 }} />}
                      onClick={() => openReturnModal(a)}
                      sx={{ fontWeight: 700, textTransform: "none", fontSize: 12, borderColor: "#2563eb", color: "#2563eb" }}
                    >
                      Return
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Return Modal */}
      <Dialog open={Boolean(returnTarget)} onClose={closeReturnModal} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Return "{returnTarget?.itemId?.name}"</DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              select label="Outcome" size="small"
              value={returnForm.status} onChange={(e) => updateReturnField("status", e.target.value)}
            >
              <MenuItem value="Returned">Returned — Good Condition</MenuItem>
              <MenuItem value="Damaged">Returned — Damaged</MenuItem>
              <MenuItem value="Lost">Lost / Not Returned</MenuItem>
            </TextField>
            <TextField
              label="Condition Notes" size="small"
              value={returnForm.conditionAtReturn} onChange={(e) => updateReturnField("conditionAtReturn", e.target.value)}
            />
            <TextField
              label="Remarks" size="small" multiline rows={2}
              value={returnForm.remarks} onChange={(e) => updateReturnField("remarks", e.target.value)}
            />
            {returnError && (
              <Typography fontSize={12.5} fontWeight={700} color="#dc2626" display="flex" alignItems="center" gap={0.5}>
                <ErrorOutline sx={{ fontSize: 15 }} /> {returnError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={closeReturnModal} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained" disableElevation onClick={submitReturn} disabled={isReturning}
            sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, px: 3, textTransform: "none" }}
          >
            {isReturning ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryAssignmentsView;
