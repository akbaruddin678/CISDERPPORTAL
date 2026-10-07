import React from "react";
import TeacherLeaveView from "../view/TeacherLeaveView";
import useTeacherLeaveController from "../leaves/controller/useTeacherLeaveController";

const TeacherLeavesContainer = () => {
  const controllerProps = useTeacherLeaveController();
  return <TeacherLeaveView {...controllerProps} />;
};

export default TeacherLeavesContainer;
