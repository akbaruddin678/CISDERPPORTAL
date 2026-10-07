import React from "react";
import { useMeritListsController } from "../controller/useMeritListsController";
import MeritListsView from "../view/MeritListsView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const MeritListsContainer = () => {
  const controller = useMeritListsController();
  return <RegistrarModuleFrame title="Merit lists & enrollment"><MeritListsView {...controller} /></RegistrarModuleFrame>;
};

export default MeritListsContainer;
