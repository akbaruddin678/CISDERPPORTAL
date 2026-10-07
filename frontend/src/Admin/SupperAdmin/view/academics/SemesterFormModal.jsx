import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Box,
} from "@mui/material";
import InputField from "../../../../shared/InputField/UI/InputField";

export const SemesterFormModal = ({
  open,
  onClose,
  form,
  onSubmit,
  onDelete,
  isLoading,
  usage, // { canDelete, blockers[], reason } from the server, or null while loading
  isUsageLoading,
  error,
  semesterName,
}) => {
  const {
    control,
    formState: { errors },
  } = form;

  // Delete needs an explicit second click, shown inside this dialog — no
  // browser pop-ups.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  const checking = isUsageLoading || !usage;
  const canDelete = !!usage?.canDelete;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="border-b border-gray-100 pb-3 bg-purple-600 text-white">
        <Typography variant="h6" component="div" className="font-bold">
          Edit Academic Stage
        </Typography>
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent className="pt-6">
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <InputField
            name="name"
            label="Stage Name"
            control={control}
            errors={errors}
            placeholder="e.g. Section 1, Part 1, First Year"
          />

          <Box sx={{ mt: 3 }}>
            {checking ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Checking students and activity in this section…
                </Typography>
              </Box>
            ) : canDelete ? (
              <Alert severity="success">
                No students or other activity are linked to this section, so
                it can be deleted.
              </Alert>
            ) : (
              <Alert severity="warning">
                <AlertTitle>Can't be deleted</AlertTitle>
                {usage.blockers?.length > 0 ? (
                  <>
                    Still used by:
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                      {usage.blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  usage.reason
                )}
              </Alert>
            )}
          </Box>

          {confirming && canDelete && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setConfirming(false)}
                    disabled={isLoading}
                  >
                    Keep
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    disabled={isLoading}
                    onClick={onDelete}
                  >
                    {isLoading ? "Deleting…" : "Yes, delete"}
                  </Button>
                </Box>
              }
            >
              Permanently delete {semesterName}? This can't be undone.
            </Alert>
          )}
        </DialogContent>
        <DialogActions className="p-4 border-t border-gray-100 bg-gray-50">
          <Button
            onClick={() => setConfirming(true)}
            color="error"
            disabled={isLoading || checking || !canDelete || confirming}
            sx={{ mr: "auto" }}
          >
            Delete Section
          </Button>
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            className="bg-purple-600 shadow-none"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
