import React from "react";
import { useHostelManagerController } from "../controller/HostelManagerController";
import HostelManagerView from "../view/Hostel/HostelManagerView";

export default function HostelManagerContainer() {
  const controllerData = useHostelManagerController();

  return <HostelManagerView {...controllerData} />;
}
