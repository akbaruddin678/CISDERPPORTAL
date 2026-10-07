import React from "react";
import { useVcHomeController } from "../controller/useVcHomeController";
import VcHomeView from "../view/VcHomeView";

const VcMainContainer = () => {
  const controller = useVcHomeController();
  return <VcHomeView {...controller} />;
};

export default VcMainContainer;
