import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { MarkEmailReadOutlined } from "@mui/icons-material";

const ResendAdmissionEmailModal = ({
  open,
  student,
  onCancel,
  onConfirm,
  isResendingEmail,
}) => (
  <Dialog
    open={open}
    onClose={() => !isResendingEmail && onCancel()}
    PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
  >
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
      <MarkEmailReadOutlined /> Resend Admission Email
    </DialogTitle>
    <DialogContent sx={{ minWidth: 380 }}>
      <DialogContentText>
        The admission email has already been sent to{" "}
        <b>{student?.personalInfo?.fullName || student?.studentId}</b>. Do
        you want to send the admission email again?
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onCancel} disabled={isResendingEmail} color="inherit">
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        disabled={isResendingEmail}
        disableElevation
        startIcon={isResendingEmail && <CircularProgress size={16} color="inherit" />}
        sx={{ borderRadius: 2 }}
      >
        Send Again
      </Button>
    </DialogActions>
  </Dialog>
);

export default ResendAdmissionEmailModal;
