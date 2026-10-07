import React from "react";
import { useDepartmentChallanController } from "../controller/useDepartmentChallanController";
import DepartmentChallanView from "../view/DepartmentChallanView";

/**
 * DepartmentChallanContainer
 *
 * Thin shell: just wires the controller hook into the view.
 * All data-fetching, aggregation, and action handlers live in the controller.
 * All rendering and interaction lives in the view.
 */
const DepartmentChallanContainer = () => {
  const controller = useDepartmentChallanController();
  return <DepartmentChallanView {...controller} />;
};

export default DepartmentChallanContainer;
