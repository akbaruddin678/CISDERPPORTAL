import React from "react";
import { useExamController } from "../controller/useExamControllers";
import ExamHomeView from "../view/ExamHomeView";

const ExamMainContainer = () => {
  const controller = useExamController();
  return <ExamHomeView {...controller} />;
};

export default ExamMainContainer;
