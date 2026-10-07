import React from "react";
import { useHODController } from "../controller/useHODControllers";
import HODHomeView from "../view/HODHomeView";

const HODMainContainer = () => {
  const controller = useHODController();
  return <HODHomeView {...controller} />;
};

export default HODMainContainer;
