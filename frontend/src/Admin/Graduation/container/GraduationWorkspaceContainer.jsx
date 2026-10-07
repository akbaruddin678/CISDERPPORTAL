import React from "react";
import useGraduationWorkspace from "../controller/useGraduationWorkspace";
import useClearanceDrawer from "../controller/useClearanceDrawer";
import GraduationWorkspaceView from "../view/GraduationWorkspaceView";
import ClearanceDrawer from "../view/ClearanceDrawer";

// Keyed by clearance id so each opened clearance starts with a clean form.
const DrawerHost = ({ id, notify, onClose }) => {
  const c = useClearanceDrawer({ id, notify });
  return <ClearanceDrawer c={c} onClose={onClose} />;
};

const GraduationWorkspaceContainer = ({ mode }) => {
  const w = useGraduationWorkspace(mode);
  return (
    <GraduationWorkspaceView
      w={w}
      drawer={
        w.selectedId ? (
          <DrawerHost key={w.selectedId} id={w.selectedId} notify={w.notify} onClose={w.closeClearance} />
        ) : null
      }
    />
  );
};

export default GraduationWorkspaceContainer;
