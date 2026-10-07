import React from "react";
import useReEvaluationController from "../controller/useReEvaluationController";
import ReEvaluationView from "../view/ReEvaluationView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const ReEvaluationContainer = () => {
  const controllerProps = useReEvaluationController();

  return <ExamModuleFrame title="Re-evaluation Requests"><ReEvaluationView {...controllerProps} /></ExamModuleFrame>;
};

export default ReEvaluationContainer;
