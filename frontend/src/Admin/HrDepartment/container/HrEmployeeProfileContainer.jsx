import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";
import HrEmployeeProfileView from "../view/profile/HrEmployeeProfileView";
import { useHrEmployeeProfileController } from "../controller/useHrEmployeeProfileController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrEmployeeProfileContainer = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const user = getUserProfile();
  const roles = user?.roles || [];

  const isAuthorized = roles.includes("hr") || roles.includes("admin");
  const controller = useHrEmployeeProfileController(staffId);

  if (!user) {
    return (
      <HrModuleFrame title="Employee profile"><Box p={10} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress />
        <Typography color="text.secondary">Verifying session...</Typography>
      </Box></HrModuleFrame>
    );
  }

  if (!isAuthorized) {
    return (
      <HrModuleFrame title="Employee profile"><Box p={4} display="flex" justifyContent="center">
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3, maxWidth: 500 }}>
          <ShieldAlert size={64} color="#ef4444" style={{ margin: "0 auto 16px" }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Access Restricted
          </Typography>
          <Typography color="text.secondary">
            The Employee Profile is restricted to HR and Admins.
          </Typography>
        </Paper>
      </Box></HrModuleFrame>
    );
  }

  return <HrModuleFrame title="Employee profile"><HrEmployeeProfileView {...controller} onBack={() => navigate("/hr/employees")} /></HrModuleFrame>;
};

export default HrEmployeeProfileContainer;
