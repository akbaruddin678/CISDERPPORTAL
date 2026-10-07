import React from "react";
import { Box, Typography, Checkbox, FormControlLabel, Button, Divider, Paper, Grid, TextField } from "@mui/material";
import { Save, ClipboardCheck, Mail, Fingerprint } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };

const CHECKLIST_ITEMS = [
  ["idCardIssued", "ID Card Printed and Issued"],
  ["handbookProvided", "Faculty Handbook Provided"],
  ["laptopAllocated", "Laptop / Workstation Allocated"],
  ["workspaceAssigned", "Office Space / Cubicle Assigned"],
  ["orientationCompleted", "Campus Tour & Orientation Completed"],
];

// The HR task tracker for physical/logistical onboarding steps (mirrors
// the exit-clearance checklist pattern already used for offboarding),
// plus a read-only view of the System Provisioning reference fields
// collected during onboarding.
const HrOnboardingChecklistTab = ({
  staff,
  checklistForm,
  setChecklistForm,
  saveChecklist,
  isSavingChecklist,
  biometricIdInput,
  setBiometricIdInput,
  saveBiometricId,
  isSavingBiometricId,
}) => {
  const toggle = (key) => setChecklistForm((p) => ({ ...p, [key]: !p[key] }));
  const completedCount = CHECKLIST_ITEMS.filter(([key]) => checklistForm[key]).length;

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <ClipboardCheck size={16} /> System Provisioning (Reference)
      </Typography>
      <Grid container spacing={2} mt={0.5} mb={4}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Mail size={14} color="#2563eb" />
              <Typography fontSize={12} fontWeight={700} color="#64748b" sx={sectionSx}>
                Official University Email
              </Typography>
            </Box>
            <Typography fontSize={14} fontWeight={700} color="#0f172a" sx={sectionSx}>
              {staff?.officialEmail || "Not generated"}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Fingerprint size={14} color="#2563eb" />
              <Typography fontSize={12} fontWeight={700} color="#64748b" sx={sectionSx}>
                Biometric ID — used to match device/kiosk attendance punches
              </Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                placeholder="e.g. device card/PIN number"
                value={biometricIdInput}
                onChange={(e) => setBiometricIdInput(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "#fff", ...sectionSx } }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={saveBiometricId}
                disabled={isSavingBiometricId || biometricIdInput.trim() === (staff?.biometricId || "")}
                sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 1.5, boxShadow: "none", textTransform: "none", whiteSpace: "nowrap", ...sectionSx }}
              >
                {isSavingBiometricId ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={800} sx={sectionSx}>
          HR Onboarding Checklist
        </Typography>
        <Typography fontSize={12} fontWeight={700} color={completedCount === CHECKLIST_ITEMS.length ? "#059669" : "#94a3b8"} sx={sectionSx}>
          {completedCount} / {CHECKLIST_ITEMS.length} complete
        </Typography>
      </Box>
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={0.5} mb={4}>
        {CHECKLIST_ITEMS.map(([key, label]) => (
          <FormControlLabel
            key={key}
            control={<Checkbox checked={!!checklistForm[key]} onChange={() => toggle(key)} />}
            label={<Typography fontSize={13} sx={sectionSx}>{label}</Typography>}
          />
        ))}
      </Box>

      <Button
        variant="contained"
        startIcon={<Save size={16} />}
        onClick={saveChecklist}
        disabled={isSavingChecklist}
        sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", px: 4, textTransform: "none", ...sectionSx }}
      >
        {isSavingChecklist ? "Saving..." : "Save Checklist"}
      </Button>
    </Box>
  );
};

export default HrOnboardingChecklistTab;
