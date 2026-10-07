import React from "react";
import { useInventoryDashboardController } from "../controller/useInventoryDashboardController";
import InventoryDashboardView from "../view/InventoryDashboardView";
import HrModuleFrame from "../common/HrModuleFrame";

const InventoryDashboardContainer = () => {
  const controller = useInventoryDashboardController();
  return <HrModuleFrame title="Inventory management"><InventoryDashboardView {...controller} /></HrModuleFrame>;
};

export default InventoryDashboardContainer;
