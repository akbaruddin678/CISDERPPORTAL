import React from "react";
import { useAlumniPortalController } from "../controller/useAlumniPortalController";
import AlumniPortalView from "../view/AlumniPortalView";
import HrModuleFrame from "../common/HrModuleFrame";

const AlumniPortalContainer = () => {
  const controller = useAlumniPortalController();
  return <HrModuleFrame title="Former staff records"><AlumniPortalView {...controller} /></HrModuleFrame>;
};

export default AlumniPortalContainer;
