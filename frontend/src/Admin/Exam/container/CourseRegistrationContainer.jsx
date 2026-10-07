import React from "react";
import CourseRegistrationView from "../view/CourseRegistration/CourseRegistrationView";
import useCourseRegistrationController from "../controller/useCourseRegistrationController";
import ExamModuleFrame from "../common/ExamModuleFrame";

const CourseRegistrationContainer = () => {
  const controller = useCourseRegistrationController();
  return <ExamModuleFrame title="Course Catalog"><CourseRegistrationView {...controller} /></ExamModuleFrame>;
};

export default CourseRegistrationContainer;
