import React from "react";
import { Box, Typography, TextField, MenuItem, Button, IconButton, Grid, Divider, Checkbox, FormControlLabel, Chip, Paper } from "@mui/material";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Visiting", "Contract", "Tenured", "Adjunct", "Work-Study"];
const TIME_BOUND_TYPES = ["Visiting", "Adjunct", "Contract"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const HrContractTab = ({ contractForm, setContractForm, saveContract, isSavingContract }) => {
  const isTimeBound = TIME_BOUND_TYPES.includes(contractForm.employmentType);
  const probationDaysLeft = daysUntil(contractForm.probation?.endDate);
  const contractDaysLeft = daysUntil(contractForm.contractEndDate);

  const toggleWorkingDay = (day) =>
    setContractForm((p) => ({
      ...p,
      workingDays: p.workingDays.includes(day) ? p.workingDays.filter((d) => d !== day) : [...p.workingDays, day],
    }));

  // Auto-computes probation end date from start + N months — same
  // auto-suggest UX as onboarding's default.
  const setProbationDuration = (months) =>
    setContractForm((p) => {
      const next = { ...p, probation: { ...p.probation, durationMonths: months } };
      if (months && p.probation.startDate) {
        const end = new Date(p.probation.startDate);
        end.setMonth(end.getMonth() + Number(months));
        next.probation.endDate = end.toISOString().split("T")[0];
      }
      return next;
    });

  const updateRoles = {
    add: () =>
      setContractForm((p) => ({
        ...p,
        roleAssignments: [
          ...p.roleAssignments,
          { title: "", roleType: "academic", isPrimary: false, startDate: "", endDate: "", status: "active" },
        ],
      })),
    remove: (idx) =>
      setContractForm((p) => ({ ...p, roleAssignments: p.roleAssignments.filter((_, i) => i !== idx) })),
    change: (idx, field, value) =>
      setContractForm((p) => ({
        ...p,
        roleAssignments: p.roleAssignments.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
      })),
  };

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Employment Type & Contract
      </Typography>
      <Grid container spacing={2} mb={1} mt={0.5}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            fullWidth
            label="Employment Type"
            value={contractForm.employmentType}
            onChange={(e) => setContractForm((p) => ({ ...p, employmentType: e.target.value }))}
            sx={fieldSx}
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {isTimeBound && (
          <>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Contract Start Date"
                InputLabelProps={{ shrink: true }}
                value={contractForm.contractStartDate}
                onChange={(e) => setContractForm((p) => ({ ...p, contractStartDate: e.target.value }))}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Contract End Date"
                InputLabelProps={{ shrink: true }}
                value={contractForm.contractEndDate}
                onChange={(e) => setContractForm((p) => ({ ...p, contractEndDate: e.target.value }))}
                sx={fieldSx}
              />
            </Grid>
          </>
        )}
      </Grid>
      {isTimeBound && contractDaysLeft !== null && contractDaysLeft <= 30 && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 3, bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <AlertTriangle size={16} color="#d97706" />
          <Typography variant="body2" color="#92400e" sx={sectionSx}>
            {contractDaysLeft < 0 ? "Contract has ended." : `Contract ends in ${contractDaysLeft} day(s).`}
          </Typography>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Probation
      </Typography>
      <Grid container spacing={2} mb={1} mt={0.5}>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            size="small"
            fullWidth
            label="Duration"
            value={contractForm.probation.durationMonths || ""}
            onChange={(e) => setProbationDuration(e.target.value)}
            sx={fieldSx}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value={3}>3 Months</MenuItem>
            <MenuItem value={6}>6 Months</MenuItem>
            <MenuItem value={12}>12 Months</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            size="small"
            fullWidth
            label="Status"
            value={contractForm.probation.status}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, probation: { ...p.probation, status: e.target.value } }))
            }
            sx={fieldSx}
          >
            {["not_applicable", "in_progress", "confirmed", "terminated"].map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace("_", " ")}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={contractForm.probation.startDate}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, probation: { ...p.probation, startDate: e.target.value } }))
            }
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="End Date"
            InputLabelProps={{ shrink: true }}
            value={contractForm.probation.endDate}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, probation: { ...p.probation, endDate: e.target.value } }))
            }
            sx={fieldSx}
          />
        </Grid>
      </Grid>
      {contractForm.probation.status === "in_progress" && probationDaysLeft !== null && probationDaysLeft <= 30 && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 3, bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <AlertTriangle size={16} color="#dc2626" />
          <Typography variant="body2" color="#991b1b" sx={sectionSx}>
            {probationDaysLeft < 0
              ? "Probation period has ended — confirm or terminate."
              : `Probation ends in ${probationDaysLeft} day(s) — HR and HOD will be reminded automatically.`}
          </Typography>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Tenure Tracking
      </Typography>
      <Grid container spacing={2} mb={4} mt={0.5} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={contractForm.tenureTrack.isTenureTrack}
                onChange={(e) =>
                  setContractForm((p) => ({
                    ...p,
                    tenureTrack: { ...p.tenureTrack, isTenureTrack: e.target.checked },
                  }))
                }
              />
            }
            label={<Typography fontSize={13} sx={sectionSx}>On Tenure Track</Typography>}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            select
            size="small"
            fullWidth
            label="Tenure Status"
            value={contractForm.tenureTrack.tenureStatus}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, tenureTrack: { ...p.tenureTrack, tenureStatus: e.target.value } }))
            }
            sx={fieldSx}
          >
            {["not_applicable", "tenure_track", "tenured"].map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace("_", " ")}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Last Promotion Date"
            InputLabelProps={{ shrink: true }}
            value={contractForm.tenureTrack.lastPromotionDate}
            onChange={(e) =>
              setContractForm((p) => ({
                ...p,
                tenureTrack: { ...p.tenureTrack, lastPromotionDate: e.target.value },
              }))
            }
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Next Review Date"
            InputLabelProps={{ shrink: true }}
            value={contractForm.tenureTrack.nextReviewDate}
            onChange={(e) =>
              setContractForm((p) => ({ ...p, tenureTrack: { ...p.tenureTrack, nextReviewDate: e.target.value } }))
            }
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Shift & Working Days
      </Typography>
      <Grid container spacing={2} mb={4} mt={0.5} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            fullWidth
            label="Shift"
            value={contractForm.shift}
            onChange={(e) => setContractForm((p) => ({ ...p, shift: e.target.value }))}
            sx={fieldSx}
          >
            {["Day Shift", "Evening Shift", "Weekend Program"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {WEEKDAYS.map((d) => (
              <FormControlLabel
                key={d}
                control={<Checkbox size="small" checked={contractForm.workingDays.includes(d)} onChange={() => toggleWorkingDay(d)} />}
                label={<Typography fontSize={12} sx={sectionSx}>{d}</Typography>}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={800} sx={sectionSx}>
          Concurrent Role Assignments
        </Typography>
        <Button
          size="small"
          startIcon={<Plus size={14} />}
          onClick={updateRoles.add}
          sx={{ textTransform: "none", fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}
        >
          Add Role
        </Button>
      </Box>
      {contractForm.roleAssignments.length === 0 ? (
        <Typography variant="body2" color="#94a3b8" sx={sectionSx} mb={3}>
          No additional role assignments — the employee holds only their primary designation.
        </Typography>
      ) : (
        contractForm.roleAssignments.map((role, idx) => (
          <Grid container spacing={1.5} key={role._id || idx} mb={1.5} alignItems="center">
            <Grid item xs={3}>
              <TextField
                size="small"
                fullWidth
                label="Title"
                value={role.title}
                onChange={(e) => updateRoles.change(idx, "title", e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                select
                size="small"
                fullWidth
                label="Type"
                value={role.roleType}
                onChange={(e) => updateRoles.change(idx, "roleType", e.target.value)}
                sx={fieldSx}
              >
                <MenuItem value="academic">Academic</MenuItem>
                <MenuItem value="administrative">Administrative</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={2}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Start"
                InputLabelProps={{ shrink: true }}
                value={role.startDate}
                onChange={(e) => updateRoles.change(idx, "startDate", e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                select
                size="small"
                fullWidth
                label="Status"
                value={role.status}
                onChange={(e) => updateRoles.change(idx, "status", e.target.value)}
                sx={fieldSx}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="ended">Ended</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={!!role.isPrimary}
                    onChange={(e) => updateRoles.change(idx, "isPrimary", e.target.checked)}
                  />
                }
                label={<Typography fontSize={12} sx={sectionSx}>Primary</Typography>}
              />
            </Grid>
            <Grid item xs="auto">
              <IconButton size="small" color="error" onClick={() => updateRoles.remove(idx)}>
                <Trash2 size={16} />
              </IconButton>
            </Grid>
          </Grid>
        ))
      )}

      <Box mt={4}>
        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={saveContract}
          disabled={isSavingContract}
          sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", px: 4, textTransform: "none", fontFamily: "'Montserrat', sans-serif" }}
        >
          {isSavingContract ? "Saving..." : "Save Contract & Roles"}
        </Button>
      </Box>
    </Box>
  );
};

export default HrContractTab;
