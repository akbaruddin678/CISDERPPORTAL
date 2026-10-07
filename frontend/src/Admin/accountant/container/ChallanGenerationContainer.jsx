import React from "react";
import ChallanGenerationController from "../controller/ChallanGenerationController";
import ChallanGenerationView from "../view/ChallanGeneration/ChallanGenerationView";

const ChallanGenerationContainer = () => {
  return (
    <ChallanGenerationController>
      {(props) => <ChallanGenerationView {...props} />}
    </ChallanGenerationController>
  );
};

export default ChallanGenerationContainer;
