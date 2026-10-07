import React from "react";
import useExamResultController from "../controller/useExamResultController";
import ExamResultView from "../view/ExamResultView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const ExamResultContainer = () => {
  const controllerProps = useExamResultController();
  return <ExamModuleFrame title="Results & Grading"><ExamResultView {...controllerProps} /></ExamModuleFrame>;
};

export default ExamResultContainer;
