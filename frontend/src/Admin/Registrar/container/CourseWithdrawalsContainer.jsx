import React from "react";
import { useCourseWithdrawalsController } from "../controller/useCourseWithdrawalsController";
import CourseWithdrawalsView from "../view/CourseWithdrawalsView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const CourseWithdrawalsContainer = () => {
  const controller = useCourseWithdrawalsController();
  return <RegistrarModuleFrame title="Course withdrawals"><CourseWithdrawalsView {...controller} /></RegistrarModuleFrame>;
};

export default CourseWithdrawalsContainer;
