// src/components/shared/RadioField/UI/RadioField.jsx
import React from "react";
import { Controller } from "react-hook-form";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

const RadioField = ({ name, control, label, options = [], errors }) => {
  return (
    <div className="w-full">
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <FormControl component="fieldset">
            <FormLabel component="legend" className="mb-2">
              {label}
            </FormLabel>
            <RadioGroup {...field} row>
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
      />
      <p className="text-red-600 text-[10px] text-start font-[800]">
        {errors[name]?.message}
      </p>
    </div>
  );
};

export default RadioField;
