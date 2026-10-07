import React from "react";
import useChallanRequestController from "../controller/useChallanRequestController";
import ChallanGenerationRequestView from "../view/ChallanGenerationRequestView";

const ChallanGenerationRequestContainer = () => {
  const controller = useChallanRequestController();

  return <ChallanGenerationRequestView {...controller} />;
};

export default ChallanGenerationRequestContainer;
