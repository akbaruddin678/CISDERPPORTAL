// components/shared/BackButton.jsx
import { IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <IconButton
      onClick={() => navigate(-1)}
      size="large"
      sx={{
        position: "absolute",
        left: 16,
        top: 16,
        color: "primary.main",
        bgcolor: "background.paper",
        boxShadow: 1,
        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      <ArrowBackIcon />
    </IconButton>
  );
};
