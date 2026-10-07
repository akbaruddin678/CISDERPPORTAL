import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import { EditNote } from "@mui/icons-material";

const EditRemarkModal = ({
  open,
  name,
  remarkDraft,
  setRemarkDraft,
  onCancel,
  onSave,
  isSaving,
}) => (
  <Dialog open={open} onClose={() => !isSaving && onCancel()} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <EditNote color="primary" /> Remark — {name}
    </DialogTitle>
    <DialogContent sx={{ minWidth: 380 }}>
      <TextField
        autoFocus
        fullWidth
        multiline
        rows={4}
        label="Remark"
        placeholder="Add a remark about this record..."
        value={remarkDraft}
        onChange={(e) => setRemarkDraft(e.target.value)}
        size="small"
        sx={{ mt: 1 }}
      />
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onCancel} disabled={isSaving} color="inherit">
        Cancel
      </Button>
      <Button
        onClick={onSave}
        variant="contained"
        disabled={isSaving}
        disableElevation
        startIcon={isSaving && <CircularProgress size={16} color="inherit" />}
        sx={{ borderRadius: 2 }}
      >
        Save Remark
      </Button>
    </DialogActions>
  </Dialog>
);

export default EditRemarkModal;
