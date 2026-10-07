import React from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";

// Reuse the highly scalable View
import HodCourseManagementView from "../../HeadofDepartment/view/HodCourseManagementView";
import useCourseCatalogListController from "../../HeadofDepartment/controller/useCourseCatalogListController";

const VcCourseManagementContainer = () => {
  const user = getUserProfile();
  const roles = user?.roles || [];

  // Check for either 'vc' or 'vice_vc' as defined in your DB schema
  const isAuthorized =
    roles.includes("vc") ||
    roles.includes("vice_vc") ||
    roles.includes("admin");

  const controller = useCourseCatalogListController({ scope: "all" });

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
            This module is restricted to the Vice Chancellor.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <HodCourseManagementView
      {...controller}
      roleTitle="All Courses — Academic Oversight"
    />
  );
};

export default VcCourseManagementContainer;
