import CourseAssignment from "../../coursemanagement/model/CourseAssignment.js"; 
import StudentCourseRegistration from "../../coursemanagement/model/StudentCourseRegistration.js";
import Course from "../../catalog/model/Course.js";

export const getAvailableCoursesForStudent = async (req, res) => {
  try {
    const { studentId, termId, programId, semesterId } = req.query;

    const offeredAssignments = await CourseAssignment.find({
      termId,
      programId,
      semesterId,
    }).populate("courseId");

   
    const studentHistory = await StudentCourseRegistration.find({ studentId });


    const passedCourseIds = studentHistory
      .filter((h) => h.status === "Passed")
      .map((h) => h.courseId.toString());
    const failedCourseIds = studentHistory
      .filter((h) => h.status === "Failed")
      .map((h) => h.courseId.toString());
    const currentlyTakingIds = studentHistory
      .filter((h) => ["Registered", "In-Progress"].includes(h.status))
      .map((h) => h.courseId.toString());

    const processedCourses = offeredAssignments.map((assignment) => {
      const course = assignment.courseId;
      const courseIdStr = course._id.toString();

      let isLocked = false;
      let lockReason = "";
      let isMandatoryRetake = false;

      if (
        passedCourseIds.includes(courseIdStr) ||
        currentlyTakingIds.includes(courseIdStr)
      ) {
        isLocked = true;
        lockReason = "Already completed or enrolled.";
      }

      if (failedCourseIds.includes(courseIdStr)) {
        isMandatoryRetake = true;
      }


      if (
        !isLocked &&
        course.prerequisites &&
        course.prerequisites.length > 0
      ) {
        const unmetPrereqs = course.prerequisites.filter(
          (prereqId) => !passedCourseIds.includes(prereqId.toString()),
        );

        if (unmetPrereqs.length > 0) {
          isLocked = true;
          lockReason = "Prerequisites not met.";
        }
      }

      return {
        assignmentId: assignment._id,
        course: course,
        isLocked,
        lockReason,
        isMandatoryRetake,
      };
    });

    res.status(200).json({ success: true, data: processedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
