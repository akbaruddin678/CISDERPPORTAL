import React from "react";
import { useInventoryRoomsController } from "../controller/useInventoryRoomsController";
import InventoryRoomsView from "../view/InventoryRoomsView";
import HrModuleFrame from "../common/HrModuleFrame";

const InventoryRoomsContainer = () => {
  const controller = useInventoryRoomsController();
  return <HrModuleFrame title="Rooms & spaces"><InventoryRoomsView {...controller} /></HrModuleFrame>;
};

export default InventoryRoomsContainer;
