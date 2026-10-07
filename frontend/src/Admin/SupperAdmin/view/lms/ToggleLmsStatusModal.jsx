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
import { Block, CheckCircle } from "@mui/icons-material";

const ToggleLmsStatusModal = ({
  open,
  target,
  onCancel,
  onConfirm,
  isLoading,
}) => {
  const isBlocking = target?.nextStatus === "BLOCKED";

  return (
    <Dialog
      open={open}
      onClose={() => !isLoading && onCancel()}
      PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: isBlocking ? "error.main" : "success.main",
        }}
      >
        {isBlocking ? <Block /> : <CheckCircle />}
        {isBlocking ? "Block LMS Account" : "Unblock LMS Account"}
      </DialogTitle>
      <DialogContent sx={{ minWidth: 380 }}>
        <DialogContentText>
          {isBlocking ? (
            <>
              This will immediately prevent <b>{target?.account?.name}</b>{" "}
              from logging in to the Student LMS. They will not be able to
              sign in again until this account is unblocked.
            </>
          ) : (
            <>
              This will restore LMS login access for{" "}
              <b>{target?.account?.name}</b>.
            </>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={isLoading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={isBlocking ? "error" : "success"}
          disabled={isLoading}
          disableElevation
          startIcon={isLoading && <CircularProgress size={16} color="inherit" />}
          sx={{ borderRadius: 2 }}
        >
          {isBlocking ? "Block Account" : "Unblock Account"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ToggleLmsStatusModal;
