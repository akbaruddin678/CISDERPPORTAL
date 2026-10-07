import React from "react";
import useMarkUploadController from "../controller/useMarkUploadController";
import MarkUploadView from "../view/MarkUploadView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const MarkUploadContainer = () => {
  const controllerProps = useMarkUploadController();
  return <ExamModuleFrame title="Marks Upload"><MarkUploadView {...controllerProps} /></ExamModuleFrame>;
};

export default MarkUploadContainer;
