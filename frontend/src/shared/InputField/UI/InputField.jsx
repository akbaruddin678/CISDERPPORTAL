import React from "react";
import { Controller } from "react-hook-form";
import { TextField } from "@mui/material";
import { MuiTextField } from "../style/muiTextField";

const InputField = ({
  name,
  control,
  label,
  type,
  errors,
  rows = 1,
  multiline = false,
}) => {
  return (
    <div className="w-full, h-auto">
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <MuiTextField
            fullWidth
            multiline={multiline}
            rows={rows}
            {...field}
            label={label}
            size="small"
            type={type}
          />
        )}
      />
      <p className="text-red-600 text-[10px] text-start font-[800]">
        {errors[name]?.message}
      </p>
    </div>
  );
};

export default InputField;
