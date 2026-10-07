import React from "react";
import GraduationWorkspaceContainer from "./GraduationWorkspaceContainer";
import useClearanceOffices from "../controller/useClearanceOffices";
import ClearanceOfficesView from "../view/ClearanceOfficesView";

// One tiny page per desk — the route table renders pages without props.
export const HodGraduationPage = () => <GraduationWorkspaceContainer mode="hod" />;
export const ExamGraduationPage = () => <GraduationWorkspaceContainer mode="exam" />;
export const ClearanceDeskPage = () => <GraduationWorkspaceContainer mode="desk" />;
export const FinanceGraduationPage = () => <GraduationWorkspaceContainer mode="finance" />;
export const RegistrarGraduationPage = () => <GraduationWorkspaceContainer mode="registrar" />;

export const ClearanceOfficesPage = () => {
  const c = useClearanceOffices();
  return <ClearanceOfficesView c={c} />;
};
