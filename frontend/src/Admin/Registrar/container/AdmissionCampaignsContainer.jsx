import React from "react";
import { useAdmissionCampaignsController } from "../controller/useAdmissionCampaignsController";
import AdmissionCampaignsView from "../view/AdmissionCampaignsView";
import RegistrarModuleFrame from "../common/RegistrarModuleFrame";

const AdmissionCampaignsContainer = () => {
  const controller = useAdmissionCampaignsController();
  return <RegistrarModuleFrame title="Admission campaigns"><AdmissionCampaignsView {...controller} /></RegistrarModuleFrame>;
};

export default AdmissionCampaignsContainer;
