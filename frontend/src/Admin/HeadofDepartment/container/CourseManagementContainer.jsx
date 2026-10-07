import React from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";
import HodCourseManagementView from "../view/HodCourseManagementView";
import useCourseCatalogListController from "../controller/useCourseCatalogListController";

const HodCourseManagementContainer = () => {
  const user = getUserProfile();
  const roles = user?.roles || [];

  // Strict RBAC: Must have the HOD role
  const isAuthorized = roles.includes("hod");

  // CRITICAL: Safely extract the department ID.
  // If the backend populates the department, it will be an object with an _id.
  let rawDept = user?.departmentId || user?.staffProfile?.departmentId || null;
  const departmentId =
    typeof rawDept === "object" && rawDept !== null ? rawDept._id : rawDept;

  const controller = useCourseCatalogListController({
    scope: "own",
    departmentId,
  });

  if (!user) {
    return (
      <Box
        p={10}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Verifying session...</Typography>
      </Box>
    );
  }

  if (!isAuthorized) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Paper
          sx={{ p: 5, textAlign: "center", borderRadius: 3, maxWidth: 500 }}
        >
          <ShieldAlert
            size={64}
            color="#ef4444"
            style={{ margin: "0 auto 16px" }}
          />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Access Denied
          </Typography>
          <Typography color="text.secondary">
            You must have the "HOD" role to view your department's courses.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!departmentId) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Paper
          sx={{ p: 5, textAlign: "center", borderRadius: 3, maxWidth: 500 }}
        >
          <ShieldAlert
            size={64}
            color="#f59e0b"
            style={{ margin: "0 auto 16px" }}
          />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Missing Department ID
          </Typography>
          <Typography color="text.secondary">
            Your profile is not linked to a specific department. Please contact
            HR to link your HOD account to a department.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <HodCourseManagementView {...controller} roleTitle="Department Courses" />
  );
};

export default HodCourseManagementContainer;
