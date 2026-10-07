import React from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";

import RegistrarCourseManagementView from "../view/RegistrarCourseManagementView";
import useRegistrarCourseController from "../controller/useRegistrarCourseController";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const CourseCatalogueContainer = () => {
  const user = getUserProfile();
  const roles = user?.roles || [];

  const isAuthorized = roles.includes("registrar") || roles.includes("admin");
  const controller = useRegistrarCourseController();

  if (!user) {
    return (
      <RegistrarModuleFrame title="Course code assignment"><Box
        p={10}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Verifying session...</Typography>
      </Box></RegistrarModuleFrame>
    );
  }

  if (!isAuthorized) {
    return (
      <RegistrarModuleFrame title="Course code assignment"><Box p={4} display="flex" justifyContent="center">
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
            Only the University Registrar can assign official course codes and
            activate curriculums.
          </Typography>
        </Paper>
      </Box></RegistrarModuleFrame>
    );
  }

  return <RegistrarModuleFrame title="Course code assignment"><RegistrarCourseManagementView {...controller} /></RegistrarModuleFrame>;
};

export default CourseCatalogueContainer;
