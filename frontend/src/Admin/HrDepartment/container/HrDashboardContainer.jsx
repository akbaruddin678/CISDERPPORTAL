import React from "react";
import { useHrDashboardController } from "../controller/useHrDashboardController";
import HrDashboardView from "../view/HrDashboardView";

const HrDashboardContainer = () => {
  const controller = useHrDashboardController();

  return <HrDashboardView {...controller} />;
};

export default HrDashboardContainer;
