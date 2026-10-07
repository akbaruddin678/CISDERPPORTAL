import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
} from "@mui/material";
import { Warning } from "@mui/icons-material";

const DeleteAdmissionModal = ({
  open,
  admission,
  remark,
  setRemark,
  // Only passed (true) on the Accepted / Challan Generated tabs — every
  // other tab has exactly one valid target (Incomplete/Complete have no
  // student yet; Fee Overdue is never allowed to touch the student
  // profile), so no choice needs to be shown there at all.
  allowScopeChoice = false,
  scope = "admission_only",
  setScope,
  onCancel,
  onConfirm,
  isDeleting,
}) => (
  <Dialog open={open} onClose={() => !isDeleting && onCancel()} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
      <Warning /> Delete Student Record
    </DialogTitle>
    <DialogContent sx={{ minWidth: 380 }}>
      <DialogContentText sx={{ mb: allowScopeChoice ? 1.5 : 2 }}>
        {allowScopeChoice ? (
          <>Choose what to delete for <b>{admission?.name}</b>. The full record will be downloaded automatically.</>
        ) : (
          <>Deleting <b>{admission?.name}</b> moves the Admission application record to the Trash. It will be
          hidden everywhere and can be restored (or permanently deleted) later. The student profile itself is
          never touched by this action. The full record will be downloaded automatically.</>
        )}
      </DialogContentText>

      {allowScopeChoice && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <RadioGroup value={scope} onChange={(e) => setScope(e.target.value)}>
            <FormControlLabel
              value="admission_only"
              control={<Radio size="small" />}
              label={
                <Box>
                  <Typography fontSize={13.5} fontWeight={700}>Admission record only</Typography>
                  <Typography fontSize={12} color="text.secondary">Keeps the student profile — only the application record is removed.</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="both"
              control={<Radio size="small" />}
              label={
                <Box>
                  <Typography fontSize={13.5} fontWeight={700}>Both (Admission + Student)</Typography>
                  <Typography fontSize={12} color="text.secondary">Removes the student profile and any fee challan too. Only available before a fee has been paid or gone overdue.</Typography>
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      )}

      <TextField
        autoFocus
        fullWidth
        multiline
        rows={3}
        required
        label="Remark (required)"
        placeholder="Reason for deleting this record..."
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        size="small"
      />
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onCancel} disabled={isDeleting} color="inherit">
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="error"
        disabled={isDeleting || !remark.trim()}
        disableElevation
        startIcon={isDeleting && <CircularProgress size={16} color="inherit" />}
        sx={{ borderRadius: 2 }}
      >
        Confirm Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteAdmissionModal;
