import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Fade,
  CircularProgress,
} from "@mui/material";
import { CheckCircle2, ArrowLeft, ArrowRight, Mail, ShieldCheck, GraduationCap } from "lucide-react";
import { ONBOARD_STEPS } from "../controller/useTeacherOnboardingController";
import HrOnboardStep1Identity from "../../Admin/HrDepartment/view/onboard/steps/HrOnboardStep1Identity";
import HrOnboardStep2Contact from "../../Admin/HrDepartment/view/onboard/steps/HrOnboardStep2Contact";
import HrOnboardStep3Academic from "../../Admin/HrDepartment/view/onboard/steps/HrOnboardStep3Academic";
import HrOnboardStep4Employment from "../../Admin/HrDepartment/view/onboard/steps/HrOnboardStep4Employment";
import HrOnboardStep7Documents from "../../Admin/HrDepartment/view/onboard/steps/HrOnboardStep7Documents";
import HrOnboardStep8Review from "../../Admin/HrDepartment/view/onboard/steps/HrOnboardStep8Review";

// IT Access (HrOnboardStep6ItAccess) is temporarily left out — see the
// comment on ONBOARD_STEPS in useTeacherOnboardingController.js for how to
// bring it back.
const STEP_COMPONENTS = [
  HrOnboardStep1Identity,
  HrOnboardStep2Contact,
  HrOnboardStep3Academic,
  HrOnboardStep4Employment,
  HrOnboardStep7Documents,
  HrOnboardStep8Review,
];

const fontSx = { fontFamily: "'Montserrat', sans-serif" };

// Defined at module scope, not inside the view function — a component
// declared inside another component's body gets a brand-new function
// identity on every render, so React treats it as a different component
// type and remounts its entire DOM subtree (destroying and recreating the
// <input> inside it) on every single keystroke, which is what was kicking
// focus out of the email field after each character typed.
const CenteredCard = ({ children }) => (
  <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Paper elevation={0} sx={{ p: { xs: 4, sm: 6 }, maxWidth: 440, width: "100%", textAlign: "center", border: "1px solid #e2e8f0", borderRadius: 4, bgcolor: "#fff" }}>
      {children}
    </Paper>
  </Box>
);

// Reuses the exact same 7 step components (minus Payroll) the internal HR
// "New Employee Onboarding" wizard uses (HrOnboardView.jsx), each rendered
// with publicMode passed through — same field set, same visual language
// (Montserrat, #2563eb accent, white rounded cards), single source of
// truth for what a staff profile actually contains.
const TeacherOnboardingView = (controller) => {
  const {
    otpStage,
    otpEmail,
    setOtpEmail,
    otpCode,
    setOtpCode,
    submitEmail,
    submitOtp,
    resendOtp,
    goBackToEmail,
    isSendingOtp,
    isVerifyingOtp,

    activeStep,
    setActiveStep,
    goNext,
    goBack,
    canAdvance,
    stepValidity,
    isLoading,
    completed,
    resetWizard,
  } = controller;

  if (completed) {
    return (
      <Fade in timeout={500}>
        <Box>
          <CenteredCard>
            <CheckCircle2 size={56} color="#059669" style={{ marginBottom: 16 }} />
            <Typography variant="h5" fontWeight={800} color="#0f172a" mb={1} sx={{ fontFamily: "'Aleo', serif" }}>
              Application Submitted
            </Typography>
            <Typography variant="body2" color="#64748b" mb={4} sx={fontSx}>
              Thank you — your details have been sent to HR for review. You'll be contacted once your ERP account is
              approved and set up.
            </Typography>
            <Button
              variant="outlined"
              onClick={resetWizard}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, ...fontSx }}
            >
              Submit Another
            </Button>
          </CenteredCard>
        </Box>
      </Fade>
    );
  }

  if (otpStage === "email") {
    return (
      <Fade in timeout={400}>
        <Box>
          <CenteredCard>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
              <GraduationCap size={26} color="#2563eb" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a" mb={0.5} sx={{ fontFamily: "'Aleo', serif" }}>
              Staff Self-Registration
            </Typography>
            <Typography variant="body2" color="#64748b" mb={4} sx={fontSx}>
              For existing university employees adding themselves to the ERP system. Enter your email to get started
              — we'll send a verification code first.
            </Typography>
            <form onSubmit={submitEmail}>
              <TextField
                fullWidth
                type="email"
                required
                size="small"
                label="Email Address"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, ...fontSx } }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSendingOtp}
                startIcon={isSendingOtp ? <CircularProgress size={16} color="inherit" /> : <Mail size={16} />}
                sx={{ bgcolor: "#2563eb", fontWeight: 700, borderRadius: 2, boxShadow: "none", py: 1.2, textTransform: "none", ...fontSx }}
              >
                {isSendingOtp ? "Sending code..." : "Send Verification Code"}
              </Button>
            </form>
          </CenteredCard>
        </Box>
      </Fade>
    );
  }

  if (otpStage === "otp") {
    return (
      <Fade in timeout={400}>
        <Box>
          <CenteredCard>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
              <ShieldCheck size={26} color="#059669" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a" mb={0.5} sx={{ fontFamily: "'Aleo', serif" }}>
              Enter Verification Code
            </Typography>
            <Typography variant="body2" color="#64748b" mb={4} sx={fontSx}>
              We sent a 6-digit code to <strong>{otpEmail}</strong>. It expires in 10 minutes.
            </Typography>
            <form onSubmit={submitOtp}>
              <TextField
                fullWidth
                required
                size="small"
                label="6-Digit Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputProps={{ inputMode: "numeric", style: { letterSpacing: 6, textAlign: "center", fontWeight: 700 } }}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, ...fontSx } }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isVerifyingOtp}
                startIcon={isVerifyingOtp ? <CircularProgress size={16} color="inherit" /> : <ShieldCheck size={16} />}
                sx={{ bgcolor: "#059669", fontWeight: 700, borderRadius: 2, boxShadow: "none", py: 1.2, mb: 1.5, textTransform: "none", ...fontSx }}
              >
                {isVerifyingOtp ? "Verifying..." : "Verify & Continue"}
              </Button>
            </form>
            <Box display="flex" justifyContent="space-between">
              <Button onClick={goBackToEmail} startIcon={<ArrowLeft size={14} />} sx={{ color: "#64748b", fontWeight: 700, textTransform: "none", fontSize: 12, ...fontSx }}>
                Change Email
              </Button>
              <Button onClick={resendOtp} sx={{ color: "#2563eb", fontWeight: 700, textTransform: "none", fontSize: 12, ...fontSx }}>
                Resend Code
              </Button>
            </Box>
          </CenteredCard>
        </Box>
      </Fade>
    );
  }

  // otpStage === "wizard"
  const StepComponent = STEP_COMPONENTS[activeStep];
  const isLastStep = activeStep === ONBOARD_STEPS.length - 1;

  return (
    <Fade in timeout={500}>
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
          <Box mb={4}>
            <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ fontFamily: "'Aleo', serif" }}>
              Staff Self-Registration
            </Typography>
            <Typography variant="body2" color="#64748b" mt={0.5} sx={fontSx}>
              Add your full profile to the ERP — HR will review it before your account is created.
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
              <StepComponent {...controller} publicMode />
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
                  {isLoading ? "Submitting..." : "Submit for Review"}
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
      </Box>
    </Fade>
  );
};

export default TeacherOnboardingView;
