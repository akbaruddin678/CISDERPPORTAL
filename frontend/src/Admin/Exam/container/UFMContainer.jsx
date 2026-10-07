import React from "react";
import useUFMController from "../controller/useUFMController";
import UFMView from "../view/UFMView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const UFMContainer = () => {
  const controllerProps = useUFMController();

  return <ExamModuleFrame title="Disciplinary / UFM"><UFMView {...controllerProps} /></ExamModuleFrame>;
};

export default UFMContainer;
