import React from "react";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  TextField,
  Pagination,
  Select,
  MenuItem,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { RoleFilter } from "./RoleFilter";
import { UserRowCard } from "./UserRowCard";
import { UserFormModal } from "./UserFormModal";

export const UserManagementView = ({
  users,
  paginationParams,
  isListLoading,
  selectedRoles,
  setSelectedRoles,
  searchInput,
  setSearchInput,
  page,
  limit,
  handlePageChange,
  handleLimitChange,

  isModalOpen,
  isEditMode,
  control,
  errors,
  isFormLoading,
  handleOpenCreate,
  handleOpenEdit,
  handleCloseModal,
  handleFormSubmit,
  handleToggleStatus,
  handleDelete,
}) => {
  return (
    <Box className="p-6 bg-gray-50 min-h-screen">
      <Box className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <Typography variant="h4" className="font-bold text-gray-800">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreate}
          size="large"
          className="bg-blue-600 hover:bg-blue-700 shadow-none"
        >
          Create New User
        </Button>
      </Box>

      {/* NEW: Search Bar */}
      <Box className="mb-4">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: <Search className="text-gray-400 mr-2" />,
            className: "bg-white",
          }}
        />
      </Box>

      <Box className="mb-6">
        <RoleFilter
          selectedRoles={selectedRoles}
          onRoleChange={setSelectedRoles}
        />
      </Box>

      <Box className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex justify-between items-center flex-wrap gap-2">
        <Typography variant="body1" className="text-gray-600">
          Showing <strong>{users.length}</strong> of{" "}
          <strong>{paginationParams.total}</strong> total users.
        </Typography>

        {/* NEW: Items per page selector */}
        <Box className="flex items-center gap-2">
          <Typography variant="body2" className="text-gray-500">
            Rows per page:
          </Typography>
          <Select
            value={limit}
            onChange={handleLimitChange}
            size="small"
            className="bg-white"
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </Box>
      </Box>

      {isListLoading ? (
        <Box className="flex justify-center items-center py-16">
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Box className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
          <Typography variant="h6" className="text-gray-500 mb-2">
            No users found
          </Typography>
          <Button variant="outlined" onClick={handleOpenCreate}>
            Create First User
          </Button>
        </Box>
      ) : (
        <Box className="grid gap-4">
          {users.map((user) => (
            <UserRowCard
              key={user._id}
              user={user}
              onEdit={() => handleOpenEdit(user)}
              onDelete={() => handleDelete(user._id)}
              onToggleStatus={() => handleToggleStatus(user._id, user.status)}
            />
          ))}
        </Box>
      )}

      {/* NEW: Pagination Controls */}
      {paginationParams.totalPages > 1 && (
        <Box className="flex justify-center mt-8 pb-8">
          <Pagination
            count={paginationParams.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      <UserFormModal
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
