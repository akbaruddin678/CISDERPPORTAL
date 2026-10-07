import React from "react";
import useProgramRegulationController from "../controller/useProgramRegulationController";
import ProgramRegulationView from "../view/ProgramRegulationView";

const ProgramRegulationContainer = () => {
  const controllerProps = useProgramRegulationController();
  return <ProgramRegulationView {...controllerProps} />;
};

export default ProgramRegulationContainer;
