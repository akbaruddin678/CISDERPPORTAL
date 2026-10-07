// src/components/shared/PasswordField.jsx
import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { MuiTextField } from "../../InputField/style/muiTextField";

const PasswordField = ({ name, control, label, errors }) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full h-auto">
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <MuiTextField
            {...field}
            fullWidth
            size="small"
            label={label}
            type={showPassword ? "text" : "password"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />
      <p className="text-red-600 text-[10px] text-start font-[800]">
        {errors[name]?.message}
      </p>
    </div>
  );
};

export default PasswordField;
