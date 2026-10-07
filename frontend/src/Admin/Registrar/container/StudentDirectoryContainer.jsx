import React from "react";
import { useStudentDirectoryController } from "../controller/useStudentDirectoryController";
import StudentDirectoryView from "../view/StudentDirectoryView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const StudentDirectoryContainer = () => {
  // 1. Initialize the controller hook to fetch data and logic
  const controller = useStudentDirectoryController();

  // 2. Pass all returned controller properties down to the view via spread operator
  return <RegistrarModuleFrame title="Student master database"><StudentDirectoryView {...controller} /></RegistrarModuleFrame>;
};

export default StudentDirectoryContainer;
