import React from "react";
import HrRecruitmentView from "../view/HrRecruitmentView";
import useHrRecruitmentController from "../controller/useHrRecruitmentController";
import HrModuleFrame from "../common/HrModuleFrame";

const HrRecruitmentContainer = () => {
  const controllerProps = useHrRecruitmentController();
  return <HrModuleFrame title="Recruitment & hiring"><HrRecruitmentView {...controllerProps} /></HrModuleFrame>;
};

export default HrRecruitmentContainer;
