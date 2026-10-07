import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import InputField from "../../../../shared/InputField/UI/InputField";

const EditLmsCredentialsModal = ({
  open,
  onClose,
  account,
  control,
  errors,
  onSubmit,
  isSaving,
}) => (
  <Dialog
    open={open}
    onClose={() => !isSaving && onClose()}
    maxWidth="sm"
    fullWidth
    PaperProps={{ className: "rounded-xl" }}
  >
    <DialogTitle className="border-b border-gray-100 pb-3 bg-blue-600 text-white">
      <Typography variant="h6" className="font-bold">
        Edit LMS Account
      </Typography>
      <Typography variant="body2" className="opacity-80">
        {account?.name} — {account?.rollNumber}
      </Typography>
    </DialogTitle>

    <form onSubmit={onSubmit}>
      <DialogContent className="pt-6 space-y-5">
        <InputField
          name="email"
          label="LMS Login Email"
          type="email"
          control={control}
          errors={errors}
        />
        <Typography variant="caption" className="text-gray-500 block -mt-3">
          This is the student's LMS login email — separate from their
          admission/user account email.
        </Typography>

        <Divider />

        <Box className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Typography variant="subtitle2" className="font-bold mb-1">
            Reset Password
          </Typography>
          <Typography variant="body2" className="mb-4 text-gray-500">
            Leave both fields empty to keep the current password unchanged.
          </Typography>
          <Box className="space-y-4">
            <InputField
              name="password"
              label="New Password"
              type="password"
              control={control}
              errors={errors}
            />
            <InputField
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              control={control}
              errors={errors}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="p-4 border-t border-gray-100 bg-gray-50">
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </form>
  </Dialog>
);

export default EditLmsCredentialsModal;
