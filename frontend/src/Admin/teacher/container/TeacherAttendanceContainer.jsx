import React from "react";
import { Users } from "lucide-react";
import TeacherAttendanceView from "../view/TeacherViewAttendence";
import useTeacherAttendanceController from "../attendance/controller/useTeacherAttendanceController";
import CourseSelectGate from "../components/CourseSelectGate";

const TeacherAttendanceInner = ({ courseAssignmentId, embedded }) => {
  const controller = useTeacherAttendanceController({ courseAssignmentId });
  return <TeacherAttendanceView embedded={embedded} {...controller} />;
};

/**
 * @param {string|null} preselectedClassId - The CourseAssignment _id of the
 *   currently selected course (passed down from TeacherClassesContainer).
 * @param {boolean} embedded - When true, suppresses the outer page header/padding
 *   so the view fits neatly inside the parent layout.
 */
const TeacherAttendanceContainer = ({ preselectedClassId = null, embedded = false }) => {
  // Reached directly from the main dashboard link ("Mark Attendance") — no
  // course has been chosen yet, so let the teacher pick one themselves
  // instead of dead-ending on "Select a course."
  if (!preselectedClassId && !embedded) {
    return (
      <CourseSelectGate
        icon={Users}
        title="Attendance"
        description="Mark daily attendance and review class/student reports."
      >
        {(courseId) => <TeacherAttendanceInner courseAssignmentId={courseId} embedded />}
      </CourseSelectGate>
    );
  }

  if (!preselectedClassId) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm font-medium">
        Select a course to manage attendance.
      </div>
    );
  }

  return <TeacherAttendanceInner courseAssignmentId={preselectedClassId} embedded={embedded} />;
};

export default TeacherAttendanceContainer;
