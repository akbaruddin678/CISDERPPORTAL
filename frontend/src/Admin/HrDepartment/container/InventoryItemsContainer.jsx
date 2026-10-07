import React from "react";
import { useInventoryItemsController } from "../controller/useInventoryItemsController";
import InventoryItemsView from "../view/InventoryItemsView";
import HrModuleFrame from "../common/HrModuleFrame";

// Reused as-is by the Rooms/Furniture/Stationery/Equipment screens — each
// just pins `category` (and a matching title/description) so the same
// controller+view handles every kind of item without four near-duplicate
// implementations.
const InventoryItemsContainer = ({ category, title, description }) => {
  const controller = useInventoryItemsController(category);
  return <HrModuleFrame title={title}><InventoryItemsView category={category} title={title} description={description} {...controller} /></HrModuleFrame>;
};

export default InventoryItemsContainer;
