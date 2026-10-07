import React from "react";
import useAdmitCardController from "../controller/useAdmitCardController";
import AdmitCardView from "../view/AdmitCardView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const AdmitCardContainer = () => {
  const controllerProps = useAdmitCardController();
  return <ExamModuleFrame title="Admit Cards"><AdmitCardView {...controllerProps} /></ExamModuleFrame>;
};

export default AdmitCardContainer;
