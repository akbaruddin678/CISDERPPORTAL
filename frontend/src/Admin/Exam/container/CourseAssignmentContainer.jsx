import React from 'react'

import StudentCourseRegistrationView from "../view/StudentCourseRegistrationView";
import useStudentCourseRegistrationController from "../controller/useStudentCourseRegistrationController";
import ExamModuleFrame from "../common/ExamModuleFrame";

const CourseAssignmentContainer = () => {
  const controller = useStudentCourseRegistrationController();
  return <ExamModuleFrame title="Course Assignment"><StudentCourseRegistrationView {...controller} /></ExamModuleFrame>;
};

export default CourseAssignmentContainer;

