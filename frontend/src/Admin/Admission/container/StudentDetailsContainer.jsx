import React from "react";
import { useParams } from "react-router-dom";
import useStudentDetailsController from "../controller/useStudentDetailsController";
import StudentDetailsView from "../view/StudentDetailsView";

const StudentDetailsContainer = () => {
  const { studentId } = useParams();

  const {
    data,
    loading,
    error,
    refetch,
    handleUpdate,
    isUpdating,
    catalogData, // ✅ Destructured here
  } = useStudentDetailsController(studentId);

  return (
    <StudentDetailsView
      student={data}
      loading={loading}
      error={error}
      handleUpdate={handleUpdate}
      isUpdating={isUpdating}
      catalogData={catalogData} // ✅ Passed to view
    />
  );
};

export default StudentDetailsContainer;
