import React from "react";
import ExamResultsRegisterView from "../view/ExamResultsRegisterView";
import useExamResultsRegisterController from "../controller/useExamResultsRegisterController";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const ExamResultsRegisterContainer = () => {
  const controller = useExamResultsRegisterController();
  return <RegistrarModuleFrame title="Exam results register"><ExamResultsRegisterView {...controller} /></RegistrarModuleFrame>;
};

export default ExamResultsRegisterContainer;
