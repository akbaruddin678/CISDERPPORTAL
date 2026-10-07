import React from "react";
import AppraisalReviewView from "../view/AppraisalReviewView";
import useAppraisalReviewController from "../controller/useAppraisalReviewController";

const AppraisalReviewContainer = () => {
  const controller = useAppraisalReviewController();
  return <AppraisalReviewView {...controller} />;
};

export default AppraisalReviewContainer;
