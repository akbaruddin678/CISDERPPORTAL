import React from "react";
import { useAlumniRecordsController } from "../controller/useAlumniRecordsController";
import AlumniRecordsView from "../view/AlumniRecordsView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const AlumniRecordsContainer = () => {
  const controller = useAlumniRecordsController();
  return <RegistrarModuleFrame title="Alumni records"><AlumniRecordsView {...controller} /></RegistrarModuleFrame>;
};

export default AlumniRecordsContainer;
