import React from "react";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import { Building2, GraduationCap, Library } from "lucide-react";
import { Add, Edit } from "@mui/icons-material";

// Components
import { DepartmentFormModal } from "./DepartmentFormModal";
import { ProgramFormModal } from "./ProgramFormModal";
import { SemesterFormModal } from "./SemesterFormModal";
import { DepartmentListCard } from "./DepartmentListCard";

export const AcademicStructureView = ({
  // Data & State
  activeTab,
  handleTabChange,
  departments,
  allPrograms,
  allSemesters,
  universityPrograms,
  collegePrograms,
  isLoading,

  // Department Modal
  isDeptModalOpen,
  editingDept,
  deptForm,
  handleOpenDeptModal,
  handleCloseDeptModal,
  onSubmitDepartment,

  // Program Modal
  programModalContext,
  editingProg,
  progForm,
  handleOpenProgramModal,
  handleCloseProgramModal,
  onSubmitProgram,

  // Semester Modal
  editingSemester,
  semForm,
  handleOpenSemesterModal,
  handleCloseSemesterModal,
  onSubmitSemester,
  onDeleteSemester,
  semesterUsage,
  isUsageLoading,
  semesterError,
  programError,

  // Shared
  isSubmitting,
}) => {
  if (isLoading) {
    return (
      <Box className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  // --- Sub-component: Reusable Program Card (Used in Tabs 1 & 2) ---
  const ProgramCard = ({ program, isCollege, onEdit }) => (
    <Card className="hover:shadow-md transition-shadow border border-gray-200 shadow-sm rounded-xl">
      <CardContent>
        <Box className="flex justify-between items-start mb-2">
          <Box>
            <Typography
              variant="h6"
              className="font-bold text-gray-800 leading-tight"
            >
              {program.name}
            </Typography>
            <Typography variant="body2" className="text-gray-500 mt-1">
              Department:{" "}
              <strong>{program.departmentId?.name || "Unknown"}</strong>
            </Typography>
          </Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onEdit(program)}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>
        <Divider className="mb-3" />
        <Box className="flex justify-between items-center">
          <Box className="flex gap-2">
            <Chip
              label={`Level: ${program.level}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${program.durationSemesters || program.durationStages} ${
                isCollege ? "Parts" : "Semesters"
              }`}
              size="small"
              color={isCollege ? "success" : "primary"}
              variant="outlined"
            />
          </Box>
          <Chip
            label={program.code}
            size="small"
            className="font-mono bg-blue-50 text-blue-700 font-bold"
          />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <Box className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <Box className="flex items-center gap-3">
          <Building2 className="text-blue-600 w-8 h-8" />
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              Academic Structure
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Master Directory: Departments, Degrees, and Semesters
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Modern Tabs */}
      <Box className="border-b border-gray-200 mb-6 bg-white rounded-t-xl px-2 pt-2">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            icon={<Building2 size={18} />}
            iconPosition="start"
            label="Department Hierarchy"
            className="font-bold"
          />
          <Tab
            icon={<GraduationCap size={18} />}
            iconPosition="start"
            label="University (BS/MS)"
            className="font-bold"
          />
          <Tab
            icon={<Library size={18} />}
            iconPosition="start"
            label="College (Intermediate)"
            className="font-bold"
          />
        </Tabs>
      </Box>

      {/* TAB 0: DEPARTMENTS (THE MASTER DIRECTORY) */}
      {activeTab === 0 && (
        <Box className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="body2" className="text-gray-500">
              Click on a department below to view its full nested structure
              (Programs and Semesters).
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDeptModal(null)}
              className="bg-blue-600 shadow-none"
            >
              Add Department
            </Button>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => {
              const deptPrograms = allPrograms.filter(
                (p) =>
                  p.departmentId?._id === dept._id ||
                  p.departmentId === dept._id,
              );
              return (
                <DepartmentListCard
                  key={dept._id}
                  department={dept}
                  programs={deptPrograms}
                  semesters={allSemesters}
                  onEditDept={handleOpenDeptModal}
                  onEditProgram={(prog) =>
                    handleOpenProgramModal(
                      prog.level === "HSSC" ? "college" : "university",
                      prog,
                    )
                  }
                  onEditSemester={handleOpenSemesterModal}
                />
              );
            })}
            {departments.length === 0 && (
              <Typography className="text-gray-500 p-4">
                No departments found.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* TAB 1: UNIVERSITY */}
      {activeTab === 1 && (
        <Box className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Box className="flex justify-between items-center mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <Typography variant="body2" className="text-blue-800">
              University programs use a <strong>Semester-based</strong>{" "}
              timeline.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenProgramModal("university")}
              className="bg-blue-600 shadow-none"
            >
              Add Degree Program
            </Button>
          </Box>
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {universityPrograms.map((prog) => (
              <ProgramCard
                key={prog._id}
                program={prog}
                isCollege={false}
                onEdit={() => handleOpenProgramModal("university", prog)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* TAB 2: COLLEGE */}
      {activeTab === 2 && (
        <Box className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Box className="flex justify-between items-center mb-4 bg-green-50 p-4 rounded-xl border border-green-100">
            <Typography variant="body2" className="text-green-800">
              College programs use an <strong>Annual/Session-based</strong>{" "}
              timeline (e.g., Part 1, Part 2).
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenProgramModal("college")}
              color="success"
              className="bg-green-600 shadow-none"
            >
              Add College Program
            </Button>
          </Box>
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collegePrograms.map((prog) => (
              <ProgramCard
                key={prog._id}
                program={prog}
                isCollege={true}
                onEdit={() => handleOpenProgramModal("college", prog)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Modals */}
      <DepartmentFormModal
        open={isDeptModalOpen}
        onClose={handleCloseDeptModal}
        form={deptForm}
        onSubmit={onSubmitDepartment}
        isLoading={isSubmitting}
        editingDept={editingDept}
      />
      <ProgramFormModal
        open={!!programModalContext}
        context={programModalContext}
        onClose={handleCloseProgramModal}
        form={progForm}
        departments={departments}
        onSubmit={onSubmitProgram}
        isLoading={isSubmitting}
        editingProg={editingProg}
        error={programError}
      />
      {/* ✅ ADDED THE SEMESTER MODAL HERE */}
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
