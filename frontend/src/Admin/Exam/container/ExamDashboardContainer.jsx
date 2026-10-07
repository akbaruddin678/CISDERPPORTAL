import React from "react";
import { useExamController } from "../controller/useExamControllers";
import ExamHomeView from "../view/ExamHomeView";

const ExamDashboardContainer = () => {
  const controller = useExamController();
  return <ExamHomeView {...controller} />;
};

export default ExamDashboardContainer;
