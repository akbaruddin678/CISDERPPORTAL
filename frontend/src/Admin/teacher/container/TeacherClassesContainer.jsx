import React from "react";
import TeacherClassesView from "../view/TeacherClassesView";
import TeacherAttendanceContainer from "./TeacherAttendanceContainer";
import TeacherMarksContainer from "./TeacherMarksContainer";
import TeacherAssignmentsContainer from "../assignments/container/TeacherAssignmentsContainer";
import useTeacherClassesController from "../controller/useTeacherClassesController";

const TeacherClassesContainer = () => {
  const controller = useTeacherClassesController();

  return (
    <TeacherClassesView
      {...controller}
      // Embed the full working modules — they auto-select the current course
      attendanceModule={
        <TeacherAttendanceContainer
          preselectedClassId={controller.selectedCourseId}
          embedded={true}
        />
      }
      marksModule={
        <TeacherMarksContainer
          preselectedClassId={controller.selectedCourseId}
          embedded={true}
        />
      }
      assignmentsModule={
        <TeacherAssignmentsContainer
          preselectedClassId={controller.selectedCourseId}
        />
      }
    />
  );
};

export default TeacherClassesContainer;
