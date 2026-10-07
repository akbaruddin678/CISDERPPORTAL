import React from "react";
import { Box, Typography, TextField, Grid, Checkbox, FormControlLabel, Divider, Paper } from "@mui/material";
import { Wallet } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const HrOnboardStep5Payroll = ({ formData, update }) => {
  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <Wallet size={16} /> Payroll & Financial Integration
      </Typography>
      <Paper elevation={0} sx={{ p: 1.5, mt: 1, mb: 3, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 2 }}>
        <Typography fontSize={12.5} color="#1e40af" sx={sectionSx}>
          Optional at onboarding — everything here can also be set up later from the employee's Profile page. Leave
          "Basic Salary" blank to skip payroll setup for now.
        </Typography>
      </Paper>

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField size="small" fullWidth label="Pay Grade / Scale" placeholder="e.g. BPS-18" value={formData.salaryGrade} onChange={(e) => update({ salaryGrade: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField size="small" fullWidth type="number" label="Basic Salary" value={formData.basicSalary} onChange={(e) => update({ basicSalary: e.target.value })} sx={fieldSx} />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Faculty-Specific Allowances
      </Typography>
      <Grid container spacing={2} mb={3}>
        {[
          ["phdAllowance", "PhD Allowance"],
          ["researchAllowance", "Research Allowance"],
          ["housingAllowance", "Housing Allowance"],
          ["transportAllowance", "Transport Allowance"],
        ].map(([key, label]) => (
          <Grid size={{ xs: 12, sm: 3 }} key={key}>
            <TextField size="small" fullWidth type="number" label={label} value={formData[key]} onChange={(e) => update({ [key]: parseFloat(e.target.value) || 0 })} sx={fieldSx} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Bank Account Details
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField size="small" fullWidth label="Bank Name" value={formData.bankName} onChange={(e) => update({ bankName: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField size="small" fullWidth label="Branch Code" value={formData.branchCode} onChange={(e) => update({ branchCode: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField size="small" fullWidth label="Account Title" value={formData.accountTitle} onChange={(e) => update({ accountTitle: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField size="small" fullWidth label="Account Number" value={formData.accountNumber} onChange={(e) => update({ accountNumber: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField size="small" fullWidth label="IBAN" value={formData.iban} onChange={(e) => update({ iban: e.target.value })} sx={fieldSx} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Tax Information
      </Typography>
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField size="small" fullWidth label="National Tax Number (NTN)" value={formData.ntn} onChange={(e) => update({ ntn: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField size="small" fullWidth label="Tax Bracket" value={formData.taxBracket} onChange={(e) => update({ taxBracket: e.target.value })} sx={fieldSx} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Provident Fund / Pension
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControlLabel
            control={<Checkbox checked={formData.pfEnrolled} onChange={(e) => update({ pfEnrolled: e.target.checked })} />}
            label={<Typography fontSize={13} sx={sectionSx}>Enrolled</Typography>}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Employee Contribution %"
            value={formData.pfEmployeePercent}
            onChange={(e) => update({ pfEmployeePercent: parseFloat(e.target.value) || 0 })}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Employer Contribution %"
            value={formData.pfEmployerPercent}
            onChange={(e) => update({ pfEmployerPercent: parseFloat(e.target.value) || 0 })}
            sx={fieldSx}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default HrOnboardStep5Payroll;
