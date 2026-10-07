import React from "react";
import useMonthlyChallanReportController from "../controller/useMonthlyChallanReportController";
import MonthlyChallanReportView from "../view/MonthlyChallanReportView";

const MonthlyChallanReportContainer = () => {
  const controllerProps = useMonthlyChallanReportController();

  return <MonthlyChallanReportView {...controllerProps} />;
};

export default MonthlyChallanReportContainer;
