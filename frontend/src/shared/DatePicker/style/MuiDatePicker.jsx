// src/shared/shared/DatePickerField/style/muiDatePicker.js
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { lightBlue, blueGrey } from "@mui/material/colors";

export const MuiDatePicker = styled(DatePicker)(({ theme }) => ({
  ".MuiInputBase-root": {
    color: blueGrey[400],
    font: 200,
  },

  "& label": {
    color: blueGrey[400],
  },
  "& label.Mui-focused": {
    color: theme.palette.white,
  },

  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: blueGrey[400],
    },
    "&:hover fieldset": {
      borderColor: lightBlue[900],
    },
  },
}));
