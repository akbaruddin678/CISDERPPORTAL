import React, { useState, useCallback } from "react";
import { Box, CircularProgress, Alert, Container } from "@mui/material";
import useStudentPromotionController from "../controller/useStudentPromotionController";
import StudentPromotionView from "../view/StudentPromotionView";

const StudentPromotionContainer = () => {
  const [initError, setInitError] = useState(null);

  const controller = useStudentPromotionController();

  // Handle initialization errors gracefully
  const handleRetry = useCallback(() => {
    setInitError(null);
    // Optionally trigger data refresh
    window.location.reload();
  }, []);

  // Prevent rendering if catalog data is not loaded
  if (!controller.catalogData || !controller.catalogData.departments) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#f5f7fa",
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={50} sx={{ mb: 2 }} />
            <Box sx={{ typography: "h6", color: "text.secondary" }}>
              Loading catalog data...
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  if (initError) {
    return (
      <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", p: 3 }}>
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ mt: 4 }}>
            {initError}
          </Alert>
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button onClick={handleRetry} variant="contained">
              Try Again
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <ErrorBoundary onError={setInitError}>
      <StudentPromotionView {...controller} />
    </ErrorBoundary>
  );
};

/**
 * Error Boundary Component
 * Catches and displays rendering errors gracefully
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("StudentPromotion Error:", error, errorInfo);
    this.props.onError?.(error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", p: 3 }}>
          <Container maxWidth="sm">
            <Alert severity="error" sx={{ mt: 4 }}>
              Something went wrong. Please refresh the page and try again.
            </Alert>
           
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default StudentPromotionContainer;
