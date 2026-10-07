import React from "react";
import useStudentFeeController from "../controller/useStudentFeeController";
import StudentFeeManagementView from "../view/StudentFeeManagement/StudentFeeManagementView";

const StudentFeeManagementContainer = () => {
  const controller = useStudentFeeController();
  return <StudentFeeManagementView {...controller} />;
};

export default StudentFeeManagementContainer;
