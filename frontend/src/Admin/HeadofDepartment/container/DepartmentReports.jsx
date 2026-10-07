import React from "react";
import useDepartmentReportsController from "../controller/useDepartmentReportsController";
import DepartmentReportsView from "../view/DepartmentReportsView";

const DepartmentReports = () => {
  const controllerProps = useDepartmentReportsController();
  return <DepartmentReportsView {...controllerProps} />;
};

export default DepartmentReports;
