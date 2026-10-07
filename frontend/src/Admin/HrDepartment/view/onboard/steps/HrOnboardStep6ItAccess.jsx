import React from "react";
import { Box, Typography, TextField, Grid, Paper, Chip } from "@mui/material";
import { Laptop, Mail, ShieldCheck, Info } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontFamily: "'Montserrat', sans-serif" } };

const HrOnboardStep6ItAccess = ({ formData, update, officialEmailPreview, publicMode }) => {
  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <Laptop size={16} /> System Provisioning & IT Access
      </Typography>

      <Grid container spacing={2} mt={0.5} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Mail size={14} color="#2563eb" />
              <Typography fontSize={12} fontWeight={700} color="#64748b" sx={sectionSx}>
                Official University Email (auto-generated)
              </Typography>
            </Box>
            <Typography fontSize={15} fontWeight={700} color="#0f172a" sx={sectionSx}>
              {officialEmailPreview || "—"}
            </Typography>
            <Typography fontSize={11} color="#94a3b8" mt={0.5} sx={sectionSx}>
              Reference identity for the directory/ID card — the personal email above remains the portal login.
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <ShieldCheck size={14} color="#059669" />
              <Typography fontSize={12} fontWeight={700} color="#64748b" sx={sectionSx}>
                LMS / Teaching Access
              </Typography>
            </Box>
            <Chip
              size="small"
              label={formData.role === "teacher" ? "Instructor access will be granted" : "Not a teaching role — no LMS access granted"}
              sx={{
                fontWeight: 700,
                bgcolor: formData.role === "teacher" ? "#dcfce7" : "#f1f5f9",
                color: formData.role === "teacher" ? "#166534" : "#475569",
              }}
            />
            <Typography fontSize={11} color="#94a3b8" mt={1} sx={sectionSx}>
              Course/section assignment happens separately from Course Management once onboarded.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            size="small"
            fullWidth
            label="Biometric / RFID Card ID"
            placeholder="Card or machine ID for attendance tracking"
            value={formData.biometricId}
            onChange={(e) => update({ biometricId: e.target.value })}
            sx={fieldSx}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2, bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 2, display: "flex", gap: 1.5 }}>
        <Info size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <Typography fontSize={12.5} color="#92400e" sx={sectionSx}>
          Active Directory / network Wi-Fi credentials require a manual IT department request — this portal does not
          integrate with campus network infrastructure. {publicMode
            ? "IT will be notified once HR reviews and approves this application."
            : "If an IT contact is configured, they'll be emailed a provisioning notice automatically once onboarding completes."}
        </Typography>
      </Paper>
    </Box>
  );
};

export default HrOnboardStep6ItAccess;
