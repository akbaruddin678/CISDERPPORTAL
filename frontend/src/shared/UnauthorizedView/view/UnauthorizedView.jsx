// view/UnauthorizedView.jsx
import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const UnauthorizedView = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-lg text-gray-700 mb-6">
        You don’t have permission to view this page.
      </p>
      <Button
        variant="contained"
        color="primary"
        size="medium"
        onClick={() => navigate("/")}
        sx={{ textTransform: "none", paddingX: 3 }}
      >
        Go to Home
      </Button>
    </div>
  );
};

export default UnauthorizedView;
