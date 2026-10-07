// src/shared/sharedCheckbox/container/CheckboxField.js
import React from "react";
import { Controller } from "react-hook-form";
import { Checkbox, FormControlLabel } from "@mui/material";

const CheckboxField = ({ name, control, label, errors, disabled }) => {
  return (
    <div className="w-full">
      <Controller
        name={name}
        control={control}
        defaultValue={false}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                disabled={disabled}
              />
            }
            label={label}
          />
        )}
      />
      <p className="text-red-600 text-[10px] text-start font-[800]">
        {errors[name]?.message}
      </p>
    </div>
  );
};

export default CheckboxField;
