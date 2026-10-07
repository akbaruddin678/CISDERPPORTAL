import React from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CalendarMonth,
  ToggleOn,
  ToggleOff,
} from "@mui/icons-material";
import { SessionFormModal } from "./SessionFormModal";

export const SessionManagementView = ({
  sessions,
  isListLoading,
  isModalOpen,
  isEditMode,
  control,
  errors,
  isFormLoading,
  handleOpenCreate,
  handleOpenEdit,
  handleCloseModal,
  handleDelete,
  handleToggleStatus,
  handleFormSubmit,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isListLoading) {
    return (
      <Box className="flex justify-center items-center min-h-[50vh]">
        <CircularProgress />
        <Typography className="ml-3 text-gray-600">
          Loading sessions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <Box className="flex justify-between items-center mb-6">
        <Box className="flex items-center gap-2">
          <CalendarMonth className="text-blue-600" fontSize="large" />
          <Box>
            <Typography variant="h5" className="font-bold text-gray-800">
              Session Management
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Manage academic terms and active enrollment windows.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          Create Academic Session
        </Button>
      </Box>

      {/* Sessions Table */}
      <Paper
        elevation={0}
        className="border border-gray-200 overflow-hidden rounded-xl"
      >
        {sessions.length === 0 ? (
          <Box className="p-12 text-center text-gray-500">
            <Typography>
              No sessions found. Create one to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead className="bg-gray-50">
                <TableRow>
                  <TableCell className="font-semibold text-gray-600 uppercase text-xs">
                    Code
                  </TableCell>
                  <TableCell className="font-semibold text-gray-600 uppercase text-xs">
                    Name
                  </TableCell>
                  <TableCell className="font-semibold text-gray-600 uppercase text-xs">
                    Timeline
                  </TableCell>
                  <TableCell className="font-semibold text-gray-600 uppercase text-xs">
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    className="font-semibold text-gray-600 uppercase text-xs"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session._id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <TableCell>
                      <Chip
                        label={session.code}
                        size="small"
                        className="bg-gray-100 font-mono font-bold text-gray-700"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {session.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(session.startDate)} —{" "}
                      {formatDate(session.endDate)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status ? "Active" : "Inactive"}
                        color={session.status ? "success" : "default"}
                        size="small"
                        variant={session.status ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={session.status ? "Deactivate" : "Activate"}
                      >
                        <IconButton
                          onClick={() =>
                            handleToggleStatus(session._id, session.status)
                          }
                          color={session.status ? "success" : "default"}
                        >
                          {session.status ? (
                            <ToggleOn fontSize="medium" />
                          ) : (
                            <ToggleOff fontSize="medium" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Session">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenEdit(session)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Session">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(session._id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* The Unified Form Modal */}
      <SessionFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        isEditMode={isEditMode}
        control={control}
        errors={errors}
        onSubmit={handleFormSubmit}
        isLoading={isFormLoading}
      />
    </Box>
  );
};
