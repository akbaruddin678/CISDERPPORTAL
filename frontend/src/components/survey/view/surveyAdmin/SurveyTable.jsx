import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Box,
  Typography
} from "@mui/material";
import { Visibility, Delete, PlayArrow, Pause, Edit, Preview } from "@mui/icons-material";

const SurveyTable = ({ surveys, onToggle, onDelete, onViewReports, onView, onEdit }) => {


  if (!surveys || surveys.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No surveys found. Create your first survey to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 650 }} aria-label="surveys table">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'action.hover' }}>
            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Responses</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Departments</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {surveys.map((survey) => (
            <TableRow
              key={survey.id}
              sx={{ 
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                {survey.title}
              </TableCell>
              <TableCell>
                <Chip
                  label={survey.isActive ? "Active" : "Inactive"}
                  color={survey.isActive ? "success" : "default"}
                  variant={survey.isActive ? "filled" : "outlined"}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={survey.responses?.length || 0}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </TableCell>
              <TableCell>
                {new Date(survey.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {survey.departments?.join(', ') || 'All'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    color={survey.isActive ? "error" : "success"}
                    startIcon={survey.isActive ? <Pause /> : <PlayArrow />}
                    onClick={() => onToggle(survey.id)}
                    size="small"
                    sx={{ textTransform: "none", minWidth: 120 }}
                  >
                    {survey.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <IconButton
                    color="info"
                    onClick={() => onView(survey)}
                    size="small"
                    title="View Survey Details"
                  >
                    <Preview />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => onEdit(survey)}
                    size="small"
                    title="Edit Survey"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => onDelete(survey.id)}
                    size="small"
                    title="Delete Survey"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SurveyTable;