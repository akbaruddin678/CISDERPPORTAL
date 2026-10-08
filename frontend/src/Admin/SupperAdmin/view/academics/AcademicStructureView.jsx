import React from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import { Building2 } from "lucide-react";
import { Add } from "@mui/icons-material";

import { DepartmentFormModal } from "./DepartmentFormModal";
import { ProgramFormModal } from "./ProgramFormModal";
import { SemesterFormModal } from "./SemesterFormModal";
import { DepartmentListCard } from "./DepartmentListCard";

export const AcademicStructureView = ({
  departments,
  programsByClass,
  sectionsByProgram,
  isLoading,

  // Program modal
  isProgramModalOpen,
  editingProg,
  progForm,
  programError,
  handleOpenProgramModal,
  handleCloseProgramModal,
  onSubmitProgram,
  handleDeleteProgram,
  addSectionProgram,

  // Class modal
  isDeptModalOpen,
  editingDept,
  deptForm,
  handleOpenDeptModal,
  handleCloseDeptModal,
  onSubmitDepartment,

  // Add-section dialog
  addSectionClass,
  newSectionName,
  setNewSectionName,
  addSectionError,
  handleOpenAddSection,
  handleCloseAddSection,
  onSubmitAddSection,

  // Edit-section modal
  editingSemester,
  semForm,
  handleOpenSemesterModal,
  handleCloseSemesterModal,
  onSubmitSemester,
  onDeleteSemester,
  semesterUsage,
  isUsageLoading,
  semesterError,

  isSubmitting,
}) => {
  if (isLoading) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-6 bg-gray-50 min-h-screen">
      <Box className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <Box className="flex items-center gap-3">
          <Building2 className="text-blue-600 w-8 h-8" />
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              Academic Management
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Classes, their Programs and Sections
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDeptModal(null)}
          className="bg-blue-600 shadow-none"
        >
          Add Class
        </Button>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <DepartmentListCard
            key={dept._id}
            department={dept}
            programs={programsByClass[dept._id] || []}
            sectionsByProgram={sectionsByProgram}
            onEditDept={handleOpenDeptModal}
            onAddProgram={handleOpenProgramModal}
            onEditProgram={(prog) => handleOpenProgramModal(dept, prog)}
            onDeleteProgram={handleDeleteProgram}
            onAddSection={handleOpenAddSection}
            onEditSection={handleOpenSemesterModal}
          />
        ))}
        {departments.length === 0 && (
          <Typography className="text-gray-500 p-4">No classes found.</Typography>
        )}
      </Box>

      <DepartmentFormModal
        open={isDeptModalOpen}
        onClose={handleCloseDeptModal}
        form={deptForm}
        onSubmit={onSubmitDepartment}
        isLoading={isSubmitting}
        editingDept={editingDept}
      />

      <ProgramFormModal
        open={isProgramModalOpen}
        onClose={handleCloseProgramModal}
        form={progForm}
        departments={departments}
        onSubmit={onSubmitProgram}
        isLoading={isSubmitting}
        editingProg={editingProg}
        error={programError}
      />

      <Dialog
        open={!!addSectionClass}
        onClose={handleCloseAddSection}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Add Section to {addSectionProgram?.name || addSectionClass?.name}
        </DialogTitle>
        <form onSubmit={onSubmitAddSection}>
          <DialogContent>
            {addSectionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {addSectionError}
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              label="Section name"
              placeholder="e.g. A, B, Blue"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddSection}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !newSectionName.trim()}
            >
              Add Section
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <SemesterFormModal
        open={!!editingSemester}
        onClose={handleCloseSemesterModal}
        form={semForm}
        onSubmit={onSubmitSemester}
        onDelete={onDeleteSemester}
        usage={semesterUsage}
        isUsageLoading={isUsageLoading}
        error={semesterError}
        semesterName={editingSemester?.name}
        isLoading={isSubmitting}
      />
    </Box>
  );
};
