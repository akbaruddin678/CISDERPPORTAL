import React from "react";
import { useVcAccreditationsController } from "../controller/useVcAccreditationsController";
import VcAccreditationsView from "../view/VcAccreditationsView";

const VcAccreditationsContainer = () => {
  const controller = useVcAccreditationsController();
  return <VcAccreditationsView {...controller} />;
};

export default VcAccreditationsContainer;
