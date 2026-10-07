import React from "react";
import { Controller } from "react-hook-form";
import { FormControl, InputLabel, MenuItem } from "@mui/material";
import { MuiSelect } from "../style/muiSelect";

const SelectField = ({
  name,
  control,
  label,
  options = [],
  errors,
  onChange,
}) => {
  return (
    <div className="w-full">
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <FormControl fullWidth size="small" error={!!errors[name]}>
            <InputLabel>{label}</InputLabel>
            <MuiSelect
              {...field}
              label={label}
              onChange={(e) => {
                field.onChange(e);
                if (onChange) {
                  onChange(e);
                }
              }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        )}
      />
      {errors[name] && (
        <p className="text-red-600 text-[10px] text-start font-[800]">
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

export default SelectField;
