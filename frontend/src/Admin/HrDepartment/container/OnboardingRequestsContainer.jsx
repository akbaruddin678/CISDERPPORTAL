import React from "react";
import { useOnboardingRequestsController } from "../controller/useOnboardingRequestsController";
import OnboardingRequestsView from "../view/OnboardingRequestsView";
import HrModuleFrame from "../common/HrModuleFrame";

const OnboardingRequestsContainer = () => {
  const controller = useOnboardingRequestsController();

  return <HrModuleFrame title="Onboarding requests"><OnboardingRequestsView {...controller} /></HrModuleFrame>;
};

export default OnboardingRequestsContainer;
