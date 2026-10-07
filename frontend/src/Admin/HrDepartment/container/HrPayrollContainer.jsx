import React from "react";
import HrPayrollView from "../view/HrPayrollView";
import useHrPayrollController from "../controller/useHrPayrollController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrPayrollContainer = () => {
  const controllerProps = useHrPayrollController();
  return <HrModuleFrame title="Payroll & salary"><HrPayrollView {...controllerProps} /></HrModuleFrame>;
};

export default HrPayrollContainer;
