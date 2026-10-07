import React from "react";
import TeacherProfileView from "../view/TeacherProfileView";
import useTeacherProfileController from "../controller/useTeacherProfileController";

const TeacherProfileContainer = () => {
  const controller = useTeacherProfileController();
  return <TeacherProfileView {...controller} />;
};

export default TeacherProfileContainer;
