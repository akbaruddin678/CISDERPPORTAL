import React from "react";
import { Box, Typography, Avatar, Paper, Tabs, Tab, CircularProgress, Button, Chip } from "@mui/material";
import { ArrowLeft, User, FileText, Briefcase, Wallet, ClipboardCheck } from "lucide-react";
import HrProfileTab from "./HrProfileTab";
import HrContractTab from "./HrContractTab";
import HrDocumentsTab from "./HrDocumentsTab";
import HrPayrollTab from "./HrPayrollTab";
import HrOnboardingChecklistTab from "./HrOnboardingChecklistTab";

const getInitials = (name) =>
  name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : "EM";

// Employee Profile — the 360° view: Profile (identity, qualifications,
// dependents, emergency contacts, addresses), Contract & Roles
// (employment type, probation, tenure, concurrent role assignments),
// Documents (the Document Vault). Replaces the old Staff Directory
// Drawer's cramped "quick view" role with one dedicated, correctly-named
// page per the spec's own vocabulary.
const HrEmployeeProfileView = ({ staff, isLoading, onBack, ...tabProps }) => {
  const { activeTab, setActiveTab } = tabProps;

  if (isLoading) {
    return (
      <Box py={12} textAlign="center">
        <CircularProgress size={32} sx={{ color: "#2563eb" }} />
      </Box>
    );
  }

  if (!staff) {
    return (
      <Box py={12} textAlign="center" color="#94a3b8">
        <Typography sx={{ fontFamily: "'Montserrat', sans-serif" }}>
          Employee not found.
        </Typography>
        <Button onClick={onBack} sx={{ mt: 2, textTransform: "none" }}>
          Back to Directory
        </Button>
      </Box>
    );
  }

  const name = staff.personalInfo?.name || "Unknown";
  const status = staff.userId?.status || "active";

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Button
        onClick={onBack}
        startIcon={<ArrowLeft size={16} />}
        sx={{ mb: 2, color: "#64748b", fontWeight: 700, textTransform: "none", fontFamily: "'Montserrat', sans-serif" }}
      >
        Back to Directory
      </Button>

      <Paper
        elevation={0}
        sx={{ p: 4, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3, bgcolor: "#1e293b", color: "white", display: "flex", alignItems: "center", gap: 3 }}
      >
        <Avatar sx={{ width: 72, height: 72, fontSize: 26, bgcolor: "#3b82f6", color: "white", fontWeight: 800 }}>
          {getInitials(name)}
        </Avatar>
        <Box flexGrow={1}>
          <Typography variant="h5" fontWeight={800} sx={{ fontFamily: "'Aleo', serif" }}>
            {name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            {staff.designation || "Staff"} • {staff.departmentId?.name || "Administrative Support"} • {staff.employeeId}
          </Typography>
          <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
            <Chip size="small" label={staff.employeeId} sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, fontSize: 11 }} />
            <Chip
              size="small"
              label={status.toUpperCase()}
              sx={{ bgcolor: status === "active" ? "#059669" : "#dc2626", color: "#fff", fontWeight: 700, fontSize: 11 }}
            />
            <Chip size="small" label={staff.employmentType || "Full-Time"} sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700, fontSize: 11 }} />
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden", bgcolor: "#ffffff" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            borderBottom: "1px solid #e2e8f0",
            "& .MuiTab-root": { fontFamily: "'Montserrat', sans-serif", fontWeight: 700, textTransform: "none" },
          }}
        >
          <Tab value="profile" label="Profile" icon={<User size={16} />} iconPosition="start" />
          <Tab value="contract" label="Contract & Roles" icon={<Briefcase size={16} />} iconPosition="start" />
          <Tab value="payroll" label="Payroll & Employment" icon={<Wallet size={16} />} iconPosition="start" />
          <Tab value="documents" label="Documents" icon={<FileText size={16} />} iconPosition="start" />
          <Tab value="checklist" label="Onboarding Checklist" icon={<ClipboardCheck size={16} />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === "profile" && <HrProfileTab staff={staff} {...tabProps} />}
          {activeTab === "contract" && <HrContractTab staff={staff} {...tabProps} />}
          {activeTab === "payroll" && <HrPayrollTab staff={staff} {...tabProps} />}
          {activeTab === "documents" && <HrDocumentsTab staff={staff} {...tabProps} />}
          {activeTab === "checklist" && <HrOnboardingChecklistTab staff={staff} {...tabProps} />}
        </Box>
      </Paper>
    </Box>
  );
};

export default HrEmployeeProfileView;
