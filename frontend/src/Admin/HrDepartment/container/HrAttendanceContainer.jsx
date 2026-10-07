import React from "react";
import HrAttendanceView from "../view/HrAttendanceView";
import useHrAttendanceController from "../controller/useHrAttendanceController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrAttendanceContainer = () => {
  const controllerProps = useHrAttendanceController();
  return <HrModuleFrame title="Staff attendance"><HrAttendanceView {...controllerProps} /></HrModuleFrame>;
};

export default HrAttendanceContainer;
