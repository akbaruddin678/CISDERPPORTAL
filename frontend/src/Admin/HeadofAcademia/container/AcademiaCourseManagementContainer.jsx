import React from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";
import HodCourseManagementView from "../../HeadofDepartment/view/HodCourseManagementView";
import useCourseCatalogListController from "../../HeadofDepartment/controller/useCourseCatalogListController";

const AcademiaCourseManagementContainer = () => {
  const user = getUserProfile();
  const roles = user?.roles || [];

  const isAuthorized =
    roles.includes("head_of_academia") || roles.includes("admin");
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
            You must be the Head of Academia to browse university-wide
            courses.
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

export default AcademiaCourseManagementContainer;
