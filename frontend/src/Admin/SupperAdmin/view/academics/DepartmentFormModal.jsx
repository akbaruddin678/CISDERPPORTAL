import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import InputField from "../../../../shared/InputField/UI/InputField";

export const DepartmentFormModal = ({
  open,
  onClose,
  form,
  onSubmit,
  isLoading,
  editingDept,
}) => {
  const {
    control,
    formState: { errors },
  } = form;

  const isEditMode = !!editingDept;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="border-b border-gray-100 pb-3 bg-blue-600 text-white">
        {/* component="div" prevents HTML nesting hydration errors */}
        <Typography variant="h6" component="div" className="font-bold">
          {isEditMode ? "Update Department" : "Create Department"}
        </Typography>
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent className="pt-6 space-y-4">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <InputField
                name="name"
                label="Department Name"
                control={control}
                errors={errors}
                placeholder="e.g. Department of Computer Science"
              />
            </Grid>
            <Grid item xs={12}>
              <InputField
                name="code"
                label="Department Code"
                control={control}
                errors={errors}
                placeholder="e.g. CS"
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
            className="bg-blue-600 shadow-none"
          >
            {isLoading
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Create Department"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
