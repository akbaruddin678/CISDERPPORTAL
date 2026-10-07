import React from "react";
import useCertificationController from "../controller/useCertificationController";
import CertificationView from "../view/CertificationView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const CertificationContainer = () => {
  const controllerProps = useCertificationController();

  return <ExamModuleFrame title="Transcripts & Degrees"><CertificationView {...controllerProps} /></ExamModuleFrame>;
};

export default CertificationContainer;
