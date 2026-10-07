import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import {
  Add,
  Edit,
  DeleteOutline,
  Business,
  Layers,
  MeetingRoom,
  ChevronRight,
  Close,
  WarningAmber,
  Groups,
} from "@mui/icons-material";

const CONDITION_MAP = {
  New: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  Good: { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  Fair: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  Poor: { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  "Under Repair": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  Retired: { color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
};

const EntityCard = ({ icon: Icon, iconBg, iconColor, title, subtitle, badges, onOpen, onEdit, onDelete }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 2.5,
      border: "1px solid #e2e8f0",
      bgcolor: "#fff",
      overflow: "hidden",
      transition: "all 0.18s",
      cursor: onOpen ? "pointer" : "default",
      "&:hover": onOpen ? { boxShadow: "0 8px 24px -8px rgba(15,23,42,0.15)", borderColor: "#c7d2fe" } : {},
    }}
  >
    <Box sx={{ p: 2.25 }} onClick={onOpen}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        {onOpen && <ChevronRight sx={{ color: "#cbd5e1", fontSize: 20 }} />}
      </Box>
      <Typography fontSize={14.5} fontWeight={800} color="#0f172a" mt={1.5}>
        {title}
      </Typography>
      {subtitle && (
        <Typography fontSize={12} color="#94a3b8" fontWeight={600} mt={0.25}>
          {subtitle}
        </Typography>
      )}
      {badges && <Box display="flex" flexWrap="wrap" gap={0.75} mt={1.25}>{badges}</Box>}
    </Box>
    {(onEdit || onDelete) && (
      <Box sx={{ px: 2.25, py: 1.25, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
        {onEdit && (
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }} sx={{ color: "#64748b" }}>
            <Edit sx={{ fontSize: 15 }} />
          </IconButton>
        )}
        {onDelete && (
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }} sx={{ color: "#dc2626" }}>
            <DeleteOutline sx={{ fontSize: 15 }} />
          </IconButton>
        )}
      </Box>
    )}
  </Paper>
);

const InventoryRoomsView = ({
  isLoading,
  tree,
  orphanRooms,
  departments,
  selectedBuildingId,
  setSelectedBuildingId,
  selectedBuilding,
  selectedFloorId,
  setSelectedFloorId,
  selectedFloor,
  modal,
  form,
  formError,
  updateField,
  openCreateBuilding,
  openEditBuilding,
  openCreateFloor,
  openEditFloor,
  openCreateRoom,
  openEditRoom,
  closeModal,
  submitModal,
  isSaving,
  deleteTarget,
  setDeleteTarget,
  deleteError,
  confirmDelete,
  isDeleting,
}) => {
  const level = selectedFloor ? "room" : selectedBuilding ? "floor" : "building";

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={2}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Rooms & Spaces
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25}>
          Building → Floor → Room — the structure every other room reference in Inventory connects to.
        </Typography>
      </Box>

      {/* Breadcrumb */}
      <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16 }} />} sx={{ mb: 2.5 }}>
        <MuiLink
          component="button"
          underline={selectedBuildingId ? "hover" : "none"}
          onClick={() => { setSelectedBuildingId(null); setSelectedFloorId(null); }}
          sx={{ fontSize: 13, fontWeight: 800, color: selectedBuildingId ? "#2563eb" : "#0f172a" }}
        >
          All Buildings
        </MuiLink>
        {selectedBuilding && (
          <MuiLink
            component="button"
            underline={selectedFloorId ? "hover" : "none"}
            onClick={() => setSelectedFloorId(null)}
            sx={{ fontSize: 13, fontWeight: 800, color: selectedFloorId ? "#2563eb" : "#0f172a" }}
          >
            {selectedBuilding.name}
          </MuiLink>
        )}
        {selectedFloor && (
          <Typography fontSize={13} fontWeight={800} color="#0f172a">
            {selectedFloor.name}
          </Typography>
        )}
      </Breadcrumbs>

      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1.5}>
        <Typography fontSize={13} fontWeight={700} color="#64748b">
          {level === "building" && `${tree.length} building${tree.length === 1 ? "" : "s"}`}
          {level === "floor" && `${selectedBuilding?.floors?.length || 0} floor${(selectedBuilding?.floors?.length || 0) === 1 ? "" : "s"} in ${selectedBuilding?.name}`}
          {level === "room" && `${selectedFloor?.rooms?.length || 0} room${(selectedFloor?.rooms?.length || 0) === 1 ? "" : "s"} on ${selectedFloor?.name}`}
        </Typography>
        <Button
          variant="contained"
          disableElevation
          startIcon={<Add sx={{ fontSize: 18 }} />}
          onClick={level === "building" ? openCreateBuilding : level === "floor" ? openCreateFloor : openCreateRoom}
          sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", borderRadius: 2, px: 2.5 }}
        >
          {level === "building" ? "Add Building" : level === "floor" ? "Add Floor" : "Add Room"}
        </Button>
      </Box>

      {isLoading ? (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)" }} gap={2.5}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: 2.5 }} />)}
        </Box>
      ) : (
        <>
          {/* BUILDING LEVEL */}
          {level === "building" && (
            tree.length === 0 ? (
              <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px dashed #cbd5e1", bgcolor: "#fff", py: 8, textAlign: "center" }}>
                <Business sx={{ fontSize: 44, color: "#cbd5e1" }} />
                <Typography fontSize={14} fontWeight={700} color="#64748b" mt={1.5}>No buildings added yet.</Typography>
                <Typography fontSize={12.5} color="#94a3b8" mt={0.5}>Click "Add Building" to start structuring your campus.</Typography>
              </Paper>
            ) : (
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)" }} gap={2.5}>
                {tree.map((b) => (
                  <EntityCard
                    key={b._id}
                    icon={Business}
                    iconBg="#eff6ff"
                    iconColor="#2563eb"
                    title={b.name}
                    subtitle={b.location || b.description}
                    badges={<Chip label={`${b.floors?.length || 0} floors`} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 22, bgcolor: "#f1f5f9" }} />}
                    onOpen={() => setSelectedBuildingId(b._id)}
                    onEdit={() => openEditBuilding(b)}
                    onDelete={() => setDeleteTarget(b)}
                  />
                ))}
              </Box>
            )
          )}

          {/* FLOOR LEVEL */}
          {level === "floor" && (
            (selectedBuilding.floors || []).length === 0 ? (
              <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px dashed #cbd5e1", bgcolor: "#fff", py: 8, textAlign: "center" }}>
                <Layers sx={{ fontSize: 44, color: "#cbd5e1" }} />
                <Typography fontSize={14} fontWeight={700} color="#64748b" mt={1.5}>No floors in {selectedBuilding.name} yet.</Typography>
                <Typography fontSize={12.5} color="#94a3b8" mt={0.5}>Click "Add Floor" to begin.</Typography>
              </Paper>
            ) : (
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)" }} gap={2.5}>
                {selectedBuilding.floors.map((f) => (
                  <EntityCard
                    key={f._id}
                    icon={Layers}
                    iconBg="#f5f3ff"
                    iconColor="#7c3aed"
                    title={f.name}
                    subtitle={f.description}
                    badges={<Chip label={`${f.rooms?.length || 0} rooms`} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 22, bgcolor: "#f1f5f9" }} />}
                    onOpen={() => setSelectedFloorId(f._id)}
                    onEdit={() => openEditFloor(f)}
                    onDelete={() => setDeleteTarget(f)}
                  />
                ))}
              </Box>
            )
          )}

          {/* ROOM LEVEL */}
          {level === "room" && (
            (selectedFloor.rooms || []).length === 0 ? (
              <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px dashed #cbd5e1", bgcolor: "#fff", py: 8, textAlign: "center" }}>
                <MeetingRoom sx={{ fontSize: 44, color: "#cbd5e1" }} />
                <Typography fontSize={14} fontWeight={700} color="#64748b" mt={1.5}>No rooms on {selectedFloor.name} yet.</Typography>
                <Typography fontSize={12.5} color="#94a3b8" mt={0.5}>Click "Add Room" to begin.</Typography>
              </Paper>
            ) : (
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)" }} gap={2.5}>
                {selectedFloor.rooms.map((r) => {
                  const cond = CONDITION_MAP[r.condition] || CONDITION_MAP.Good;
                  return (
                    <EntityCard
                      key={r._id}
                      icon={MeetingRoom}
                      iconBg="#ecfdf5"
                      iconColor="#059669"
                      title={r.name}
                      subtitle={r.roomDetails?.roomType}
                      badges={
                        <>
                          {r.roomDetails?.capacity ? (
                            <Chip icon={<Groups sx={{ fontSize: 13 }} />} label={`Capacity ${r.roomDetails.capacity}`} size="small" sx={{ fontSize: 11, fontWeight: 700, height: 22, bgcolor: "#f1f5f9" }} />
                          ) : null}
                          <Chip label={r.condition} size="small" sx={{ fontSize: 11, fontWeight: 800, height: 22, bgcolor: cond.bg, color: cond.color, border: `1px solid ${cond.border}` }} />
                        </>
                      }
                      onEdit={() => openEditRoom(r)}
                      onDelete={() => setDeleteTarget(r)}
                    />
                  );
                })}
              </Box>
            )
          )}
        </>
      )}

      {!isLoading && level === "building" && orphanRooms?.length > 0 && (
        <Paper elevation={0} sx={{ mt: 3, borderRadius: 2.5, border: "1px solid #fde68a", bgcolor: "#fffbeb", p: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <WarningAmber sx={{ fontSize: 18, color: "#b45309" }} />
            <Typography fontSize={13} fontWeight={800} color="#92400e">
              {orphanRooms.length} room(s) lost their floor
            </Typography>
          </Box>
          <Typography fontSize={12.5} color="#92400e">
            These rooms' floor was deleted. Edit each one to reassign it to a valid floor: {orphanRooms.map((r) => r.name).join(", ")}
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={Boolean(modal)} onClose={closeModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 800, fontFamily: "'Aleo', serif" }}>
          {modal?.mode === "edit" ? "Edit" : "Add"} {modal?.level === "building" ? "Building" : modal?.level === "floor" ? "Floor" : "Room"}
          <IconButton size="small" onClick={closeModal}><Close sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3, bgcolor: "#f8fafc" }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {modal?.level === "floor" && (
              <Typography fontSize={12.5} color="#64748b">
                Adding to <strong>{selectedBuilding?.name}</strong>
              </Typography>
            )}
            {modal?.level === "room" && (
              <Typography fontSize={12.5} color="#64748b">
                Adding to <strong>{selectedBuilding?.name} → {selectedFloor?.name}</strong>
              </Typography>
            )}

            <TextField label="Name" size="small" fullWidth required value={form.name} onChange={(e) => updateField("name", e.target.value)} sx={{ bgcolor: "#fff" }} />
            <TextField label="Description" size="small" fullWidth multiline rows={2} value={form.description} onChange={(e) => updateField("description", e.target.value)} sx={{ bgcolor: "#fff" }} />

            {modal?.level === "building" && (
              <TextField label="Location / Address" size="small" fullWidth value={form.location} onChange={(e) => updateField("location", e.target.value)} sx={{ bgcolor: "#fff" }} />
            )}

            {modal?.level === "room" && (
              <>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <TextField label="Capacity" size="small" type="number" value={form.capacity} onChange={(e) => updateField("capacity", e.target.value)} sx={{ bgcolor: "#fff" }} />
                  <TextField select label="Room Type" size="small" value={form.roomType} onChange={(e) => updateField("roomType", e.target.value)} sx={{ bgcolor: "#fff" }}>
                    {["Classroom", "Lab", "Office", "Hall", "Store", "Other"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Box>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <TextField select label="Condition" size="small" value={form.condition} onChange={(e) => updateField("condition", e.target.value)} sx={{ bgcolor: "#fff" }}>
                    {Object.keys(CONDITION_MAP).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <TextField select label="Department (optional)" size="small" value={form.departmentId} onChange={(e) => updateField("departmentId", e.target.value)} sx={{ bgcolor: "#fff" }}>
                    <MenuItem value=""><em>None</em></MenuItem>
                    {departments.map((d) => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
                  </TextField>
                </Box>
                <TextField label="Notes / Wing (optional)" size="small" fullWidth value={form.location} onChange={(e) => updateField("location", e.target.value)} sx={{ bgcolor: "#fff" }} />
              </>
            )}

            {formError && <Typography fontSize={12.5} fontWeight={700} color="#dc2626">{formError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#fff" }}>
          <Button onClick={closeModal} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained" disableElevation onClick={submitModal} disabled={isSaving}
            sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, px: 4, textTransform: "none" }}
          >
            {isSaving ? "Saving..." : modal?.mode === "edit" ? "Save Changes" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove "{deleteTarget?.name}"?</DialogTitle>
        <DialogContent>
          <Typography fontSize={13.5} color="#64748b">
            This can't be undone. {deleteTarget?.category === "Building" && "All floors must be removed first."}
            {deleteTarget?.category === "Floor" && "All rooms on this floor must be removed first."}
            {deleteTarget?.category === "Room" && "Items currently located here must be relocated first."}
          </Typography>
          {deleteError && <Typography fontSize={12.5} fontWeight={700} color="#dc2626" mt={1.5}>{deleteError}</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained" disableElevation color="error" onClick={confirmDelete} disabled={isDeleting}
            sx={{ fontWeight: 700, borderRadius: 2, px: 3, textTransform: "none" }}
          >
            {isDeleting ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryRoomsView;
