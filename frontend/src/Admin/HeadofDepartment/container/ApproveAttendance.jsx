import React from "react";
import useApproveAttendanceController from "../controller/useApproveAttendanceController";
import ApproveAttendanceView from "../view/ApproveAttendanceView";

const ApproveAttendance = () => {
  const controllerProps = useApproveAttendanceController();
  return <ApproveAttendanceView {...controllerProps} />;
};

export default ApproveAttendance;
