import React from "react";
import MasterTimetableView from "../../Registrar/view/MasterTimetableView";
import { useExamTimetableController } from "../controller/useExamTimetableController";
import ExamModuleFrame from "../common/ExamModuleFrame";

// Read-only weekly timetable browser for Exam staff, with real Department/
// Program/Term filters resolved server-side — no create/delete ability
// (that stays with Registrar/HOD, who own the schedule).
const ExamTimetableContainer = () => {
  const controller = useExamTimetableController();

  return (
    <ExamModuleFrame title="Class Timetable">
      <MasterTimetableView
        {...controller}
        title="Class Timetable"
        subtitle="Browse the university's weekly class schedule, filtered by department, program, or session."
        allowCreate={false}
      />
    </ExamModuleFrame>
  );
};

export default ExamTimetableContainer;
