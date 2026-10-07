import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";
import HrEmployeesView from "../view/HrEmployeesView";
import useHrEmployeesController from "../controller/useHrEmployeesController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrEmployeesContainer = () => {
  const user = getUserProfile();
  const roles = user?.roles || [];
  const { moduleKey } = useParams();

  const isAuthorized = roles.includes("hr") || roles.includes("admin");
  const controller = useHrEmployeesController(moduleKey);
  const frameTitle = controller.lockedModule?.label || "Staff directory";

  if (!user) {
    return (
      <HrModuleFrame title={frameTitle}><Box
        p={10}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Verifying session...</Typography>
      </Box></HrModuleFrame>
    );
  }

  if (!isAuthorized) {
    return (
      <HrModuleFrame title={frameTitle}><Box p={4} display="flex" justifyContent="center">
        <Paper
          sx={{ p: 5, textAlign: "center", borderRadius: 3, maxWidth: 500 }}
        >
          <ShieldAlert
            size={64}
            color="#ef4444"
            style={{ margin: "0 auto 16px" }}
          />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Access Restricted
          </Typography>
          <Typography color="text.secondary">
            The Staff Directory is restricted to HR and Admins.
          </Typography>
        </Paper>
      </Box></HrModuleFrame>
    );
  }

  return <HrModuleFrame title={frameTitle}><HrEmployeesView {...controller} /></HrModuleFrame>;
};

export default HrEmployeesContainer;
