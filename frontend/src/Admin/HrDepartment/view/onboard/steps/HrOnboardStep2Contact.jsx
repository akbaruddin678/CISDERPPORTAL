import React from "react";
import { Box, Typography, TextField, Grid, Checkbox, FormControlLabel, IconButton, Button, Divider } from "@mui/material";
import { Plus, Trash2, MapPin } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const AddressFields = ({ value, onChange }) => (
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, sm: 6 }}>
      <TextField size="small" fullWidth label="Address" value={value.address} onChange={(e) => onChange({ address: e.target.value })} sx={fieldSx} />
    </Grid>
    <Grid size={{ xs: 12, sm: 3 }}>
      <TextField size="small" fullWidth label="City" value={value.city} onChange={(e) => onChange({ city: e.target.value })} sx={fieldSx} />
    </Grid>
    <Grid size={{ xs: 12, sm: 3 }}>
      <TextField size="small" fullWidth label="Province" value={value.province} onChange={(e) => onChange({ province: e.target.value })} sx={fieldSx} />
    </Grid>
  </Grid>
);

const HrOnboardStep2Contact = ({ formData, update, updateNested, addArrayItem, removeArrayItem, updateArrayItem }) => {
  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <MapPin size={16} /> Contact & Emergency Information
      </Typography>

      <Grid container spacing={2} mt={0.5} mb={4}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            required
            size="small"
            fullWidth
            type="email"
            label="Personal Email Address"
            helperText="Used to send the welcome email and portal login credentials."
            value={formData.email}
            onChange={(e) => update({ email: e.target.value })}
            sx={fieldSx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField required size="small" fullWidth label="Mobile Number" value={formData.phone} onChange={(e) => update({ phone: e.target.value })} sx={fieldSx} />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
        Current / Mailing Address
      </Typography>
      <AddressFields value={formData.currentAddress} onChange={(patch) => updateNested("currentAddress", patch)} />

      <Box mt={2} mb={2}>
        <FormControlLabel
          control={<Checkbox checked={formData.sameAsCurrent} onChange={(e) => update({ sameAsCurrent: e.target.checked })} />}
          label={<Typography fontSize={13} sx={sectionSx}>Permanent address is the same as current address</Typography>}
        />
      </Box>

      {!formData.sameAsCurrent && (
        <>
          <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1.5}>
            Permanent Address
          </Typography>
          <AddressFields value={formData.permanentAddress} onChange={(patch) => updateNested("permanentAddress", patch)} />
        </>
      )}

      <Divider sx={{ my: 3 }} />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={800} sx={sectionSx}>
          Emergency Contact(s)
        </Typography>
        <Button
          size="small"
          startIcon={<Plus size={14} />}
          onClick={() => addArrayItem("emergencyContacts", { name: "", relation: "", phone: "" })}
          sx={{ textTransform: "none", fontWeight: 700, ...sectionSx }}
        >
          Add Contact
        </Button>
      </Box>
      {formData.emergencyContacts.length === 0 ? (
        <Typography variant="body2" color="#94a3b8" sx={sectionSx}>
          At least one emergency contact is recommended.
        </Typography>
      ) : (
        formData.emergencyContacts.map((c, idx) => (
          <Grid container spacing={1.5} key={idx} mb={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Name" value={c.name} onChange={(e) => updateArrayItem("emergencyContacts", idx, { name: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth label="Relationship" value={c.relation} onChange={(e) => updateArrayItem("emergencyContacts", idx, { relation: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField size="small" fullWidth label="Phone" value={c.phone} onChange={(e) => updateArrayItem("emergencyContacts", idx, { phone: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid size="auto">
              <IconButton size="small" color="error" onClick={() => removeArrayItem("emergencyContacts", idx)}>
                <Trash2 size={16} />
              </IconButton>
            </Grid>
          </Grid>
        ))
      )}
    </Box>
  );
};

export default HrOnboardStep2Contact;
