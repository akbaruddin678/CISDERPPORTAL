import React from "react";
import HrAppraisalsView from "../view/HrAppraisalsView";
import useHrAppraisalsController from "../controller/useHrAppraisalsController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrAppraisalsContainer = () => {
  const controllerProps = useHrAppraisalsController();
  return <HrModuleFrame title="Appraisals & KPIs"><HrAppraisalsView {...controllerProps} /></HrModuleFrame>;
};

export default HrAppraisalsContainer;
