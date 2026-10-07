import React from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";
import MonitorFacultyView from "../view/MonitorFacultyView";
import useMonitorFacultyController from "../controller/useMonitorFacultyController";

const MonitorCourses = () => {
  const user = getUserProfile();
  const roles = user?.roles || [];

  const isAuthorized = roles.includes("hod") || roles.includes("admin");
  const userRole = roles.includes("admin") ? "admin" : "hod";
  const departmentId = user?.departmentId || user?.staffProfile?.departmentId || null;

  const controller = useMonitorFacultyController({ userDepartmentId: departmentId });

  if (!user) {
    return (
      <Box p={10} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress />
        <Typography color="text.secondary">Verifying session...</Typography>
      </Box>
    );
  }

  if (!isAuthorized) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3, maxWidth: 500 }}>
          <ShieldAlert size={64} color="#ef4444" style={{ margin: "0 auto 16px" }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>Access Denied</Typography>
          <Typography color="text.secondary">
            Only the Head of Department or System Admin can monitor faculty and courses.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (userRole === "hod" && !departmentId) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3, maxWidth: 500 }}>
          <ShieldAlert size={64} color="#f59e0b" style={{ margin: "0 auto 16px" }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>Missing Class ID</Typography>
          <Typography color="text.secondary">
            Your profile is not linked to a specific class. Please contact HR to update your record.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return <MonitorFacultyView {...controller} />;
};

export default MonitorCourses;
