import React from "react";
import { useAdmssionController } from "../controller/useAdmssionController";
import AdmissionHomeView from "../view/AdmssionHomeView";

const AdmissionMainContainer = () => {
  const controller = useAdmssionController();
  return <AdmissionHomeView {...controller} />;
};

export default AdmissionMainContainer;
