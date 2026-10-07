import React from "react";
import MasterTimetableView from "../../../Registrar/view/MasterTimetableView";
import { useTeacherScheduleController } from "../controller/useTeacherScheduleController";

// Read-only weekly schedule for the logged-in teacher — reuses the same
// grid component the Registrar/HOD use to build the timetable, just scoped
// to this teacher's own courses and stripped of any create/manage ability.
const TeacherScheduleContainer = () => {
  const controller = useTeacherScheduleController();

  return (
    <MasterTimetableView
      {...controller}
      title="My Schedule"
      subtitle="Your weekly class timetable — day, time, and room for every course you teach."
      allowCreate={false}
      statLabels={{
        total: "Classes / Week",
        departments: "Programs",
        faculty: "Courses",
        rooms: "Rooms Used",
      }}
    />
  );
};

export default TeacherScheduleContainer;
