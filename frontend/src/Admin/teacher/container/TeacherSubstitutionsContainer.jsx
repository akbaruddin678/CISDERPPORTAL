import React from "react";
import TeacherSubstitutionsView from "../view/TeacherSubstitutionsView";
import useTeacherSubstitutionsController from "../substitutions/controller/useTeacherSubstitutionsController";

const TeacherSubstitutionsContainer = () => {
  const controllerProps = useTeacherSubstitutionsController();
  return <TeacherSubstitutionsView {...controllerProps} />;
};

export default TeacherSubstitutionsContainer;
