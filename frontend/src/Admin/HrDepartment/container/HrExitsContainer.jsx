import React from "react";
import HrExitsView from "../view/HrExitsView";
import useHrExitsController from "../controller/useHrExitsController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrExitsContainer = () => {
  const controllerProps = useHrExitsController();
  return <HrModuleFrame title="Exit management"><HrExitsView {...controllerProps} /></HrModuleFrame>;
};

export default HrExitsContainer;
