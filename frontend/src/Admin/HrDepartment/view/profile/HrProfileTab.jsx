import React, { useState } from "react";
import { Box, Typography, TextField, MenuItem, Button, IconButton, Grid, Divider, Checkbox, FormControlLabel, Chip } from "@mui/material";
import { Plus, Trash2, Save, Clock } from "lucide-react";

const HIGHEST_DEGREES = ["PhD", "MS/MPhil", "Masters", "Bachelors", "Other"];
const MARITAL_STATUSES = ["Not Specified", "Single", "Married", "Divorced", "Widowed"];

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const RepeatableSection = ({ title, rows, columns, onAdd, onRemove, onChange, emptyRow }) => (
  <Box mb={4}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx}>
        {title}
      </Typography>
      <Button
        size="small"
        startIcon={<Plus size={14} />}
        onClick={() => onAdd(emptyRow)}
        sx={{ textTransform: "none", fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}
      >
        Add
      </Button>
    </Box>
    {rows.length === 0 ? (
      <Typography variant="body2" color="#94a3b8" sx={sectionSx}>
        None recorded.
      </Typography>
    ) : (
      rows.map((row, idx) => (
        <Grid container spacing={1.5} key={row._id || idx} mb={1.5} alignItems="center">
          {columns.map((col) => (
            <Grid item xs={col.xs} key={col.key}>
              {col.type === "select" ? (
                <TextField
                  select
                  size="small"
                  fullWidth
                  label={col.label}
                  value={row[col.key] || ""}
                  onChange={(e) => onChange(idx, col.key, e.target.value)}
                  sx={fieldSx}
                >
                  {col.options.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              ) : col.type === "checkbox" ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={!!row[col.key]}
                      onChange={(e) => onChange(idx, col.key, e.target.checked)}
                    />
                  }
                  label={<Typography fontSize={12} sx={sectionSx}>{col.label}</Typography>}
                />
              ) : (
                <TextField
                  size="small"
                  fullWidth
                  type={col.type || "text"}
                  label={col.label}
                  InputLabelProps={col.type === "date" ? { shrink: true } : undefined}
                  value={row[col.key] || ""}
                  onChange={(e) => onChange(idx, col.key, e.target.value)}
                  sx={fieldSx}
                />
              )}
            </Grid>
          ))}
          <Grid item xs="auto">
            <IconButton size="small" color="error" onClick={() => onRemove(idx)}>
              <Trash2 size={16} />
            </IconButton>
          </Grid>
        </Grid>
      ))
    )}
  </Box>
);

const TagInput = ({ value, onChange }) => {
  const [input, setInput] = useState("");
  const addTag = () => {
    const val = input.trim();
    if (val && !value.includes(val)) onChange([...value, val]);
    setInput("");
  };
  return (
    <Box>
      <Box display="flex" gap={1} mb={1} flexWrap="wrap">
        {value.map((tag) => (
          <Chip key={tag} label={tag} size="small" onDelete={() => onChange(value.filter((t) => t !== tag))} sx={{ fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8" }} />
        ))}
      </Box>
      <TextField
        size="small"
        placeholder="Type and press Enter to add"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        sx={{ ...fieldSx, minWidth: 280 }}
      />
    </Box>
  );
};

const HrProfileTab = ({
  profileForm,
  setProfileForm,
  saveProfileDetails,
  isSavingProfile,
  staff,
  basicInfoForm,
  setBasicInfoForm,
  saveBasicInfo,
  isSavingBasicInfo,
  departments = [],
}) => {
  const updateArray = (key) => ({
    add: (emptyRow) => setProfileForm((p) => ({ ...p, [key]: [...p[key], emptyRow] })),
    remove: (idx) => setProfileForm((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) })),
    change: (idx, field, value) =>
      setProfileForm((p) => ({
        ...p,
        [key]: p[key].map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
      })),
  });

  const qual = updateArray("qualifications");
  const dep = updateArray("dependents");
  const emc = updateArray("emergencyContacts");

  const updateAddress = (which, field, value) =>
    setProfileForm((p) => ({ ...p, [which]: { ...p[which], [field]: value } }));

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Basic Info
      </Typography>
      <Grid container spacing={2} mb={2} mt={0.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="First Name"
            value={basicInfoForm.firstName}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, firstName: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Last Name"
            value={basicInfoForm.lastName}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, lastName: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="Phone"
            value={basicInfoForm.phone}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, phone: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Date of Birth"
            InputLabelProps={{ shrink: true }}
            value={basicInfoForm.dob}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, dob: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            fullWidth
            label="Gender"
            value={basicInfoForm.gender}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, gender: e.target.value }))}
            sx={fieldSx}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="National ID / CNIC"
            value={basicInfoForm.nationalId}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, nationalId: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="Designation"
            value={basicInfoForm.designation}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, designation: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            fullWidth
            label="Department"
            value={basicInfoForm.departmentId}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, departmentId: e.target.value }))}
            sx={fieldSx}
          >
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
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Years of Experience"
            value={basicInfoForm.experienceYears}
            onChange={(e) =>
              setBasicInfoForm((p) => ({ ...p, experienceYears: parseInt(e.target.value, 10) || 0 }))
            }
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="date"
            label="Joining Date"
            InputLabelProps={{ shrink: true }}
            value={basicInfoForm.joiningDate}
            onChange={(e) => setBasicInfoForm((p) => ({ ...p, joiningDate: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        startIcon={<Save size={16} />}
        onClick={saveBasicInfo}
        disabled={isSavingBasicInfo}
        sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", px: 4, textTransform: "none", fontFamily: "'Montserrat', sans-serif", mb: 4 }}
      >
        {isSavingBasicInfo ? "Saving..." : "Save Basic Info"}
      </Button>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Identity
      </Typography>
      <Grid container spacing={2} mb={4} mt={0.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Passport Number"
            value={profileForm.passportNumber}
            onChange={(e) => setProfileForm((p) => ({ ...p, passportNumber: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            size="small"
            fullWidth
            label="Blood Group"
            value={profileForm.bloodGroup}
            onChange={(e) => setProfileForm((p) => ({ ...p, bloodGroup: e.target.value }))}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            fullWidth
            label="Marital Status"
            value={profileForm.maritalStatus}
            onChange={(e) => setProfileForm((p) => ({ ...p, maritalStatus: e.target.value }))}
            sx={fieldSx}
          >
            {MARITAL_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4} display="flex" alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                checked={profileForm.disabilityStatus?.hasDisability || false}
                onChange={(e) =>
                  setProfileForm((p) => ({
                    ...p,
                    disabilityStatus: { ...p.disabilityStatus, hasDisability: e.target.checked },
                  }))
                }
              />
            }
            label={<Typography fontSize={13} sx={sectionSx}>Disability / Accessibility Needs</Typography>}
          />
        </Grid>
        {profileForm.disabilityStatus?.hasDisability && (
          <Grid item xs={12} sm={4}>
            <TextField
              size="small"
              fullWidth
              label="Accommodation Details"
              value={profileForm.disabilityStatus?.details || ""}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, disabilityStatus: { ...p.disabilityStatus, details: e.target.value } }))
              }
              sx={fieldSx}
            />
          </Grid>
        )}
      </Grid>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Academic & Professional Credentials
      </Typography>
      <Grid container spacing={2} mb={3} mt={0.5}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            fullWidth
            label="Highest Degree Attained"
            value={profileForm.highestDegree || ""}
            onChange={(e) => setProfileForm((p) => ({ ...p, highestDegree: e.target.value }))}
            sx={fieldSx}
          >
            {HIGHEST_DEGREES.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Industry Experience (years)"
            value={profileForm.industryExperienceYears || 0}
            onChange={(e) => setProfileForm((p) => ({ ...p, industryExperienceYears: parseInt(e.target.value, 10) || 0 }))}
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1}>
        Teaching Specializations
      </Typography>
      <Box mb={3}>
        <TagInput
          value={profileForm.teachingSpecializations || []}
          onChange={(tags) => setProfileForm((p) => ({ ...p, teachingSpecializations: tags }))}
        />
      </Box>

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Research & Publications Profile
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="ORCID ID"
            value={profileForm.researchProfile?.orcidId || ""}
            onChange={(e) =>
              setProfileForm((p) => ({ ...p, researchProfile: { ...p.researchProfile, orcidId: e.target.value } }))
            }
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="Google Scholar Link"
            value={profileForm.researchProfile?.googleScholarUrl || ""}
            onChange={(e) =>
              setProfileForm((p) => ({ ...p, researchProfile: { ...p.researchProfile, googleScholarUrl: e.target.value } }))
            }
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            type="number"
            label="Recognized Publications"
            value={profileForm.researchProfile?.publicationsCount || 0}
            onChange={(e) =>
              setProfileForm((p) => ({
                ...p,
                researchProfile: { ...p.researchProfile, publicationsCount: parseInt(e.target.value, 10) || 0 },
              }))
            }
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <RepeatableSection
        title="Degree Details"
        rows={profileForm.qualifications}
        onAdd={qual.add}
        onRemove={qual.remove}
        onChange={qual.change}
        emptyRow={{ degree: "", institution: "", yearCompleted: "", specialization: "", cgpaOrDivision: "", isVerified: false }}
        columns={[
          { key: "degree", label: "Degree", xs: 2.5 },
          { key: "institution", label: "Institution", xs: 2.5 },
          { key: "yearCompleted", label: "Year", type: "number", xs: 1.5 },
          { key: "cgpaOrDivision", label: "CGPA/Division", xs: 2 },
          { key: "specialization", label: "Specialization", xs: 2 },
          { key: "isVerified", label: "Verified", type: "checkbox", xs: 1 },
        ]}
      />

      <RepeatableSection
        title="Dependents & Beneficiaries"
        rows={profileForm.dependents}
        onAdd={dep.add}
        onRemove={dep.remove}
        onChange={dep.change}
        emptyRow={{ name: "", relation: "spouse", dob: "", cnic: "", isBeneficiary: false }}
        columns={[
          { key: "name", label: "Name", xs: 3 },
          { key: "relation", label: "Relation", type: "select", options: ["spouse", "child", "other"], xs: 2 },
          { key: "dob", label: "Date of Birth", type: "date", xs: 3 },
          { key: "cnic", label: "CNIC", xs: 2 },
          { key: "isBeneficiary", label: "Beneficiary", type: "checkbox", xs: 1 },
        ]}
      />

      <RepeatableSection
        title="Emergency Contacts"
        rows={profileForm.emergencyContacts}
        onAdd={emc.add}
        onRemove={emc.remove}
        onChange={emc.change}
        emptyRow={{ name: "", relation: "", phone: "" }}
        columns={[
          { key: "name", label: "Name", xs: 4 },
          { key: "relation", label: "Relation", xs: 4 },
          { key: "phone", label: "Phone", xs: 3 },
        ]}
      />

      <Divider sx={{ mb: 3 }} />

      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Current Address
      </Typography>
      <Grid container spacing={2} mb={3} mt={0.5}>
        {["address", "city", "province", "country"].map((f) => (
          <Grid item xs={12} sm={3} key={f}>
            <TextField
              size="small"
              fullWidth
              label={f[0].toUpperCase() + f.slice(1)}
              value={profileForm.currentAddress?.[f] || ""}
              onChange={(e) => updateAddress("currentAddress", f, e.target.value)}
              sx={fieldSx}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx}>
        Permanent Address
      </Typography>
      <Grid container spacing={2} mb={3} mt={0.5}>
        {["address", "city", "province", "country"].map((f) => (
          <Grid item xs={12} sm={3} key={f}>
            <TextField
              size="small"
              fullWidth
              label={f[0].toUpperCase() + f.slice(1)}
              value={profileForm.permanentAddress?.[f] || ""}
              onChange={(e) => updateAddress("permanentAddress", f, e.target.value)}
              sx={fieldSx}
            />
          </Grid>
        ))}
      </Grid>

      {staff?.addressHistory?.length > 0 && (
        <Box mb={3}>
          <Typography variant="overline" fontWeight={800} color="#94a3b8" display="flex" alignItems="center" gap={0.5} sx={sectionSx}>
            <Clock size={14} /> Address History
          </Typography>
          {staff.addressHistory
            .slice()
            .reverse()
            .map((h, i) => (
              <Typography key={i} variant="body2" color="#64748b" sx={{ ...sectionSx, mt: 0.5 }}>
                {new Date(h.changedAt).toLocaleDateString()} — {[h.address, h.city, h.province, h.country].filter(Boolean).join(", ")}
              </Typography>
            ))}
        </Box>
      )}

      <Button
        variant="contained"
        startIcon={<Save size={16} />}
        onClick={saveProfileDetails}
        disabled={isSavingProfile}
        sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", px: 4, textTransform: "none", fontFamily: "'Montserrat', sans-serif" }}
      >
        {isSavingProfile ? "Saving..." : "Save Profile"}
      </Button>
    </Box>
  );
};

export default HrProfileTab;
