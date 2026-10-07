// src/shared/shared/DatePickerField/UI/DatePickerField.jsx
import React from "react";
import { Controller } from "react-hook-form";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MuiDatePicker } from "../style/MuiDatePicker";

const DatePickerField = ({ name, control, label, errors }) => {
  return (
    <div className="w-full">
      <Controller
        name={name}
        control={control}
        defaultValue={null}
        render={({ field }) => (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MuiDatePicker
              label={label}
              value={field.value}
              onChange={(newValue) => field.onChange(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>
        )}
      />
      <p className="text-red-600 text-[10px] text-start font-[800]">
        {errors[name]?.message}
      </p>
    </div>
  );
};

export default DatePickerField;
