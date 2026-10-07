import React from "react";
import useExamAttendanceController from "../controller/useExamAttendanceController";
import ExamAttendanceView from "../view/ExamAttendanceView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const ExamAttendanceContainer = () => {
  const controllerProps = useExamAttendanceController();
  return <ExamModuleFrame title="Exam Attendance"><ExamAttendanceView {...controllerProps} /></ExamModuleFrame>;
};

export default ExamAttendanceContainer;
