import React from "react";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  Button,
  Chip,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import {
  Search,
  FilterAlt,
  Add,
  Edit,
  DeleteOutline,
  WarningAmber,
  Inventory2,
  Close,
  MeetingRoom,
} from "@mui/icons-material";

const CONDITION_MAP = {
  New: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  Good: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  Fair: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  Poor: { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  "Under Repair": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  Retired: { color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
};

const fieldSelectSx = { fontSize: 13.5, fontWeight: 700, color: "#1e293b", ".MuiSelect-select": { py: 0.25 } };

const FieldCard = ({ icon: Icon, label, accent = "#2563eb", children }) => (
  <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5, bgcolor: "#fff", minWidth: 0 }}>
    <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
      <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: `${accent}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon sx={{ fontSize: 12.5, color: accent }} />
      </Box>
      <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" noWrap>
        {label}
      </Typography>
    </Box>
    {children}
  </Box>
);

const ItemCard = ({ item, onEdit, onDelete }) => {
  const cond = CONDITION_MAP[item.condition] || CONDITION_MAP.Good;
  const isLow = item.isLowStock;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: isLow ? "1px solid #fecaca" : "1px solid #e2e8f0",
        bgcolor: "#fff",
        overflow: "hidden",
        transition: "all 0.18s",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": { boxShadow: "0 8px 24px -8px rgba(15,23,42,0.15)" },
      }}
    >
      <Box sx={{ p: 2.25, pb: 1.25 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Typography fontSize={14.5} fontWeight={800} color="#0f172a" sx={{ wordBreak: "break-word" }}>
            {item.name}
          </Typography>
          <Box display="flex" gap={0.25} flexShrink={0}>
            <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: "#64748b" }}>
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(item)} sx={{ color: "#dc2626" }}>
              <DeleteOutline sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
        {item.sku && (
          <Typography fontSize={11.5} color="#94a3b8" fontWeight={700}>
            SKU: {item.sku}
          </Typography>
        )}
      </Box>

      <Box sx={{ px: 2.25, display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
        <Chip
          label={item.condition}
          size="small"
          sx={{ fontSize: 11, fontWeight: 800, height: 22, bgcolor: cond.bg, color: cond.color, border: `1px solid ${cond.border}` }}
        />
        {item.isConsumable && (
          <Chip label="Consumable" size="small" sx={{ fontSize: 11, fontWeight: 700, height: 22, bgcolor: "#f1f5f9", color: "#475569" }} />
        )}
        {isLow && (
          <Chip
            icon={<WarningAmber sx={{ fontSize: 13, color: "#be123c !important" }} />}
            label="Low Stock"
            size="small"
            sx={{ fontSize: 11, fontWeight: 800, height: 22, bgcolor: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}
          />
        )}
      </Box>

      {item.roomId?.name && (
        <Typography fontSize={12.5} color="#2563eb" fontWeight={700} sx={{ px: 2.25, mb: 0.75, display: "flex", alignItems: "center", gap: 0.5 }}>
          <MeetingRoom sx={{ fontSize: 14 }} /> {item.roomId.name}
        </Typography>
      )}
      {item.location && (
        <Typography fontSize={12.5} color="#475569" fontWeight={600} sx={{ px: 2.25, mb: 0.75 }}>
          📍 {item.location}
        </Typography>
      )}
      {item.serialNumber && (
        <Typography fontSize={12.5} color="#475569" fontWeight={600} sx={{ px: 2.25, mb: 0.75 }}>
          S/N: {item.serialNumber}
        </Typography>
      )}

      <Box sx={{ mt: "auto", px: 2.25, py: 1.5, borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
        <Box>
          <Typography fontSize={9.5} fontWeight={800} color="#94a3b8" textTransform="uppercase">Total</Typography>
          <Typography fontSize={13} fontWeight={800} color="#0f172a">{item.totalQuantity} {item.unit}</Typography>
        </Box>
        <Box>
          <Typography fontSize={9.5} fontWeight={800} color="#94a3b8" textTransform="uppercase">Available</Typography>
          <Typography fontSize={13} fontWeight={800} color={isLow ? "#be123c" : "#059669"}>{item.availableQuantity}</Typography>
        </Box>
        <Box>
          <Typography fontSize={9.5} fontWeight={800} color="#94a3b8" textTransform="uppercase">Assigned</Typography>
          <Typography fontSize={13} fontWeight={800} color="#0f172a">{item.assignedQuantity || 0}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const InventoryItemsView = ({
  category,
  title,
  description,
  items,
  totalCount,
  isLoading,
  search,
  setSearch,
  conditionFilter,
  setConditionFilter,
  lowStockOnly,
  setLowStockOnly,
  roomOptions,
  modalOpen,
  editingId,
  form,
  formError,
  updateField,
  openCreateModal,
  openEditModal,
  closeModal,
  submitForm,
  isSaving,
  deleteTarget,
  setDeleteTarget,
  deleteError,
  confirmDelete,
  isDeleting,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            {title}
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25}>
            {description}
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<Add sx={{ fontSize: 18 }} />}
          onClick={openCreateModal}
          sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", borderRadius: 2, px: 2.5 }}
        >
          Add Item
        </Button>
      </Box>

      {/* Filter toolbar */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden", mb: 3 }}>
        <Box sx={{ px: 2.5, py: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid #e2e8f0", bgcolor: "#f8fafc", flexWrap: "wrap", gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FilterAlt sx={{ fontSize: 16, color: "#2563eb" }} />
            </Box>
            <Typography fontSize={13} fontWeight={800} color="#0f172a">
              {totalCount} item{totalCount === 1 ? "" : "s"} on record
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch size="small" checked={Boolean(lowStockOnly)} onChange={(e) => setLowStockOnly(e.target.checked)} />}
            label={<Typography fontSize={12.5} fontWeight={700} color="#64748b">Low Stock Only</Typography>}
            sx={{ m: 0 }}
          />
        </Box>

        <Box sx={{ p: 2.25, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
          <FieldCard icon={Search} label="Search" accent="#2563eb">
            <input
              placeholder="Name, SKU, serial number, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", fontSize: 13.5, fontWeight: 700, color: "#1e293b", fontFamily: "'Montserrat', sans-serif", background: "transparent" }}
            />
          </FieldCard>
          <FieldCard icon={Inventory2} label="Condition" accent="#7c3aed">
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              sx={fieldSelectSx}
              renderValue={(v) => v || <em style={{ color: "#94a3b8", fontStyle: "normal" }}>All Conditions</em>}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}><em>All Conditions</em></MenuItem>
              {Object.keys(CONDITION_MAP).map((c) => (
                <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>
              ))}
            </Select>
          </FieldCard>
        </Box>
      </Paper>

      {/* Items grid */}
      {isLoading ? (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)", xl: "repeat(4,1fr)" }} gap={2.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={210} sx={{ borderRadius: 2.5 }} />
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px dashed #cbd5e1", bgcolor: "#fff", py: 8, textAlign: "center" }}>
          <Inventory2 sx={{ fontSize: 44, color: "#cbd5e1" }} />
          <Typography fontSize={14} fontWeight={700} color="#64748b" mt={1.5}>
            No items found.
          </Typography>
          <Typography fontSize={12.5} color="#94a3b8" mt={0.5}>
            Click "Add Item" to register the first one.
          </Typography>
        </Paper>
      ) : (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)", xl: "repeat(4,1fr)" }} gap={2.5}>
          {items.map((item) => (
            <ItemCard key={item._id} item={item} onEdit={openEditModal} onDelete={setDeleteTarget} />
          ))}
        </Box>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 800, fontFamily: "'Aleo', serif" }}>
          {editingId ? "Edit Item" : "Add Item"}
          <IconButton size="small" onClick={closeModal}><Close sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3, bgcolor: "#f8fafc" }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Name" size="small" fullWidth required
              value={form.name} onChange={(e) => updateField("name", e.target.value)}
              sx={{ bgcolor: "#fff" }}
            />
            <TextField
              label="Description" size="small" fullWidth multiline rows={2}
              value={form.description} onChange={(e) => updateField("description", e.target.value)}
              sx={{ bgcolor: "#fff" }}
            />
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField label="SKU / Code" size="small" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} sx={{ bgcolor: "#fff" }} />
              <TextField label="Unit" size="small" value={form.unit} onChange={(e) => updateField("unit", e.target.value)} sx={{ bgcolor: "#fff" }} />
            </Box>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                label="Total Quantity" size="small" type="number"
                value={form.totalQuantity} onChange={(e) => updateField("totalQuantity", e.target.value)}
                sx={{ bgcolor: "#fff" }}
              />
              <TextField
                select label="Condition" size="small"
                value={form.condition} onChange={(e) => updateField("condition", e.target.value)}
                sx={{ bgcolor: "#fff" }}
              >
                {Object.keys(CONDITION_MAP).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Box>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                select label="Room (optional)" size="small"
                value={form.roomId} onChange={(e) => updateField("roomId", e.target.value)}
                sx={{ bgcolor: "#fff" }}
              >
                <MenuItem value=""><em>Not assigned to a room</em></MenuItem>
                {roomOptions.map((r) => (
                  <MenuItem key={r._id} value={r._id}>{r.breadcrumbLabel}</MenuItem>
                ))}
              </TextField>
              <TextField label="Location Note (optional)" size="small" value={form.location} onChange={(e) => updateField("location", e.target.value)} sx={{ bgcolor: "#fff" }} placeholder="e.g. near the window" />
            </Box>

            {category === "Stationery" && (
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} alignItems="center">
                <TextField
                  label="Low-Stock Threshold" size="small" type="number"
                  value={form.minThreshold} onChange={(e) => updateField("minThreshold", e.target.value)}
                  sx={{ bgcolor: "#fff" }}
                />
                <FormControlLabel
                  control={<Switch checked={Boolean(form.isConsumable)} onChange={(e) => updateField("isConsumable", e.target.checked)} />}
                  label={<Typography fontSize={13} fontWeight={600}>Consumable (issued items aren't returned)</Typography>}
                />
              </Box>
            )}

            {["Furniture", "Electronics", "Equipment"].includes(category) && (
              <>
                <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing={0.5} mt={1}>
                  Asset Details
                </Typography>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <TextField label="Serial Number" size="small" value={form.serialNumber} onChange={(e) => updateField("serialNumber", e.target.value)} sx={{ bgcolor: "#fff" }} />
                  <TextField label="Vendor" size="small" value={form.vendor} onChange={(e) => updateField("vendor", e.target.value)} sx={{ bgcolor: "#fff" }} />
                </Box>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <TextField label="Purchase Date" size="small" type="date" InputLabelProps={{ shrink: true }} value={form.purchaseDate} onChange={(e) => updateField("purchaseDate", e.target.value)} sx={{ bgcolor: "#fff" }} />
                  <TextField label="Purchase Cost" size="small" type="number" value={form.purchaseCost} onChange={(e) => updateField("purchaseCost", e.target.value)} sx={{ bgcolor: "#fff" }} />
                </Box>
                <TextField label="Warranty Expiry" size="small" type="date" InputLabelProps={{ shrink: true }} value={form.warrantyExpiry} onChange={(e) => updateField("warrantyExpiry", e.target.value)} sx={{ bgcolor: "#fff" }} />
              </>
            )}

            <TextField label="Notes" size="small" fullWidth multiline rows={2} value={form.notes} onChange={(e) => updateField("notes", e.target.value)} sx={{ bgcolor: "#fff" }} />

            {formError && <Typography fontSize={12.5} fontWeight={700} color="#dc2626">{formError}</Typography>}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5, bgcolor: "#fff" }}>
          <Button onClick={closeModal} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained" disableElevation onClick={submitForm} disabled={isSaving}
            sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, px: 4, textTransform: "none" }}
          >
            {isSaving ? "Saving..." : editingId ? "Save Changes" : "Add Item"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove "{deleteTarget?.name}"?</DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5} color="#64748b">
            This removes the item from inventory. It can't be undone. Items currently assigned to staff can't be removed until returned.
          </Typography>
          {deleteError && <Typography fontSize={12.5} fontWeight={700} color="#dc2626" mt={1.5}>{deleteError}</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained" disableElevation color="error" onClick={confirmDelete} disabled={isDeleting}
            sx={{ fontWeight: 700, borderRadius: 2, px: 3, textTransform: "none" }}
          >
            {isDeleting ? "Removing..." : "Remove Item"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryItemsView;
