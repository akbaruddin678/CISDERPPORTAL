import React from "react";
import { useAcademicStructureController } from "../controller/useAcademicStructureController";
import { AcademicStructureView } from "../view/academics/AcademicStructureView";

const AcademicStructureContainer = () => {
  const controller = useAcademicStructureController();
  return <AcademicStructureView {...controller} />;
};

export default AcademicStructureContainer;
