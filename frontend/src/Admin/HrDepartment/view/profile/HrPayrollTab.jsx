import React from "react";
import { Box, Typography, TextField, MenuItem, Button, Grid, Divider, Checkbox, FormControlLabel, CircularProgress } from "@mui/material";
import { Save, Wallet } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

// Employment & Payroll — backed by StaffEmploymentInfo, a model that
// previously existed but was never wired to any UI. Optional: a staff
// member can go without payroll setup indefinitely (e.g. before their
// bank details are finalized).
const HrPayrollTab = ({ employmentInfoForm, setEmploymentInfoForm, saveEmploymentInfo, isSavingEmploymentInfo, isLoadingEmploymentInfo, allStaff = [] }) => {
  const updateField = (field, value) => setEmploymentInfoForm((p) => ({ ...p, [field]: value }));
  const updateNested = (group, field, value) =>
    setEmploymentInfoForm((p) => ({ ...p, [group]: { ...p[group], [field]: value } }));

  if (isLoadingEmploymentInfo) {
    return (
      <Box py={6} textAlign="center">
        <CircularProgress size={28} sx={{ color: "#2563eb" }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <Wallet size={16} /> Salary & Reporting Line
      </Typography>
      <Grid container spacing={2} mb={1} mt={0.5}>
        <Grid item xs={12} sm={4}>
          <TextField size="small" fullWidth label="Pay Grade / Scale" value={employmentInfoForm.salaryGrade} onChange={(e) => updateField("salaryGrade", e.target.value)} sx={fieldSx} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Basic Salary"
            value={employmentInfoForm.basicSalary}
            onChange={(e) => updateField("basicSalary", e.target.value)}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select size="small" fullWidth label="Reports To (HOD/Dean)" value={employmentInfoForm.reportingTo} onChange={(e) => updateField("reportingTo", e.target.value)} sx={fieldSx}>
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
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Faculty-Specific Allowances
      </Typography>
      <Grid container spacing={2} mb={1}>
        {[
          ["phdAllowance", "PhD Allowance"],
          ["researchAllowance", "Research Allowance"],
          ["housingAllowance", "Housing Allowance"],
          ["transportAllowance", "Transport Allowance"],
        ].map(([key, label]) => (
          <Grid item xs={12} sm={3} key={key}>
            <TextField
              size="small"
              fullWidth
              type="number"
              label={label}
              value={employmentInfoForm.allowances[key]}
              onChange={(e) => updateNested("allowances", key, parseFloat(e.target.value) || 0)}
              sx={fieldSx}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Bank Account Details
      </Typography>
      <Grid container spacing={2} mb={1}>
        <Grid item xs={12} sm={3}>
          <TextField size="small" fullWidth label="Bank Name" value={employmentInfoForm.bankDetails.bankName} onChange={(e) => updateNested("bankDetails", "bankName", e.target.value)} sx={fieldSx} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            label="Branch Code"
            value={employmentInfoForm.bankDetails.branchCode}
            onChange={(e) => updateNested("bankDetails", "branchCode", e.target.value)}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            label="Account Title"
            value={employmentInfoForm.bankDetails.accountTitle}
            onChange={(e) => updateNested("bankDetails", "accountTitle", e.target.value)}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            size="small"
            fullWidth
            label="Account Number"
            value={employmentInfoForm.bankDetails.accountNumber}
            onChange={(e) => updateNested("bankDetails", "accountNumber", e.target.value)}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField size="small" fullWidth label="IBAN" value={employmentInfoForm.bankDetails.iban} onChange={(e) => updateNested("bankDetails", "iban", e.target.value)} sx={fieldSx} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Tax Information
      </Typography>
      <Grid container spacing={2} mb={1}>
        <Grid item xs={12} sm={4}>
          <TextField size="small" fullWidth label="National Tax Number (NTN)" value={employmentInfoForm.taxInfo.ntn} onChange={(e) => updateNested("taxInfo", "ntn", e.target.value)} sx={fieldSx} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField size="small" fullWidth label="Tax Bracket" value={employmentInfoForm.taxInfo.taxBracket} onChange={(e) => updateNested("taxInfo", "taxBracket", e.target.value)} sx={fieldSx} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Provident Fund / Pension
      </Typography>
      <Grid container spacing={2} alignItems="center" mb={4}>
        <Grid item xs={12} sm={3}>
          <FormControlLabel
            control={<Checkbox checked={employmentInfoForm.providentFund.enrolled} onChange={(e) => updateNested("providentFund", "enrolled", e.target.checked)} />}
            label={<Typography fontSize={13} sx={sectionSx}>Enrolled</Typography>}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Employee Contribution %"
            value={employmentInfoForm.providentFund.employeeContributionPercent}
            onChange={(e) => updateNested("providentFund", "employeeContributionPercent", parseFloat(e.target.value) || 0)}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Employer Contribution %"
            value={employmentInfoForm.providentFund.employerContributionPercent}
            onChange={(e) => updateNested("providentFund", "employerContributionPercent", parseFloat(e.target.value) || 0)}
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        startIcon={<Save size={16} />}
        onClick={saveEmploymentInfo}
        disabled={isSavingEmploymentInfo}
        sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", px: 4, textTransform: "none", ...sectionSx }}
      >
        {isSavingEmploymentInfo ? "Saving..." : "Save Payroll & Employment Info"}
      </Button>
    </Box>
  );
};

export default HrPayrollTab;
