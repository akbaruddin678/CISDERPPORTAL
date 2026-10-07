import React from "react";
import { useSessionManagementController } from "../controller/useSessionManagementController";
import { SessionManagementView } from "../view/sessions/SessionManagementView";

const SessionManagementContainer = () => {
  const controller = useSessionManagementController();

  // Pass all state, loading flags, and handlers directly to the View
  return <SessionManagementView {...controller} />;
};

export default SessionManagementContainer;
