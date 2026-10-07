import React from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Button,
  Tooltip,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import { RestoreFromTrash, Download, DeleteForever } from "@mui/icons-material";
import PermanentDeleteModal from "../../common/PermanentDeleteModal";

// >7 days left reads as safely-far-off (default grey), <=7 as urgent (amber)
// — same "getting close" signal used elsewhere in the admission pipeline
// (e.g. the fee-overdue cancellation countdown).
const RetentionChip = ({ daysRemaining }) => (
  <Chip
    size="small"
    label={daysRemaining === 0 ? "Purging today" : `${daysRemaining}d left`}
    color={daysRemaining <= 7 ? "warning" : "default"}
    variant={daysRemaining <= 7 ? "filled" : "outlined"}
  />
);

const AdmissionTrashView = ({
  tab,
  setTab,
  trashRecords,
  isLoading,
  handleRestore,
  isRestoring,
  handleRedownload,
  permanentTarget,
  isPermanentModalOpen,
  openPermanentDeleteModal,
  closePermanentDeleteModal,
  permanentRemark,
  setPermanentRemark,
  confirmPermanentDelete,
  isPermanentlyDeleting,
}) => {
  const isSoftTab = tab === "trashed";

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h6" fontWeight={800}>Trash</Typography>
        <Typography variant="body2" color="text.secondary">
          Deleted student records stay visible here for 60 days. Soft-deleted records can
          still be restored or downloaded; permanently-deleted records are a read-only
          record of what was removed and can no longer be brought back.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="trashed" label="Soft Deleted (Recoverable)" />
        <Tab value="permanently_deleted" label="Permanently Deleted" />
      </Tabs>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{isSoftTab ? "Deleted On" : "Permanently Deleted On"}</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Remark</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Retention</TableCell>
              {isSoftTab && <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
            ) : trashRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  {isSoftTab ? "Trash is empty." : "No permanently deleted records in the last 60 days."}
                </TableCell>
              </TableRow>
            ) : trashRecords.map((r) => (
              <TableRow key={r._id} hover>
                <TableCell>
                  <Typography fontWeight={700} fontSize={14}>
                    {r.snapshot?.admission?.fullName || r.snapshot?.personalInfo?.fullName || "Unknown"}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">{r.snapshot?.admission?.cnic}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                  {r.snapshot?.admission?.phone || r.snapshot?.personalInfo?.phone || "N/A"}
                </TableCell>
                <TableCell>
                  {new Date(isSoftTab ? r.trashedAt : r.permanentlyDeletedAt).toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Typography
                    fontSize={13}
                    color="text.secondary"
                    noWrap
                    title={isSoftTab ? r.trashRemark : r.permanentDeleteRemark}
                  >
                    {(isSoftTab ? r.trashRemark : r.permanentDeleteRemark) || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <RetentionChip daysRemaining={r.daysRemaining} />
                </TableCell>
                {isSoftTab && (
                  <TableCell align="right">
                    <Tooltip title="Re-download Record">
                      <IconButton size="small" onClick={() => handleRedownload(r)}>
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      startIcon={<RestoreFromTrash fontSize="small" />}
                      onClick={() => handleRestore(r)}
                      disabled={isRestoring}
                      sx={{ mx: 1 }}
                    >
                      Restore
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteForever fontSize="small" />}
                      onClick={() => openPermanentDeleteModal(r)}
                    >
                      Delete Permanently
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <PermanentDeleteModal
        open={isPermanentModalOpen}
        record={permanentTarget}
        remark={permanentRemark}
        setRemark={setPermanentRemark}
        onCancel={closePermanentDeleteModal}
        onConfirm={confirmPermanentDelete}
        isDeleting={isPermanentlyDeleting}
      />
    </Box>
  );
};

export default AdmissionTrashView;
