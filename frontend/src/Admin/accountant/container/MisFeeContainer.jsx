import React from "react";
import useMisFeeController from "../controller/useMisFeeController";
import MisFeeView from "../view/MisFeeView"; 

const MisFeeContainer = () => {
  const controllerProps = useMisFeeController();

  return <MisFeeView {...controllerProps} />;
};

export default MisFeeContainer;
