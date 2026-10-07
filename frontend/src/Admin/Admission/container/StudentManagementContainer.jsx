import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StudentManagementView from "../view/StudentManagementView";
import { useStudentManagement } from "../controller/useStudentManagement";

const StudentManagementContainer = () => {
  const navigate = useNavigate();
  const controller = useStudentManagement();
  const { setFilters, searchStudents, handleExport, isExporting, ...rest } = controller;

  const handleStudentClick = useCallback(
    (studentId) => {
      navigate(`/students/${studentId}`);
    },
    [navigate]
  );

  return (
    <StudentManagementView
      {...rest}
      onFilterChange={setFilters}
      onSearch={searchStudents}
      onStudentClick={handleStudentClick}
      onExport={handleExport}
      isExporting={isExporting}
    />
  );
};

export default StudentManagementContainer;
