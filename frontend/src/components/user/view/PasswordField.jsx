import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { InputAdornment, IconButton } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { MuiTextField } from "../../../shared/shared/InputField/style/muiTextField";

const PasswordField = ({ name, control, label, errors }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="w-full">
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <MuiTextField
            fullWidth
            {...field}
            label={label}
            size="small"
            type={visible ? "text" : "password"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setVisible((v) => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                    aria-label={visible ? "Hide password" : "Show password"}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      />
      <p className="text-red-600 text-[10px] text-start font-[800]">
        {errors?.[name]?.message}
      </p>
    </div>
  );
};

export default PasswordField;
