import React from "react";
import useCreateExamController from "../controller/useCreateExamController";
import CreateExamView from "../view/ExamView/CreateExamView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const CreateExamContainer = () => {
  // Execute the controller hook to get state and handlers
  const controllerProps = useCreateExamController();

  // Pass all logic as props down to the dumb UI View
  return <ExamModuleFrame title="Exam Setup"><CreateExamView {...controllerProps} /></ExamModuleFrame>;
};

export default CreateExamContainer;
