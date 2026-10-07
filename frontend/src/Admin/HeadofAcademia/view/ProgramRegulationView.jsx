import React from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ShieldCheck, Lock, Save } from "lucide-react";

const ProgramRegulationView = ({
  programs,
  programId,
  setProgramId,
  terms,
  admissionTermId,
  setAdmissionTermId,
  fields,
  form,
  setField,
  existing,
  isLoading,
  isLocked,
  canEdit,
  isSaving,
  isLocking,
  save,
  lock,
}) => (
  <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc" }}>
    <Box display="flex" alignItems="center" gap={2} mb={4}>
      <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: "#ede9fe", color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ShieldCheck size={22} />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800} color="#0f172a">
          Program Regulations
        </Typography>
        <Typography variant="body2" color="#64748b">
          Credit-hour limits and degree duration, set per Program and admission batch.
        </Typography>
      </Box>
    </Box>

    <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            size="small"
            label="Program"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <MenuItem value="">Select a program…</MenuItem>
            {programs.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            size="small"
            label="Batch (admission session)"
            value={admissionTermId}
            onChange={(e) => setAdmissionTermId(e.target.value)}
          >
            <MenuItem value="">Select a batch…</MenuItem>
            {terms.map((t) => (
              <MenuItem key={t._id} value={t._id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Paper>

    {!programId || !admissionTermId ? (
      <Alert severity="info">Pick a program and a batch to view or set its regulations.</Alert>
    ) : isLoading ? (
      <Box py={6} textAlign="center">
        <CircularProgress size={28} />
      </Box>
    ) : (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1" fontWeight={800}>
            {existing ? "Editing existing regulations" : "No regulations set yet for this batch"}
          </Typography>
          {isLocked && (
            <Chip
              icon={<Lock size={13} />}
              label={`Locked${existing?.lockedByName ? ` by ${existing.lockedByName}` : ""}`}
              size="small"
              sx={{ bgcolor: "#fef2f2", color: "#991b1b", fontWeight: 700 }}
            />
          )}
        </Box>

        {isLocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This batch rulebook is permanently locked. Create regulations for a new admission batch when policy changes.
          </Alert>
        )}

        <Grid container spacing={2}>
          {fields.map((f) => (
            <Grid item xs={12} sm={6} key={f.key}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={f.label}
                value={form[f.key]}
                disabled={!canEdit}
                onChange={(e) => setField(f.key, e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
          ))}
        </Grid>

        <Box display="flex" gap={1.5} mt={3}>
          <Button
            variant="contained"
            startIcon={<Save size={15} />}
            disabled={!canEdit || isSaving}
            onClick={save}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
          {existing && !isLocked && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Lock size={15} />}
              disabled={isLocking}
              onClick={lock}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {isLocking ? "Locking…" : "Lock"}
            </Button>
          )}
        </Box>
      </Paper>
    )}
  </Box>
);

export default ProgramRegulationView;
