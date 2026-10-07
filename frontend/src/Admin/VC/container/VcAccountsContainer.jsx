import React from "react";
import { useVcAccountsController } from "../controller/useVcAccountsController";
import VcAccountsView from "../view/VcAccountsView";

const VcAccountsContainer = () => {
  const controller = useVcAccountsController();
  return <VcAccountsView {...controller} />;
};

export default VcAccountsContainer;
