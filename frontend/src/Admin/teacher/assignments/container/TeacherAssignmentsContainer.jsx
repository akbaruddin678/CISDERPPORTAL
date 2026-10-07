import React from "react";
import { ClipboardList } from "lucide-react";
import AssignmentsListView from "../view/AssignmentsListView";
import useAssignmentsListController from "../controller/useAssignmentsListController";
import CourseSelectGate from "../../components/CourseSelectGate";

const TeacherAssignmentsInner = ({ courseAssignmentId }) => {
  const controller = useAssignmentsListController({ courseAssignmentId });
  return <AssignmentsListView {...controller} />;
};

/**
 * @param {string|null} preselectedClassId - The CourseAssignment _id of the
 *   currently selected course (passed down from TeacherClassesContainer).
 */
const TeacherAssignmentsContainer = ({ preselectedClassId = null }) => {
  // Reached directly from the main dashboard link ("Assignments") — no
  // course has been chosen yet, so let the teacher pick one themselves
  // instead of dead-ending on "Select a course."
  if (!preselectedClassId) {
    return (
      <CourseSelectGate
        icon={ClipboardList}
        title="Assignments"
        description="Create and manage assignments, due dates, and extensions."
      >
        {(courseId) => <TeacherAssignmentsInner courseAssignmentId={courseId} />}
      </CourseSelectGate>
    );
  }

  return <TeacherAssignmentsInner courseAssignmentId={preselectedClassId} />;
};

export default TeacherAssignmentsContainer;
