import React from "react";
import { Box, Typography, Paper, Stepper, Step, StepLabel, Button, Fade, CircularProgress } from "@mui/material";
import { CheckCircle2, ArrowLeft, ArrowRight, UserCheck } from "lucide-react";
import { ONBOARD_STEPS } from "../controller/useHrOnboardController";
import HrOnboardStep1Identity from "./onboard/steps/HrOnboardStep1Identity";
import HrOnboardStep2Contact from "./onboard/steps/HrOnboardStep2Contact";
import HrOnboardStep3Academic from "./onboard/steps/HrOnboardStep3Academic";
import HrOnboardStep4Employment from "./onboard/steps/HrOnboardStep4Employment";
import HrOnboardStep5Payroll from "./onboard/steps/HrOnboardStep5Payroll";
import HrOnboardStep6ItAccess from "./onboard/steps/HrOnboardStep6ItAccess";
import HrOnboardStep7Documents from "./onboard/steps/HrOnboardStep7Documents";
import HrOnboardStep8Review from "./onboard/steps/HrOnboardStep8Review";

const STEP_COMPONENTS = [
  HrOnboardStep1Identity,
  HrOnboardStep2Contact,
  HrOnboardStep3Academic,
  HrOnboardStep4Employment,
  HrOnboardStep5Payroll,
  HrOnboardStep6ItAccess,
  HrOnboardStep7Documents,
  HrOnboardStep8Review,
];

const fontSx = { fontFamily: "'Montserrat', sans-serif" };

// New Employee Onboarding Wizard — the single, correctly-named creation
// path for new staff/faculty (Staff Directory only views/manages existing
// employees; see useHrEmployeesController.js). Matches the rest of the HR
// module's MUI visual language (Montserrat/Aleo, #2563eb accent, white
// rounded cards) instead of the old Tailwind-styled single-page form.
const HrOnboardView = (controller) => {
  const { activeStep, setActiveStep, goNext, goBack, canAdvance, stepValidity, isLoading, completed, resetWizard, goToNewProfile } =
    controller;

  if (completed) {
    return (
      <Fade in timeout={500}>
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Paper elevation={0} sx={{ p: 6, maxWidth: 480, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 4, bgcolor: "#fff" }}>
            <CheckCircle2 size={56} color="#059669" style={{ marginBottom: 16 }} />
            <Typography variant="h5" fontWeight={800} color="#0f172a" mb={1} sx={{ fontFamily: "'Aleo', serif" }}>
              Onboarding Complete
            </Typography>
            <Typography variant="body2" color="#64748b" mb={4} sx={fontSx}>
              The new employee has been created, a welcome email with a secure password-setup link has been sent,
              and the relevant department/IT notifications have gone out.
            </Typography>
            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={resetWizard}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, ...fontSx }}
              >
                Onboard Another
              </Button>
              <Button
                variant="contained"
                startIcon={<UserCheck size={16} />}
                onClick={goToNewProfile}
                sx={{ bgcolor: "#2563eb", textTransform: "none", fontWeight: 700, borderRadius: 2, boxShadow: "none", ...fontSx }}
              >
                View Employee Profile
              </Button>
            </Box>
          </Paper>
        </Box>
      </Fade>
    );
  }

  const StepComponent = STEP_COMPONENTS[activeStep];
  const isLastStep = activeStep === ONBOARD_STEPS.length - 1;

  return (
    <Fade in timeout={500}>
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ fontFamily: "'Aleo', serif" }}>
            New Employee Onboarding
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.5} sx={fontSx}>
            Register a new staff or faculty member — identity, contract, payroll, IT access, and documents in one guided flow.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3, bgcolor: "#fff" }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {ONBOARD_STEPS.map((label, idx) => (
              <Step key={label} completed={idx < activeStep && stepValidity[idx]}>
                <StepLabel
                  onClick={() => setActiveStep(idx)}
                  sx={{
                    cursor: idx <= activeStep || stepValidity.slice(0, idx).every(Boolean) ? "pointer" : "default",
                    "& .MuiStepLabel-label": { fontWeight: 700, fontSize: 12, ...fontSx },
                    "& .MuiStepIcon-root.Mui-active": { color: "#2563eb" },
                    "& .MuiStepIcon-root.Mui-completed": { color: "#059669" },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, bgcolor: "#fff", overflow: "hidden" }}>
          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            <StepComponent {...controller} />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: { xs: 2.5, md: 4 },
              py: 2.5,
              borderTop: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <Button
              onClick={goBack}
              disabled={activeStep === 0}
              startIcon={<ArrowLeft size={16} />}
              sx={{ color: "#64748b", fontWeight: 700, textTransform: "none", ...fontSx }}
            >
              Back
            </Button>

            {isLastStep ? (
              <Button
                variant="contained"
                onClick={controller.handleSubmit}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={16} />}
                sx={{ bgcolor: "#059669", fontWeight: 700, borderRadius: 2, boxShadow: "none", px: 4, textTransform: "none", ...fontSx }}
              >
                {isLoading ? "Submitting..." : "Complete Onboarding"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={goNext}
                disabled={!canAdvance}
                endIcon={<ArrowRight size={16} />}
                sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", px: 4, textTransform: "none", ...fontSx }}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default HrOnboardView;
