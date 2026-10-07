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

export const ProgramFormModal = ({
  open,
  context,
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

  const isCollege = context === "college";
  const isEditMode = !!editingProg;

  const levelOptions = isEditMode
    ? [
        { value: "HSSC", label: "Intermediate (HSSC) - College" },
        { value: "UG", label: "Undergraduate (BS) - University" },
        { value: "MS", label: "Graduate (MS/MPhil) - University" },
        { value: "PHD", label: "Doctorate (PhD) - University" },
        { value: "DIPLOMA", label: "Diploma - University" },
      ]
    : isCollege
      ? [{ value: "HSSC", label: "Intermediate (HSSC) - College" }]
      : [
          { value: "UG", label: "Undergraduate (BS) - University" },
          { value: "MS", label: "Graduate (MS/MPhil) - University" },
          { value: "PHD", label: "Doctorate (PhD) - University" },
          { value: "DIPLOMA", label: "Diploma - University" },
        ];

  const unit = isCollege ? "Part" : "Semester";

  // Live preview of what saving will do to the program's semesters.
  const currentCount = editingProg
    ? Number(
        editingProg.durationStages ||
          editingProg.durationSemesters ||
          editingProg.duration,
      ) || 0
    : 0;
  const newCount = Number(form.watch("durationStages")) || 0;
  const label = (n) => `${unit} ${n}`;
  let durationNote = "";
  if (isEditMode && newCount >= 1 && currentCount) {
    if (newCount > currentCount) {
      durationNote = `Saving adds ${
        newCount - currentCount === 1
          ? label(newCount)
          : `${label(currentCount + 1)} to ${label(newCount)}`
      }.`;
    } else if (newCount < currentCount) {
      durationNote = `Saving removes ${
        currentCount - newCount === 1
          ? label(currentCount)
          : `${label(newCount + 1)} to ${label(currentCount)}`
      } — blocked if students, courses or fees still use ${
        currentCount - newCount === 1 ? "it" : "them"
      }.`;
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle
        className={`border-b border-gray-100 pb-3 text-white ${
          isCollege ? "bg-green-600" : "bg-blue-600"
        }`}
      >
        <Typography variant="h6" component="div" className="font-bold">
          {isEditMode
            ? "Update Program"
            : `Add ${isCollege ? "College" : "University"} Program`}
        </Typography>
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent className="pt-6 space-y-4" sx={{ pb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <InputField
                name="name"
                label="Program Name"
                control={control}
                errors={errors}
                placeholder="e.g. FSC Pre-Medical"
              />
            </Grid>
            <Grid item xs={12}>
              <InputField
                name="code"
                label="Program Code"
                control={control}
                errors={errors}
                placeholder="e.g. FSC-PM"
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Class"
                    fullWidth
                    error={!!errors.departmentId}
                    helperText={errors.departmentId?.message}
                    {...field}
                  >
                    {departments?.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Academic Level"
                    fullWidth
                    error={!!errors.level}
                    helperText={errors.level?.message}
                    {...field}
                  >
                    {levelOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="durationStages"
                control={control}
                render={({ field }) => (
                  <TextField
                    type="number"
                    label={isCollege ? "Total Parts" : "Total Semesters"}
                    fullWidth
                    inputProps={{ min: 1, max: 14, step: 1 }}
                    error={!!errors.durationStages}
                    helperText={
                      errors.durationStages?.message ||
                      durationNote ||
                      "Any number from 1 to 14"
                    }
                    {...field}
                  />
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
            color={isCollege && !isEditMode ? "success" : "primary"}
            className="shadow-none"
          >
            {isLoading
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Create Program"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
