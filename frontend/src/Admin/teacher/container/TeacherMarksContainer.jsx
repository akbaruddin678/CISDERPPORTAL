import React from "react";
import { GraduationCap } from "lucide-react";
import TeacherMarksView from "../view/TeacherMarkView";
import useTeacherMarksController from "../marks/controller/useTeacherMarksController";
import CourseSelectGate from "../components/CourseSelectGate";

const TeacherMarksInner = ({ courseAssignmentId, embedded }) => {
  const controller = useTeacherMarksController({ courseAssignmentId });
  return <TeacherMarksView embedded={embedded} {...controller} />;
};

/**
 * @param {string|null} preselectedClassId - The CourseAssignment _id of the
 *   currently selected course (passed down from TeacherClassesContainer).
 * @param {boolean} embedded - When true, suppresses the outer page header/padding
 *   so the view fits neatly inside the parent layout.
 */
const TeacherMarksContainer = ({ preselectedClassId = null, embedded = false }) => {
  // Reached directly from the main dashboard link ("Upload Exam Marks") — no
  // course has been chosen yet, so let the teacher pick one themselves
  // instead of dead-ending on "Select a course."
  if (!preselectedClassId && !embedded) {
    return (
      <CourseSelectGate
        icon={GraduationCap}
        title="Exam Marks"
        description="Mark a past exam complete, enter marks, then publish for HOD review."
      >
        {(courseId) => <TeacherMarksInner courseAssignmentId={courseId} embedded />}
      </CourseSelectGate>
    );
  }

  if (!preselectedClassId) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm font-medium">
        Select a course to enter exam marks.
      </div>
    );
  }

  return <TeacherMarksInner courseAssignmentId={preselectedClassId} embedded={embedded} />;
};

export default TeacherMarksContainer;
