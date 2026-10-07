import React from "react";
import { useVcDashboardController } from "../controller/useVcDashboardController";
import VcDashboardView from "../view/VcDashboardView";

const VcDashboardContainer = () => {
  const controller = useVcDashboardController();
  return <VcDashboardView {...controller} />;
};

export default VcDashboardContainer;
