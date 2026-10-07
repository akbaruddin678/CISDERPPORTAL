import React from "react";
import { useHrOnboardController } from "../controller/useHrOnboardController";
import HrOnboardView from "../view/HrOnboardView";
import HrModuleFrame from "../common/HrModuleFrame";

const HrOnboardContainer = () => {
  const controller = useHrOnboardController();

  return <HrModuleFrame title="Onboard new hire"><HrOnboardView {...controller} /></HrModuleFrame>;
};

export default HrOnboardContainer;
