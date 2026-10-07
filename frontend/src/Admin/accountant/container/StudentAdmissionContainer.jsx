import React from "react";
import StudentAdmissionController from "../controller/StudentAdmissionController";
import StudentAdmissionView from "../view/StudentAdmissionView";

const StudentAdmissionContainer = () => {
  return (
    <StudentAdmissionController>
      {(props) => <StudentAdmissionView {...props} />}
    </StudentAdmissionController>
  );
};

export default StudentAdmissionContainer;
