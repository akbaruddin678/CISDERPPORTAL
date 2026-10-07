import React from "react";
import MasterTimetableView from "../../Registrar/view/MasterTimetableView";
import { useMasterTimetableController } from "../../Registrar/controller/useMasterTimetableController";

// Reuses the exact same weekly-grid UI and create/delete flow the Registrar
// uses — the backend (resolveHodDepartment) already scopes every read and
// write down to the HOD's own department, so no extra filtering is needed
// here beyond swapping the header copy.
const HodTimetableContainer = () => {
  const controller = useMasterTimetableController();

  return (
    <MasterTimetableView
      {...controller}
      title="Class Timetable"
      subtitle="Schedule and manage your department's weekly class timetable."
    />
  );
};

export default HodTimetableContainer;
