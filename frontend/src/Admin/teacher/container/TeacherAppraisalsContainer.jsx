import React from "react";
import TeacherAppraisalsView from "../view/TeacherAppraisalsView";
import useTeacherAppraisalsController from "../appraisals/controller/useTeacherAppraisalsController";

const TeacherAppraisalsContainer = () => {
  const controllerProps = useTeacherAppraisalsController();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Performance Appraisals</h1>
      <p className="text-gray-600 mb-6">Track your goals and submit self-assessments when requested.</p>
      <TeacherAppraisalsView {...controllerProps} />
    </div>
  );
};

export default TeacherAppraisalsContainer;
