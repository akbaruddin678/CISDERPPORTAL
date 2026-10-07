import React from "react";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// All roles that actually exist on the User schema's enum (see
// backend/src/user/model/User.js), grouped for display. "Head", "Super
// Accountant" and "Super Admission" used to be listed here but were never
// real roles — filtering by them could never match a single user, which is
// how roles like VC, Registrar and Head of Academia went unnoticed as
// missing: their real users were simply never selectable to look at.
const roleGroups = {
  Management: [
    { value: "admin", label: "Admin" },
    { value: "vc", label: "Vice Chancellor (VC)" },
    { value: "vice_vc", label: "Vice VC" },
    { value: "registrar", label: "Registrar" },
    { value: "manager", label: "Manager" },
    { value: "hr", label: "HR" },
  ],
  Finance: [
    { value: "accountant", label: "Accountant" },
    { value: "headofaccount", label: "Head of Accounts" },
  ],
  Academic: [
    { value: "head_of_academia", label: "Head of Academia" },
    { value: "hod", label: "HOD" },
    { value: "course coordinator", label: "Course Coordinator" },
    { value: "teacher", label: "Teacher" },
    { value: "exam", label: "Examination Dept" },
    { value: "student", label: "Student" },
  ],
  Admission: [{ value: "admission", label: "Admission Staff" }],
  "Clearance Offices": [
    { value: "library", label: "Library" },
    { value: "transport", label: "Transport" },
    { value: "hostel", label: "Hostel" },
    { value: "it_labs", label: "IT & Labs" },
    { value: "clearance_officer", label: "Other Clearance Officer" },
  ],
  Other: [
    { value: "staff", label: "Staff" },
    { value: "applicant", label: "Applicant" },
    { value: "viwer", label: "Viewer" },
  ],
};

// Flattened list for "Select All" logic
const allRoles = Object.values(roleGroups)
  .flat()
  .map((r) => r.value);

export const RoleFilter = ({ selectedRoles, onRoleChange }) => {
  const handleRoleToggle = (role) => {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    onRoleChange(newRoles);
  };

  const handleSelectAll = () => {
    onRoleChange(allRoles);
  };

  const handleClearAll = () => {
    onRoleChange([]);
  };

  return (
    <Paper
      className="mb-4 overflow-hidden border border-gray-200"
      elevation={0}
    >
      <Accordion defaultExpanded elevation={0}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          className="bg-gray-50"
        >
          <Typography variant="h6" className="font-semibold text-gray-700">
            Filter Users by Role
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Kept out of the summary: a <button> cannot sit inside the
              accordion header's own <button>. */}
          <div className="flex gap-2 mb-3">
            <Button size="small" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="small" onClick={handleClearAll} color="error">
              Clear
            </Button>
          </div>
          <Grid container spacing={2}>
            {Object.entries(roleGroups).map(([groupName, roles]) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={groupName}>
                <Typography
                  variant="subtitle2"
                  className="text-blue-600 font-bold mb-1 uppercase text-xs"
                >
                  {groupName}
                </Typography>
                <FormGroup>
                  {roles.map((role) => (
                    <FormControlLabel
                      key={role.value}
                      control={
                        <Checkbox
                          checked={selectedRoles.includes(role.value)}
                          onChange={() => handleRoleToggle(role.value)}
                          size="small"
                          color="primary"
                        />
                      }
                      label={
                        <span className="text-sm text-gray-700">
                          {role.label}
                        </span>
                      }
                      className="m-0"
                    />
                  ))}
                </FormGroup>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};
