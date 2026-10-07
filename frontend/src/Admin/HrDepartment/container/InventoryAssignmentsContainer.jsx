import React from "react";
import { useInventoryAssignmentsController } from "../controller/useInventoryAssignmentsController";
import InventoryAssignmentsView from "../view/InventoryAssignmentsView";
import HrModuleFrame from "../common/HrModuleFrame";

const InventoryAssignmentsContainer = () => {
  const controller = useInventoryAssignmentsController();
  return <HrModuleFrame title="Asset assignments"><InventoryAssignmentsView {...controller} /></HrModuleFrame>;
};

export default InventoryAssignmentsContainer;
