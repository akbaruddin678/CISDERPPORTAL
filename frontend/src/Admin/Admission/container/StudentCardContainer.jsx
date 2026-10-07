import React from "react";
import useStudentCardController from "../controller/useStudentCardController";
import StudentCardView from "../view/StudentCardView";

const StudentCardContainer = () => {
  const controller = useStudentCardController();
  return <StudentCardView c={controller} />;
};

export default StudentCardContainer;
