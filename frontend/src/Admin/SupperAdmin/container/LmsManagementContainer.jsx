import React from "react";
import { useLmsManagementController } from "../controller/useLmsManagementController";
import LmsManagementView from "../view/lms/LmsManagementView";

const LmsManagementContainer = () => {
  const controller = useLmsManagementController();
  return <LmsManagementView {...controller} />;
};

export default LmsManagementContainer;
