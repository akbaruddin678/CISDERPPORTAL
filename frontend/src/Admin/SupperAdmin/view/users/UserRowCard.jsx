import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Email, Block, CheckCircle } from "@mui/icons-material";

export const UserRowCard = ({ user, onEdit, onDelete, onToggleStatus }) => {
  const getRoleColor = (role) => {
    const colors = {
      admin: "error",
      vc: "error",
      vice_vc: "error",
      registrar: "warning",
      staff: "primary",
      teacher: "success",
      hod: "success",
      head_of_academia: "success",
      "course coordinator": "success",
      exam: "success",
      accountant: "secondary",
      hr: "warning",
      manager: "warning",
      admission: "info",
      applicant: "default",
    };
    return colors[role] || "default";
  };

  const getStatusColor = (status) => {
    return status === "active" ? "success" : "default";
  };

  return (
    <Card
      className={`hover:shadow-lg transition-shadow duration-200 border-l-4 ${
        user.status === "active" ? "border-green-500" : "border-gray-500"
      }`}
    >
      <CardContent>
        <Box className="flex justify-between items-start">
          {/* User Info (Left Side) */}
          <Box className="flex-1">
            <Box className="flex items-center gap-3 mb-2">
              <Typography variant="h6" className="font-semibold text-gray-800">
                {user.name}
              </Typography>
              {user.roles.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  color={getRoleColor(role)}
                  size="small"
                  className="mr-1"
                />
              ))}
            </Box>

            <Box className="flex items-center gap-2 text-gray-600 mb-2">
              <Email fontSize="small" />
              <Typography variant="body2">{user.email}</Typography>
            </Box>

            <Box className="flex gap-2">
              <Chip
                label={user.status}
                color={getStatusColor(user.status)}
                size="small"
                variant={user.status === "active" ? "filled" : "outlined"}
              />
            </Box>
          </Box>

          {/* Actions (Right Side) */}
          <Box className="flex flex-col gap-2">
            <Box className="flex justify-end gap-2">
              <Tooltip title="Edit User">
                <Button
                  variant="outlined"
                  onClick={onEdit}
                  size="small"
                  color="primary"
                  sx={{ minWidth: "40px" }}
                >
                  <Edit fontSize="small" />
                </Button>
              </Tooltip>
            </Box>

            {/* Status & Delete Group */}
            <Box className="flex justify-end gap-2">
              <Tooltip
                title={
                  user.status === "active" ? "Deactivate User" : "Activate User"
                }
              >
                <Button
                  variant="outlined"
                  onClick={onToggleStatus}
                  size="small"
                  color={user.status === "active" ? "warning" : "success"}
                  sx={{ minWidth: "40px" }}
                >
                  {user.status === "active" ? (
                    <Block fontSize="small" />
                  ) : (
                    <CheckCircle fontSize="small" />
                  )}
                </Button>
              </Tooltip>

              <Tooltip title="Delete Permanently">
                <Button
                  variant="outlined"
                  onClick={onDelete}
                  size="small"
                  color="error"
                  sx={{ minWidth: "40px" }}
                >
                  <Delete fontSize="small" />
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
