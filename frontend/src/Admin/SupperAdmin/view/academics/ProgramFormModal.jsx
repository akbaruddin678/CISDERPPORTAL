import React from "react";
import {
  Alert,
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

// Create / edit a program inside a class. Sections are added afterwards from
// the program's own "Add Section" button.
export const ProgramFormModal = ({
  open,
  onClose,
  form,
  departments,
  onSubmit,
  isLoading,
  editingProg,
  error,
}) => {
  const {
    control,
    formState: { errors },
  } = form;
  const isEditMode = !!editingProg;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="bg-blue-600 text-white">
        <Typography variant="h6" component="div" className="font-bold">
          {isEditMode ? "Edit Program" : "Add Program"}
        </Typography>
        <Typography variant="body2" className="opacity-80">
          A program belongs to a class and holds its sections.
        </Typography>
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent className="pt-6">
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2.5} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Class"
                    error={!!errors.departmentId}
                    helperText={errors.departmentId?.message}
                  >
                    {departments.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <InputField
                name="name"
                label="Program name"
                control={control}
                errors={errors}
                placeholder="e.g. Pre-Medical"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <InputField
                name="code"
                label="Program code"
                control={control}
                errors={errors}
                placeholder="e.g. 11-PREMED"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="p-4 border-t border-gray-100 bg-gray-50">
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isEditMode ? "Save changes" : "Add Program"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
