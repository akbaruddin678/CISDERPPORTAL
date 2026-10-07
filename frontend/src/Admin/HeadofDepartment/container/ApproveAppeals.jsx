import React from "react";
import useApproveRecheckingController from "../controller/useApproveRecheckingController";
import ApproveRecheckingView from "../view/ApproveRecheckingView";

const ApproveAppeals = () => {
  const controllerProps = useApproveRecheckingController();
  return <ApproveRecheckingView {...controllerProps} />;
};

export default ApproveAppeals;
