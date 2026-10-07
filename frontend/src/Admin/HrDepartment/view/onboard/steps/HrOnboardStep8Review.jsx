import React from "react";
import { Box, Typography, Grid, Paper, Checkbox, FormControlLabel, Divider, Chip } from "@mui/material";
import { ClipboardCheck } from "lucide-react";

const sectionSx = { fontFamily: "'Montserrat', sans-serif" };

const SummaryRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" py={0.5}>
    <Typography fontSize={12.5} color="#64748b" sx={sectionSx}>
      {label}
    </Typography>
    <Typography fontSize={12.5} fontWeight={700} color="#0f172a" sx={sectionSx} textAlign="right">
      {value || "—"}
    </Typography>
  </Box>
);

const SummaryCard = ({ title, children }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc", height: "100%" }}>
      <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing={0.5} sx={sectionSx} mb={1}>
        {title}
      </Typography>
      {children}
    </Paper>
  </Grid>
);

const CHECKLIST_ITEMS = [
  ["idCardIssued", "ID Card Printed and Issued"],
  ["handbookProvided", "Faculty Handbook Provided"],
  ["laptopAllocated", "Laptop / Workstation Allocated"],
  ["workspaceAssigned", "Office Space / Cubicle Assigned"],
  ["orientationCompleted", "Campus Tour & Orientation Completed"],
];

const HrOnboardStep8Review = ({ formData, updateNested, departments, pendingDocuments, officialEmailPreview, publicMode }) => {
  const deptName = departments.find((d) => d._id === formData.departmentId)?.name;

  return (
    <Box>
      <Typography variant="overline" fontWeight={800} color="#94a3b8" sx={sectionSx} display="flex" alignItems="center" gap={1}>
        <ClipboardCheck size={16} /> Review & {publicMode ? "Submit" : "Complete"}
      </Typography>
      <Typography variant="body2" color="#64748b" sx={sectionSx} mt={0.5} mb={3}>
        {publicMode
          ? "Confirm the details below, then submit your application for HR review. Nothing is created until HR approves it."
          : "Confirm the details below, then use \"Complete Onboarding\" to create the account, send the welcome email, and notify the department/IT as applicable."}
      </Typography>

      <Grid container spacing={2} mb={3}>
        <SummaryCard title="Identity">
          <SummaryRow label="Name" value={[formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ")} />
          <SummaryRow label="CNIC / Passport" value={formData.nationalId || formData.passportNumber} />
          <SummaryRow label="Blood Group" value={formData.bloodGroup} />
        </SummaryCard>
        <SummaryCard title="Contact">
          <SummaryRow label="Email" value={formData.email} />
          <SummaryRow label="Phone" value={formData.phone} />
          <SummaryRow label="Emergency Contacts" value={String(formData.emergencyContacts.length)} />
        </SummaryCard>
        <SummaryCard title="Employment">
          <SummaryRow label="Designation" value={formData.designation} />
          <SummaryRow label="Department" value={deptName} />
          <SummaryRow label="Employment Type" value={formData.employmentType} />
          <SummaryRow label="Joining Date" value={formData.dateOfJoining} />
        </SummaryCard>
        <SummaryCard title={publicMode ? "IT & Documents" : "Payroll & IT"}>
          {!publicMode && (
            <SummaryRow label="Basic Salary" value={formData.basicSalary ? `PKR ${formData.basicSalary}` : "Not set up"} />
          )}
          <SummaryRow label="Official Email" value={officialEmailPreview} />
          <SummaryRow label="Documents Attached" value={String(pendingDocuments.length)} />
        </SummaryCard>
      </Grid>

      {!publicMode && (
        <>
          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" fontWeight={800} sx={sectionSx} mb={1}>
            HR Onboarding Checklist
          </Typography>
          <Typography fontSize={12} color="#94a3b8" sx={sectionSx} mb={1.5}>
            Optional — tick anything already done; the rest can be tracked later from the employee's Profile page.
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={0.5}>
            {CHECKLIST_ITEMS.map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={formData.onboardingChecklist[key]}
                    onChange={(e) => updateNested("onboardingChecklist", { [key]: e.target.checked })}
                  />
                }
                label={<Typography fontSize={13} sx={sectionSx}>{label}</Typography>}
              />
            ))}
          </Box>
        </>
      )}

      <Box mt={3}>
        <Chip
          label={
            publicMode
              ? "On submit: your application is sent to HR for review — no account is created yet"
              : "On submit: welcome email sent · IT & HOD notified · payroll record synced"
          }
          sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 12, height: "auto", py: 1, px: 0.5, ...sectionSx }}
        />
      </Box>
    </Box>
  );
};

export default HrOnboardStep8Review;
