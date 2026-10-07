import React from "react";
import { useTeacherOnboardingController } from "../controller/useTeacherOnboardingController";
import TeacherOnboardingView from "../view/TeacherOnboardingView";

const TeacherOnboardingContainer = () => {
  const controller = useTeacherOnboardingController();
  return <TeacherOnboardingView {...controller} />;
};

export default TeacherOnboardingContainer;
