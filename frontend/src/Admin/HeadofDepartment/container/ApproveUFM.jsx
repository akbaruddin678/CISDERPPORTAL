import React from "react";
import useApproveUFMController from "../controller/useApproveUFMController";
import ApproveUFMView from "../view/ApproveUFMView";

const ApproveUFM = () => {
  const controllerProps = useApproveUFMController();
  return <ApproveUFMView {...controllerProps} />;
};

export default ApproveUFM;
