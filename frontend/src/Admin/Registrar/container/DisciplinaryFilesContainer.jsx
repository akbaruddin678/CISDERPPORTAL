import React from "react";
import { useDisciplinaryFilesController } from "../controller/useDisciplinaryFilesController";
import DisciplinaryFilesView from "../view/DisciplinaryFilesView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const DisciplinaryFilesContainer = () => {
  const controller = useDisciplinaryFilesController();
  return <RegistrarModuleFrame title="Disciplinary files"><DisciplinaryFilesView {...controller} /></RegistrarModuleFrame>;
};

export default DisciplinaryFilesContainer;
