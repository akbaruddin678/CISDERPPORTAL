import React from "react";
import useExamCoordinationController from "../controller/useExamCoordinationController";
import ExamCoordinationView from "../view/ExamCoordinationView";

const ExamCoordination = () => {
  const controllerProps = useExamCoordinationController();
  return <ExamCoordinationView {...controllerProps} />;
};

export default ExamCoordination;
