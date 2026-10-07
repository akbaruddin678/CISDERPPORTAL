import React from "react";
import useAssignmentEditorController from "../controller/useAssignmentEditorController";
import AssignmentEditorView from "../view/AssignmentEditorView";

const AssignmentEditorContainer = () => {
  const controller = useAssignmentEditorController();
  return <AssignmentEditorView {...controller} />;
};

export default AssignmentEditorContainer;
