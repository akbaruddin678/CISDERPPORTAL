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
} from "@mui/material";
import { WarningAmber } from "@mui/icons-material";

const PermanentDeleteModal = ({
  open,
  remark,
  setRemark,
  onCancel,
  onConfirm,
  isDeleting,
}) => (
  <Dialog open={open} onClose={() => !isDeleting && onCancel()} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
      <WarningAmber /> Permanently Delete Record
    </DialogTitle>
    <DialogContent sx={{ minWidth: 380 }}>
      <DialogContentText sx={{ mb: 2 }}>
        This <b>cannot be undone</b>. The student's admission, profile, family, education,
        document and challan records will be permanently removed. After this, the same
        applicant will be able to register a brand-new admission application.
      </DialogContentText>
      <TextField
        autoFocus
        fullWidth
        multiline
        rows={3}
        required
        label="Remark (required)"
        placeholder="Reason for permanent deletion..."
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
        Delete Permanently
      </Button>
    </DialogActions>
  </Dialog>
);

export default PermanentDeleteModal;
