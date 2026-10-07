import React, { useState } from "react";
import { Box, Typography, TextField, MenuItem, Grid, IconButton, Button, Chip, Divider } from "@mui/material";
import { Plus, Trash2, GraduationCap } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const HrOnboardStep3Academic = ({ formData, update, updateNested, addArrayItem, removeArrayItem, updateArrayItem }) => {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !formData.teachingSpecializations.includes(val)) {
      update({ teachingSpecializations: [...formData.teachingSpecializations, val] });
    }
    setTagInput("");
  };
  const removeTag = (tag) =>
    update({ teachingSpecializations: formData.teachingSpecializations.filter((t) => t !== tag) });

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <GraduationCap size={16} /> Academic & Professional Credentials
      </Typography>

      <Grid container spacing={2} mt={0.5} mb={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select size="small" fullWidth label="Highest Degree Attained" value={formData.highestDegree} onChange={(e) => update({ highestDegree: e.target.value })} sx={fieldSx}>
            {["PhD", "MS/MPhil", "Masters", "Bachelors", "Other"].map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Teaching Experience (years)"
            value={formData.experienceYears}
            onChange={(e) => update({ experienceYears: parseInt(e.target.value) || 0 })}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Industry Experience (years)"
            value={formData.industryExperienceYears}
            onChange={(e) => update({ industryExperienceYears: parseInt(e.target.value) || 0 })}
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={800} sx={sectionSx}>
          Degree Details
        </Typography>
        <Button
          size="small"
          startIcon={<Plus size={14} />}
          onClick={() => addArrayItem("qualifications", { degree: "", institution: "", yearCompleted: "", specialization: "", cgpaOrDivision: "" })}
          sx={{ textTransform: "none", fontWeight: 700, ...sectionSx }}
        >
          Add Degree
        </Button>
      </Box>
      {formData.qualifications.length === 0 ? (
        <Typography variant="body2" color="#94a3b8" sx={sectionSx} mb={2}>
          Add at least the highest/most relevant degree with title, university, and year.
        </Typography>
      ) : (
        formData.qualifications.map((q, idx) => (
          <Grid container spacing={1.5} key={idx} mb={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField size="small" fullWidth label="Degree Title" value={q.degree} onChange={(e) => updateArrayItem("qualifications", idx, { degree: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField size="small" fullWidth label="Issuing University" value={q.institution} onChange={(e) => updateArrayItem("qualifications", idx, { institution: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField size="small" fullWidth type="number" label="Year" value={q.yearCompleted} onChange={(e) => updateArrayItem("qualifications", idx, { yearCompleted: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField size="small" fullWidth label="CGPA / Division" value={q.cgpaOrDivision} onChange={(e) => updateArrayItem("qualifications", idx, { cgpaOrDivision: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 10, sm: 1.5 }}>
              <TextField size="small" fullWidth label="Specialization" value={q.specialization} onChange={(e) => updateArrayItem("qualifications", idx, { specialization: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size="auto">
              <IconButton size="small" color="error" onClick={() => removeArrayItem("qualifications", idx)}>
                <Trash2 size={16} />
              </IconButton>
            </Grid>
          </Grid>
        ))
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Teaching Specializations
      </Typography>
      <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
        {formData.teachingSpecializations.map((tag) => (
          <Chip key={tag} label={tag} size="small" onDelete={() => removeTag(tag)} sx={{ fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8" }} />
        ))}
      </Box>
      <TextField
        size="small"
        placeholder="Type a subject/domain and press Enter (e.g. Data Structures, Machine Learning)"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        sx={{ ...fieldSx, minWidth: 340 }}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Research & Publications Profile (optional)
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            label="ORCID ID"
            value={formData.researchProfile.orcidId}
            onChange={(e) => updateNested("researchProfile", { orcidId: e.target.value })}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            label="Google Scholar Link"
            value={formData.researchProfile.googleScholarUrl}
            onChange={(e) => updateNested("researchProfile", { googleScholarUrl: e.target.value })}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Recognized Publications"
            value={formData.researchProfile.publicationsCount}
            onChange={(e) => updateNested("researchProfile", { publicationsCount: parseInt(e.target.value) || 0 })}
            sx={fieldSx}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default HrOnboardStep3Academic;
