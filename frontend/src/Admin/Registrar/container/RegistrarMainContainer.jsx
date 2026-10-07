import React from "react";
import { useRegistrarController } from "../controller/useRegistrarControllers";
import RegistrarHomeView from "../view/RegistrarHomeView";

const RegistrarMainContainer = () => {
  const controller = useRegistrarController();

  return <RegistrarHomeView {...controller} />;
};

export default RegistrarMainContainer;
