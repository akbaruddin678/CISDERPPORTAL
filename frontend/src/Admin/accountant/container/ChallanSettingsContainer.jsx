import React from "react";
import ChallanSettingsView from "../view/ChallanSettingsView";
import useChallanSettingsController from "../controller/useChallanSettingsController";

const ChallanSettingsContainer = () => {
  const controller = useChallanSettingsController();
  return <ChallanSettingsView {...controller} />;
};

export default ChallanSettingsContainer;