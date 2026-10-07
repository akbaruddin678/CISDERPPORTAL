import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NewAdmissionsView from "../view/NewAdmissionsView";
import { useNewAdmissions } from "../controller/useNewAdmissions";

const NewAdmissionsContainer = () => {
  const navigate = useNavigate();
  const {
    students,
    stats,
    departments,
    programs,
    filters,
    handleFilterChange,
    pagination,
    handlePageChange,
    isLoading,
    reAdmitStudent,
    isReAdmitting,
    printChallan,
    isPrinting,
  } = useNewAdmissions();

  const handleStudentClick = useCallback(
    (studentId) => {
      navigate(`/students/${studentId}`);
    },
    [navigate],
  );

  return (
    <NewAdmissionsView
      students={students}
      stats={stats}
      departments={departments}
      programs={programs}
      filters={filters}
      onFilterChange={handleFilterChange}
      pagination={pagination}
      onPageChange={handlePageChange}
      isLoading={isLoading}
      onStudentClick={handleStudentClick}
      onReAdmit={reAdmitStudent}
      isReAdmitting={isReAdmitting}
      onPrintChallan={printChallan}
      isPrinting={isPrinting}
    />
  );
};

export default NewAdmissionsContainer;
