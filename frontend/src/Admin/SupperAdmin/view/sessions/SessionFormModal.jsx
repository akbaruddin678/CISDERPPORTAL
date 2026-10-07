import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import InputField from "../../../../shared/InputField/UI/InputField";

const statusOptions = [
  { value: "active", label: "Active (Current Session)" },
  { value: "inactive", label: "Inactive (Past/Future Session)" },
];

export const SessionFormModal = ({
  open,
  onClose,
  isEditMode,
  control,
  errors,
  onSubmit,
  isLoading,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="border-b border-gray-100 pb-3 bg-blue-600 text-white">
        <Typography variant="h6" component="div" className="font-bold">
          {isEditMode ? "Update Academic Session" : "Create Academic Session"}
        </Typography>
        <Typography variant="body2" component="div" className="opacity-80">
          {isEditMode
            ? "Modify timeline and status below."
            : "Set up a new term or semester period (e.g., Fall 2025)."}
        </Typography>
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent className="pt-6 space-y-4">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <InputField
                name="name"
                label="Session Name"
                control={control}
                errors={errors}
                placeholder="e.g. Fall 2025"
                helperText="The session Code (e.g. FALL2025) will be generated automatically."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <InputField
                name="startDate"
                label="Start Date"
                type="date"
                control={control}
                errors={errors}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <InputField
                name="endDate"
                label="End Date"
                type="date"
                control={control}
                errors={errors}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Initial Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    {statusOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions className="p-4 border-t border-gray-100 bg-gray-50">
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 shadow-none"
          >
            {isLoading
              ? "Processing..."
              : isEditMode
                ? "Save Changes"
                : "Create Session"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
