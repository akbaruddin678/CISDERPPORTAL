import React from "react";
import StudentTrashPageView from "../view/StudentTrashPageView";
import { useStudentTrashPage } from "../controller/useStudentTrashPage";

const StudentTrashContainer = () => {
  const controller = useStudentTrashPage();
  return <StudentTrashPageView {...controller} />;
};

export default StudentTrashContainer;
