import React from "react";
import ApproveMarksView from "../view/ApproveMarksView";
import useApproveMarksController from "../controller/useApproveMarksController";

const AcademiaApproveMarksContainer = () => {
  const controller = useApproveMarksController();
  return <ApproveMarksView {...controller} />;
};

export default AcademiaApproveMarksContainer;
