import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import { School } from "@mui/icons-material";

const AssignScholarshipModal = ({
  open,
  student,
  plans,
  isLoadingPlans,
  planId,
  setPlanId,
  onCancel,
  onConfirm,
  isAssigning,
}) => {
  const selectedPlan = plans.find((p) => p.id === planId);

  return (
    <Dialog open={open} onClose={() => !isAssigning && onCancel()} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <School color="primary" /> Assign Scholarship
      </DialogTitle>
      <DialogContent sx={{ minWidth: 380 }}>
        <DialogContentText sx={{ mb: 2 }}>
          Assigning a scholarship to <b>{student?.personalInfo?.fullName || student?.studentId}</b>. It's applied
          immediately and will automatically discount their fee once a challan is generated.
        </DialogContentText>

        <FormControl fullWidth size="small" sx={{ mb: selectedPlan ? 2 : 0 }}>
          <InputLabel id="scholarship-plan-label">Scholarship Plan</InputLabel>
          <Select
            labelId="scholarship-plan-label"
            label="Scholarship Plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={isLoadingPlans}
          >
            {isLoadingPlans ? (
              <MenuItem disabled value="">
                Loading plans…
              </MenuItem>
            ) : plans.length === 0 ? (
              <MenuItem disabled value="">
                No active scholarship plans available
              </MenuItem>
            ) : (
              plans.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {selectedPlan && (
          <Box sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography fontSize={13} fontWeight={700}>{selectedPlan.title}</Typography>
              <Chip
                size="small"
                label={selectedPlan.type === "fixed" ? `Rs. ${selectedPlan.maxAmount}` : `${selectedPlan.maxPercentage}%`}
                color="success"
                variant="outlined"
              />
            </Box>
            {selectedPlan.description && (
              <Typography fontSize={12} color="text.secondary">{selectedPlan.description}</Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={isAssigning} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isAssigning || !planId}
          disableElevation
          startIcon={isAssigning && <CircularProgress size={16} color="inherit" />}
          sx={{ borderRadius: 2 }}
        >
          Assign Scholarship
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignScholarshipModal;
