import React from "react";
import InstallmentConfigurationController from "../controller/InstallmentConfigurationController";
import InstallmentConfigurationView from "../view/Installment/InstallmentConfigurationView";

const InstallmentConfigurationContainer = () => {
  return (
    <InstallmentConfigurationController>
      {(data) => <InstallmentConfigurationView data={data} />}
    </InstallmentConfigurationController>
  );
};

export default InstallmentConfigurationContainer;
