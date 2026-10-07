import React from "react";
import ManualAdmissionView from "../view/ManualAdmissionView";
import { useManualAdmissionController } from "../controller/useManualAdmissionController";

const ManualAdmissionContainer = () => {
  const controller = useManualAdmissionController();
  return <ManualAdmissionView {...controller} />;
};

export default ManualAdmissionContainer;
