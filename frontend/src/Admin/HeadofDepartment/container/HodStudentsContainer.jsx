import React from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { ShieldAlert } from "lucide-react";
import { getUserProfile } from "../../teacher/services/getAuthToken";
import HodStudentsView from "../view/HodStudentsView";
import useHodStudentsController from "../controller/useHodStudentsController";

const HodStudentsContainer = () => {
  const user = getUserProfile();
  const roles = user?.roles || [];
  const isAuthorized =
    roles.includes("hod") ||
    roles.includes("admin") ||
    roles.includes("vc") ||
    roles.includes("vice_vc");

  // The department itself is resolved server-side from the HOD's staff
  // profile — if it isn't linked, the API answers with a clear message that
  // the view shows in place of the program tabs.
  const controller = useHodStudentsController();

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
            Only the Head of Department, Vice Chancellor's office, or System Admin can view this student directory.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const isVc = roles.includes("vc") || roles.includes("vice_vc");
  return (
    <HodStudentsView
      {...controller}
      {...(isVc ? { minimalHeader: true } : {})}
    />
  );
};

export default HodStudentsContainer;
