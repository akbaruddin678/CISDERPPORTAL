import React from "react";
import HrLeavesView from "../view/HrLeavesView";
import useHrLeavesController from "../controller/useHrLeavesController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrLeavesContainer = () => {
  const controllerProps = useHrLeavesController();
  return <HrModuleFrame title="Leave approvals"><HrLeavesView {...controllerProps} /></HrModuleFrame>;
};

export default HrLeavesContainer;
