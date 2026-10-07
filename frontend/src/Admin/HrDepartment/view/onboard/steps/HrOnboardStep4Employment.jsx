import React from "react";
import { Box, Typography, TextField, MenuItem, Grid, Checkbox, FormControlLabel, ListSubheader, Divider, Autocomplete } from "@mui/material";
import { Briefcase } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Visiting", "Contract", "Tenured", "Adjunct", "Work-Study"];
const TIME_BOUND_TYPES = ["Visiting", "Adjunct", "Contract"];
// A university employs far more than teaching faculty — grouped suggestions
// covering every staff category, but freeSolo (see the Autocomplete below)
// so HR can always type a title that isn't in this list rather than being
// blocked by it.
const DESIGNATION_GROUPS = {
  "Academic & Faculty": ["Lecturer", "Assistant Professor", "Associate Professor", "Professor", "Adjunct Faculty", "Teaching Assistant"],
  "Administrative": ["Admin Officer", "Office Assistant", "Clerk", "Receptionist", "Secretary"],
  "Security": ["Security Guard", "Security Supervisor", "Security Officer"],
  "Maintenance & Facilities": ["Maintenance Technician", "Electrician", "Plumber", "Housekeeping Staff", "Facilities Manager", "Gardener"],
  "Transport": ["Driver", "Transport Coordinator"],
  "Library": ["Librarian", "Library Assistant"],
  "IT Support": ["IT Support Officer", "Network Administrator", "Systems Administrator"],
  "Lab & Technical": ["Lab Technician", "Lab Assistant"],
  "Medical & Health": ["Medical Officer", "Nurse", "Health Assistant"],
  "Finance & Accounts": ["Accounts Officer", "Cashier", "Finance Assistant"],
  "Sports & Recreation": ["Sports Coordinator", "Coach"],
};
const DESIGNATION_OPTIONS = Object.entries(DESIGNATION_GROUPS).flatMap(([group, titles]) =>
  titles.map((title) => ({ group, title })),
);
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ROLE_GROUPS = {
  "Academic & Faculty": [
    { id: "teacher", label: "Teacher / Faculty" },
    { id: "hod", label: "Head of Dept (HOD)" },
    { id: "course coordinator", label: "Course Coordinator" },
    { id: "head_of_academia", label: "Head of Academia" },
  ],
  "Administration & Finance": [
    { id: "registrar", label: "Registrar" },
    { id: "accountant", label: "Accountant" },
    { id: "hr", label: "HR Manager" },
    { id: "manager", label: "General Manager" },
  ],
  "Clearance Offices": [
    { id: "library", label: "Library Officer" },
    { id: "transport", label: "Transport Officer" },
    { id: "hostel", label: "Hostel Officer" },
    { id: "it_labs", label: "IT & Labs Officer" },
    { id: "clearance_officer", label: "Other Clearance Officer" },
  ],
  "General Support": [{ id: "staff", label: "General Staff" }],
};

const HrOnboardStep4Employment = ({ formData, update, setDateOfJoining, setProbationDuration, toggleArrayValue, departments, allStaff, publicMode }) => {
  const isTimeBound = TIME_BOUND_TYPES.includes(formData.employmentType);

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <Briefcase size={16} /> Employment & Contract Details
      </Typography>

      <Grid container spacing={2} mt={0.5} mb={3}>
        {!publicMode && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select size="small" fullWidth label="Primary System Role" value={formData.role} onChange={(e) => update({ role: e.target.value })} sx={fieldSx}>
              {Object.entries(ROLE_GROUPS).map(([group, roles]) => [
                <ListSubheader key={group} sx={{ fontWeight: 800, fontFamily: "'Montserrat', sans-serif" }}>{group}</ListSubheader>,
                ...roles.map((r) => (
                  <MenuItem key={r.id} value={r.id} sx={{ pl: 4, ...sectionSx }}>
                    {r.label}
                  </MenuItem>
                )),
              ])}
            </TextField>
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Autocomplete
            freeSolo
            size="small"
            fullWidth
            options={DESIGNATION_OPTIONS}
            groupBy={(option) => (typeof option === "string" ? "" : option.group)}
            getOptionLabel={(option) => (typeof option === "string" ? option : option.title)}
            inputValue={formData.designation}
            onInputChange={(_e, newInputValue) => update({ designation: newInputValue })}
            renderInput={(params) => (
              <TextField {...params} label="Designation / Title" required sx={fieldSx} />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select size="small" fullWidth label="Employment Type" value={formData.employmentType} onChange={(e) => update({ employmentType: e.target.value })} sx={fieldSx}>
            {EMPLOYMENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select size="small" fullWidth label="Department / Faculty" value={formData.departmentId} onChange={(e) => update({ departmentId: e.target.value })} sx={fieldSx}>
            <MenuItem value="" sx={{ color: "#64748b", fontStyle: "italic" }}>
              Not Applicable
            </MenuItem>
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {!publicMode && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField select size="small" fullWidth label="Reports To (HOD/Dean)" value={formData.reportingTo} onChange={(e) => update({ reportingTo: e.target.value })} sx={fieldSx}>
              <MenuItem value="" sx={{ color: "#64748b", fontStyle: "italic" }}>
                Not Applicable
              </MenuItem>
              {allStaff.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.personalInfo?.name || s.employeeId} — {s.designation}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
        {publicMode && (
          <Grid size={{ xs: 12, sm: 8 }}>
            <Typography fontSize={12} color="#94a3b8" sx={{ ...sectionSx, mt: 1.5 }}>
              Your system role and reporting line will be assigned by HR during review — no need to set these
              yourself.
            </Typography>
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            required
            size="small"
            fullWidth
            type="date"
            label="Date of Joining"
            InputLabelProps={{ shrink: true }}
            value={formData.dateOfJoining}
            onChange={(e) => setDateOfJoining(e.target.value)}
            sx={fieldSx}
          />
        </Grid>

        {isTimeBound && (
          <>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Contract Start Date"
                InputLabelProps={{ shrink: true }}
                value={formData.contractStartDate}
                onChange={(e) => update({ contractStartDate: e.target.value })}
                sx={fieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                required
                size="small"
                fullWidth
                type="date"
                label="Contract End Date"
                helperText="Mandatory for visiting/contract faculty."
                InputLabelProps={{ shrink: true }}
                value={formData.contractEndDate}
                onChange={(e) => update({ contractEndDate: e.target.value })}
                sx={fieldSx}
              />
            </Grid>
          </>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Probation Period
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Probation Duration"
            value={formData.probationDurationMonths}
            onChange={(e) => setProbationDuration(e.target.value)}
            sx={fieldSx}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value={3}>3 Months</MenuItem>
            <MenuItem value={6}>6 Months</MenuItem>
            <MenuItem value={12}>12 Months</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Probation Start"
            InputLabelProps={{ shrink: true }}
            value={formData.probationStartDate}
            onChange={(e) => update({ probationStartDate: e.target.value })}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Probation End (auto-computed)"
            InputLabelProps={{ shrink: true }}
            value={formData.probationEndDate}
            onChange={(e) => update({ probationEndDate: e.target.value })}
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Shift & Working Days
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select size="small" fullWidth label="Shift" value={formData.shift} onChange={(e) => update({ shift: e.target.value })} sx={fieldSx}>
            {["Day Shift", "Evening Shift", "Weekend Program"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {WEEKDAYS.map((d) => (
              <FormControlLabel
                key={d}
                control={<Checkbox size="small" checked={formData.workingDays.includes(d)} onChange={() => toggleArrayValue("workingDays", d)} />}
                label={<Typography fontSize={12} sx={sectionSx}>{d}</Typography>}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HrOnboardStep4Employment;
