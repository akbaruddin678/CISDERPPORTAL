import React from "react";
import useLectureEditorController from "../controller/useLectureEditorController";
import LectureEditorView from "../view/LectureEditorView";

const LectureEditorContainer = () => {
  const controller = useLectureEditorController();
  return <LectureEditorView {...controller} />;
};

export default LectureEditorContainer;
