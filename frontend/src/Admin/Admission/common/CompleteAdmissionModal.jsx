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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const CompleteAdmissionModal = ({
  open,
  student,
  remark,
  setRemark,
  confirmed,
  setConfirmed,
  onCancel,
  onConfirm,
  isCompleting,
}) => (
  <Dialog open={open} onClose={() => !isCompleting && onCancel()} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "success.main" }}>
      <CheckCircle /> Mark Admission Complete
    </DialogTitle>
    <DialogContent sx={{ minWidth: 380 }}>
      <DialogContentText sx={{ mb: 1.5 }}>
        Confirming this for <b>{student?.personalInfo?.fullName || student?.studentId}</b> archives their full
        admission record and permanently clears the (now redundant) Admission application — the student profile
        itself is never touched. This student will then appear in the "Completed Admissions" list on the
        dashboard.
      </DialogContentText>

      <FormControlLabel
        sx={{ mb: 1.5 }}
        control={
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            size="small"
          />
        }
        label="Confirmed — this student has completed admission."
      />

      <TextField
        autoFocus
        fullWidth
        multiline
        rows={3}
        required
        label="Remark (required)"
        placeholder="Any notes about this completion..."
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        size="small"
      />
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onCancel} disabled={isCompleting} color="inherit">
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="success"
        disabled={isCompleting || !remark.trim() || !confirmed}
        disableElevation
        startIcon={isCompleting && <CircularProgress size={16} color="inherit" />}
        sx={{ borderRadius: 2 }}
      >
        Mark Complete
      </Button>
    </DialogActions>
  </Dialog>
);

export default CompleteAdmissionModal;
