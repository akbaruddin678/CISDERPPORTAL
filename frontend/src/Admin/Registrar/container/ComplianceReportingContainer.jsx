import React from "react";
import { useComplianceReportingController } from "../controller/useComplianceReportingController";
import ComplianceReportingView from "../view/ComplianceReportingView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const ComplianceReportingContainer = () => {
  const controller = useComplianceReportingController();
  return <RegistrarModuleFrame title="Compliance reporting"><ComplianceReportingView {...controller} /></RegistrarModuleFrame>;
};

export default ComplianceReportingContainer;
