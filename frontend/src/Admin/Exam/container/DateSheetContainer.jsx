import React from "react";
import useDateSheetController from "../controller/useDateSheetController";
import DateSheetView from "../view/DateSheetView";
import ExamModuleFrame from "../common/ExamModuleFrame";

const DateSheetContainer = () => {
  const controllerProps = useDateSheetController();
  return <ExamModuleFrame title="Date Sheet"><DateSheetView {...controllerProps} /></ExamModuleFrame>;
};

export default DateSheetContainer;
