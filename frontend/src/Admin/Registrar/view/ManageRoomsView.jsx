import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Switch,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Add } from "@mui/icons-material";

const ManageRoomsView = ({
  rooms = [],
  isFetching,
  isDialogOpen,
  editingRoom,
  openCreateDialog,
  openEditDialog,
  closeDialog,
  form,
  setForm,
  handleSave,
  isSaving,
  handleToggleActive,
}) => (
  <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "#f8fafc" }}>
    <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="h4" fontWeight="800" color="#1e293b">
          Manage Rooms
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          The physical rooms available for timetable scheduling.
        </Typography>
      </Box>
      <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
        Add Room
      </Button>
    </Box>

    <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      {isFetching ? (
        <Box py={10} textAlign="center">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Capacity</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Active</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room._id} hover>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell align="center">
                    <Switch checked={room.isActive} onChange={() => handleToggleActive(room)} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEditDialog(room)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>

    <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight="bold">{editingRoom ? "Edit Room" : "Add Room"}</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          label="Room Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Capacity"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);

export default ManageRoomsView;
