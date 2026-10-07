import React from "react";
import ManageRoomsView from "../view/ManageRoomsView";
import useRoomController from "../controller/useRoomController";

const ManageRoomsContainer = () => {
  const controller = useRoomController();
  return <ManageRoomsView {...controller} />;
};

export default ManageRoomsContainer;
