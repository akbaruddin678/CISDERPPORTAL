import React, { useEffect, useState } from "react";
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
  Box,
  Divider,
} from "@mui/material";
import { Controller } from "react-hook-form";
import InputField from "../../../../shared/InputField/UI/InputField";
import { useWatch } from "react-hook-form";
import { baseUrl } from "../../../../components/base/baseurl";
import { getUserData } from "../../../../components/user/services/localStorageService";

// Every value here must be a role the User schema's enum actually accepts
// (see backend/src/user/model/User.js) — "head" used to be listed but was
// never a valid enum value (it was replaced by "hod" long ago), so picking
// it silently failed to save. Keep this list in sync with that enum
// whenever a role is added there — otherwise it's assignable everywhere
// except from this screen, which was the original bug report (no way to
// add a VC, Head of Academia, Vice VC, Exam, Registrar or Course
// Coordinator user here even though the backend already supports them).
const roleOptions = [
  { value: "admin", label: "Administrator", group: "MANAGEMENT" },
  { value: "vc", label: "Vice Chancellor (VC)", group: "MANAGEMENT" },
  { value: "vice_vc", label: "Vice VC", group: "MANAGEMENT" },
  { value: "registrar", label: "Registrar", group: "MANAGEMENT" },
  { value: "manager", label: "Manager", group: "MANAGEMENT" },
  { value: "hr", label: "Human Resources", group: "MANAGEMENT" },
  { value: "accountant", label: "Accountant", group: "FINANCE" },
  { value: "headofaccount", label: "Head of Accounts (All Campuses)", group: "FINANCE" },
  { value: "head_of_academia", label: "Head of Academia", group: "ACADEMIC" },
  { value: "hod", label: "HOD", group: "ACADEMIC" },
  { value: "course coordinator", label: "Course Coordinator", group: "ACADEMIC" },
  { value: "teacher", label: "Teacher / Faculty", group: "ACADEMIC" },
  { value: "exam", label: "Examination Department", group: "ACADEMIC" },
  { value: "student", label: "Student", group: "ACADEMIC" },
  { value: "admission", label: "Admission Officer", group: "ADMISSION" },
  { value: "library", label: "Library Officer", group: "CLEARANCE" },
  { value: "transport", label: "Transport Officer", group: "CLEARANCE" },
  { value: "hostel", label: "Hostel Officer", group: "CLEARANCE" },
  { value: "it_labs", label: "IT & Labs Officer", group: "CLEARANCE" },
  { value: "clearance_officer", label: "Other Clearance Officer", group: "CLEARANCE" },
  { value: "staff", label: "General Staff", group: "OTHER" },
  { value: "viwer", label: "Viewer (Read-Only)", group: "OTHER" },
  { value: "applicant", label: "Applicant", group: "OTHER" },
];

export const UserFormModal = ({
  open,
  onClose,
  isEditMode,
  control,
  errors,
  onSubmit,
  isLoading,
}) => {
  const [schools, setSchools] = useState([]);
  const selectedRole = useWatch({ control, name: "role" });
  const needsCampus = ["accountant", "admission"].includes(selectedRole);

  useEffect(() => {
    const token = getUserData()?.token;
    fetch(`${baseUrl}/api/schools`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((payload) => setSchools((payload.data || []).filter((school) => school.isActive)))
      .catch(() => setSchools([]));
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "rounded-xl" }}
    >
      <DialogTitle className="border-b border-gray-100 pb-3 bg-blue-600 text-white">
        <Typography variant="h6" className="font-bold">
          {isEditMode ? "Update User Details" : "Create New User"}
        </Typography>
        <Typography variant="body2" className="opacity-80">
          {isEditMode
            ? "Modify existing credentials and roles"
            : "Register a new user to the system"}
        </Typography>
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent className="pt-6 space-y-6">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <InputField
                name="name"
                label="Full Name"
                control={control}
                errors={errors}
                placeholder="e.g. John Doe"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <InputField
                name="email"
                label="Email Address"
                type="email"
                control={control}
                errors={errors}
                placeholder="john@example.com"
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Primary Role"
                    fullWidth
                    error={!!errors.role}
                    helperText={errors.role?.message}
                  >
                    {roleOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.group} - {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="campusId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label={needsCampus ? "Assigned School / Campus *" : "Assigned School / Campus"} fullWidth disabled={selectedRole === "headofaccount"} helperText={selectedRole === "headofaccount" ? "The Head of Accounts can access and filter all campuses." : "Accounts and Admission logins are restricted to this campus."}>
                    <MenuItem value=""><em>{needsCampus ? "Select a campus" : "No campus / central office"}</em></MenuItem>
                    {schools.map((school) => <MenuItem key={school.id} value={school.id}>{school.name} ({school.code})</MenuItem>)}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>

          <Divider />

          <Box
            className={`${isEditMode ? "bg-yellow-50" : "bg-gray-50"} p-4 rounded-lg border ${isEditMode ? "border-yellow-200" : "border-gray-200"}`}
          >
            <Typography variant="subtitle1" className="font-bold mb-1">
              Security Setup
            </Typography>
            {isEditMode && (
              <Typography variant="body2" className="mb-4 text-yellow-700">
                Leave these fields <strong>empty</strong> if you do not want to
                change the password.
              </Typography>
            )}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InputField
                  name="password"
                  label="Password"
                  type="password"
                  control={control}
                  errors={errors}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InputField
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  control={control}
                  errors={errors}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions className="p-4 border-t border-gray-100 bg-gray-50">
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading
              ? "Processing..."
              : isEditMode
                ? "Save Changes"
                : "Create User"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
