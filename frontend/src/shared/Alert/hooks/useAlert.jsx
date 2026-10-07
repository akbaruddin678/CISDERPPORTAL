import { useState, useCallback } from "react";
import { Alert, Snackbar } from "@mui/material";

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    open: false,
    message: "",
    severity: "info", // "info" | "success" | "warning" | "error"
    duration: 3000,
  });

  const openAlert = useCallback(({ message, severity = "info", duration = 3000 }) => {
    setAlertState({
      open: true,
      message,
      severity,
      duration,
    });
  }, []);

  const closeAlert = () => {
    setAlertState({
      open: false,
      message: "",
      severity: "info",
      duration: 3000,
    });
  };

  const AlertComponent = () => (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }} // top center position
      open={alertState.open}
      autoHideDuration={alertState.duration}
      onClose={closeAlert}
    >
      <Alert
        onClose={closeAlert}
        severity={alertState.severity}
        variant="filled"
        sx={{
          width: "100%",
          // bgcolor: "blue",
          color: "white",
        }}
      >
        {alertState.message}
      </Alert>
    </Snackbar>
  );

  return {
    openAlert,
    AlertComponent,
  };
};
