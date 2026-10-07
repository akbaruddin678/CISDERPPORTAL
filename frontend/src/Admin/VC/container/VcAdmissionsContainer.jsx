import React from "react";
import { useVcAdmissionsController } from "../controller/useVcAdmissionsController";
import VcAdmissionsView from "../view/VcAdmissionsView";

const VcAdmissionsContainer = () => {
  const controller = useVcAdmissionsController();
  return <VcAdmissionsView {...controller} />;
};

export default VcAdmissionsContainer;
