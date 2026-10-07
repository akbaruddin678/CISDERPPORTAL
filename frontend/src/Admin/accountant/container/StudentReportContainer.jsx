import React from "react";
import StudentReportController from "../controller/StudentReportController";
import StudentReportView from "../view/StudentReport/StudentReportView";

const StudentReportContainer = () => {
  return (
    <StudentReportController>
      {(data) => <StudentReportView {...data} />}
    </StudentReportController>
  );
};

export default StudentReportContainer;
