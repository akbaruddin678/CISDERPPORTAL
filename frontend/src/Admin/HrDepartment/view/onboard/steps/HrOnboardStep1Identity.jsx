import React from "react";
import { Box, Typography, TextField, MenuItem, Grid, Checkbox, FormControlLabel, IconButton, Button } from "@mui/material";
import { Plus, Trash2, User } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const HrOnboardStep1Identity = ({ formData, update, updateNested, addArrayItem, removeArrayItem, updateArrayItem, photoPreview, handleFileChange }) => {
  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <User size={16} /> Personal Identity & Demographics
      </Typography>

      <Box display="flex" alignItems="center" gap={3} mt={2} mb={4}>
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            border: "2px dashed #cbd5e1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            bgcolor: "#f8fafc",
            flexShrink: 0,
          }}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Typography fontSize={10} color="#94a3b8" textAlign="center" px={1} sx={sectionSx}>
              No Photo
            </Typography>
          )}
        </Box>
        <Box>
          <Button component="label" variant="outlined" sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, ...sectionSx }}>
            Upload Profile Picture
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
          <Typography fontSize={11} color="#94a3b8" mt={0.5} sx={sectionSx}>
            For the ID card and faculty directory. PNG/JPG up to 2MB.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField required size="small" fullWidth label="First Name" value={formData.firstName} onChange={(e) => update({ firstName: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField size="small" fullWidth label="Middle Name" value={formData.middleName || ""} onChange={(e) => update({ middleName: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField size="small" fullWidth label="Last Name" value={formData.lastName} onChange={(e) => update({ lastName: e.target.value })} sx={fieldSx} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField size="small" fullWidth label="CNIC / National ID" value={formData.nationalId} onChange={(e) => update({ nationalId: e.target.value })} sx={fieldSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            label="Passport Number (international faculty)"
            value={formData.passportNumber}
            onChange={(e) => update({ passportNumber: e.target.value })}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Date of Birth"
            InputLabelProps={{ shrink: true }}
            value={formData.dob}
            onChange={(e) => update({ dob: e.target.value })}
            sx={fieldSx}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField select size="small" fullWidth label="Gender" value={formData.gender} onChange={(e) => update({ gender: e.target.value })} sx={fieldSx}>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField select size="small" fullWidth label="Blood Group" value={formData.bloodGroup} onChange={(e) => update({ bloodGroup: e.target.value })} sx={fieldSx}>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Marital Status"
            value={formData.maritalStatus}
            onChange={(e) => update({ maritalStatus: e.target.value })}
            sx={fieldSx}
          >
            {["Not Specified", "Single", "Married", "Divorced", "Widowed"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }} display="flex" alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.disabilityStatus.hasDisability}
                onChange={(e) => updateNested("disabilityStatus", { hasDisability: e.target.checked })}
              />
            }
            label={<Typography fontSize={13} sx={sectionSx}>Disability / Accessibility Needs</Typography>}
          />
        </Grid>
        {formData.disabilityStatus.hasDisability && (
          <Grid size={12}>
            <TextField
              size="small"
              fullWidth
              label="Accessibility Accommodation Details"
              value={formData.disabilityStatus.details}
              onChange={(e) => updateNested("disabilityStatus", { details: e.target.value })}
              sx={fieldSx}
            />
          </Grid>
        )}
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={800} sx={sectionSx}>
          Dependents & Beneficiaries
        </Typography>
        <Button
          size="small"
          startIcon={<Plus size={14} />}
          onClick={() => addArrayItem("dependents", { name: "", relation: "spouse", dob: "", cnic: "", isBeneficiary: false })}
          sx={{ textTransform: "none", fontWeight: 700, ...sectionSx }}
        >
          Add Dependent
        </Button>
      </Box>
      {formData.dependents.length === 0 ? (
        <Typography variant="body2" color="#94a3b8" sx={sectionSx} mb={1}>
          No dependents added — used for health insurance, fee waivers, and tax exemption calculations.
        </Typography>
      ) : (
        formData.dependents.map((dep, idx) => (
          <Grid container spacing={1.5} key={idx} mb={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField size="small" fullWidth label="Name" value={dep.name} onChange={(e) => updateArrayItem("dependents", idx, { name: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField select size="small" fullWidth label="Relation" value={dep.relation} onChange={(e) => updateArrayItem("dependents", idx, { relation: e.target.value })} sx={fieldSx}>
                <MenuItem value="spouse">Spouse</MenuItem>
                <MenuItem value="child">Child</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="DOB"
                InputLabelProps={{ shrink: true }}
                value={dep.dob}
                onChange={(e) => updateArrayItem("dependents", idx, { dob: e.target.value })}
                sx={fieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField size="small" fullWidth label="CNIC" value={dep.cnic} onChange={(e) => updateArrayItem("dependents", idx, { cnic: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={!!dep.isBeneficiary} onChange={(e) => updateArrayItem("dependents", idx, { isBeneficiary: e.target.checked })} />}
                label={<Typography fontSize={12} sx={sectionSx}>Beneficiary</Typography>}
              />
            </Grid>
            <Grid size="auto">
              <IconButton size="small" color="error" onClick={() => removeArrayItem("dependents", idx)}>
                <Trash2 size={16} />
              </IconButton>
            </Grid>
          </Grid>
        ))
      )}
    </Box>
  );
};

export default HrOnboardStep1Identity;
