import React from "react";
import useDegreeAuditController from "../controller/useDegreeAuditController";
import DegreeAuditView from "../view/DegreeAuditView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const DegreeAuditContainer = () => {
  const controllerProps = useDegreeAuditController();
  return <ExamModuleFrame title="Degree Audit"><DegreeAuditView {...controllerProps} /></ExamModuleFrame>;
};

export default DegreeAuditContainer;
