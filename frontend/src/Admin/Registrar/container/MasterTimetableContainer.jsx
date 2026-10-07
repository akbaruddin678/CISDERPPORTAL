import React from "react";
import { useMasterTimetableController } from "../controller/useMasterTimetableController";
import MasterTimetableView from "../view/MasterTimetableView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const MasterTimetableContainer = () => {
  const controller = useMasterTimetableController();
  return <RegistrarModuleFrame title="Master timetable"><MasterTimetableView {...controller} /></RegistrarModuleFrame>;
};

export default MasterTimetableContainer;
