import React from "react";
// Adjust the path to wherever you saved the View component
import StudentAcademicHistoryView from "../view/StudentAcademicHistoryView";
import ExamModuleFrame from "../common/ExamModuleFrame";

export const StudentAcademicHistoryContainer = () => {
  return <ExamModuleFrame title="Academic History"><StudentAcademicHistoryView /></ExamModuleFrame>;
};

export default StudentAcademicHistoryContainer;
