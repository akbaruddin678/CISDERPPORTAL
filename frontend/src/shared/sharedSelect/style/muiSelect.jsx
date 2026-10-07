import { Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import { lightBlue, blueGrey } from "@mui/material/colors";

export const MuiSelect = styled(Select)(({ theme }) => ({
  ".MuiSelect-select": {
    color: blueGrey[400],
    font: 200,
  },

  "& label": {
    color: blueGrey[400],
  },

  "& label.Mui-focused": {
    color: theme.palette.white,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: blueGrey[400],
  },

  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: lightBlue[900],
  },

  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
}));
