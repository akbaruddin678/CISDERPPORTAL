import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import ExamResult from "../../exam/models/ExamResult.js";
import { backfillCurrentRegistrationSections } from "../services/sectionRegistrationBackfill.js";

const ACTIVE_STATUSES = ["Registered", "In-Progress"];
const id = (value) => String(value?._id || value || "");
const sectionOrder = (a, b) => String(a.section).localeCompare(String(b.section), undefined, { numeric: true });

async function buildRegistrationPlan(studentId) {
  const student = await StudentProfile.findById(studentId)
    .select("programId semesterId termId status")
    .lean();
  if (!student || student.status !== "active") return { student, courses: [], alternativeSlots: 0 };
  await backfillCurrentRegistrationSections(student);

  const history = await StudentCourseRegistration.find({ studentId })
    .select("courseId termId status")
    .lean();
  const passed = new Set(history.filter((row) => row.status === "Passed").map((row) => id(row.courseId)));
  const failed = new Set(history.filter((row) => row.status === "Failed").map((row) => id(row.courseId)));
  const active = new Set(history.filter((row) => ACTIVE_STATUSES.includes(row.status)).map((row) => id(row.courseId)));

  // The official report card is authoritative even when an older
  // registration row was never backfilled from Registered to Passed/Failed.
  const verifiedResults = await ExamResult.find({
    studentId,
    status: { $in: ["Verified", "Locked"] },
    isAbsent: false,
  })
    .populate("examId", "courseId totalMarks")
    .lean();
  const totalsByCourse = new Map();
  verifiedResults.forEach((result) => {
    const courseId = id(result.examId?.courseId);
    if (!courseId) return;
    const totals = totalsByCourse.get(courseId) || { obtained: 0, total: 0 };
    totals.obtained += result.obtainedMarks || 0;
    totals.total += result.examId?.totalMarks || 0;
    totalsByCourse.set(courseId, totals);
  });
  totalsByCourse.forEach((totals, courseId) => {
    if (!totals.total) return;
    if ((totals.obtained / totals.total) * 100 >= 50) {
      passed.add(courseId);
      failed.delete(courseId);
    } else {
      failed.add(courseId);
      passed.delete(courseId);
    }
    active.delete(courseId);
  });

  const assignments = await CourseAssignment.find({
    termId: student.termId,
    programId: student.programId,
    $or: [{ semesterId: student.semesterId }, { courseId: { $in: [...failed] } }],
  })
    .populate("courseId", "title code creditHours prerequisites corequisites")
    .sort({ section: 1 })
    .lean();

  const offeredIds = new Set(assignments.map((assignment) => id(assignment.courseId)));
  const failedNotOffered = [...failed].filter((courseId) => !offeredIds.has(courseId));
  const byCourse = new Map();
  for (const assignment of assignments) {
    if (!assignment.courseId) continue;
    const courseId = id(assignment.courseId);
    if (!byCourse.has(courseId)) byCourse.set(courseId, []);
    byCourse.get(courseId).push(assignment);
  }

  const courses = [];
  for (const [courseId, sections] of byCourse) {
    const course = sections[0].courseId;
    const actualCounts = await Promise.all(
      sections.map((section) =>
        StudentCourseRegistration.countDocuments({
          courseAssignmentId: section._id,
          status: { $in: ACTIVE_STATUSES },
        }),
      ),
    );
    await Promise.all(
      sections.map((section, index) =>
        CourseAssignment.updateOne(
          { _id: section._id },
          { $max: { enrolledCount: actualCounts[index] } },
        ),
      ),
    );
    const sectionAvailability = sections.sort(sectionOrder).map((section, index) => ({
      assignmentId: section._id,
      section: section.section,
      capacity: section.capacity,
      enrolled: Math.max(section.enrolledCount || 0, actualCounts[index]),
      seatsRemaining: Math.max(section.capacity - Math.max(section.enrolledCount || 0, actualCounts[index]), 0),
    }));
    const unmetPrerequisites = (course.prerequisites || []).filter((prerequisite) => !passed.has(id(prerequisite)));
    const unmetCorequisites = (course.corequisites || []).filter(
      (corequisite) => !passed.has(id(corequisite)) && !offeredIds.has(id(corequisite)),
    );
    const alreadyEnrolled = active.has(courseId);
    const isRetake = failed.has(courseId);
    const isElective = sections.every((section) => section.courseType === "ELECTIVE");
    let lockReason = "";
    if (passed.has(courseId)) lockReason = "Already completed.";
    else if (alreadyEnrolled) lockReason = "Already registered.";
    else if (unmetPrerequisites.length) lockReason = "Required prerequisite has not been passed.";
    else if (unmetCorequisites.length) lockReason = "Required companion course is not offered this term.";
    else if (!sectionAvailability.some((section) => section.seatsRemaining > 0)) lockReason = "All sections are full.";

    courses.push({
      course,
      courseId,
      courseType: isRetake ? "RETAKE" : isElective ? "ELECTIVE" : "MANDATORY",
      isLocked: Boolean(lockReason),
      lockReason,
      isMandatoryRetake: isRetake,
      alreadyEnrolled,
      sections: sectionAvailability.filter((section) => section.seatsRemaining > 0),
      corequisiteIds: (course.corequisites || []).map(id),
    });
  }

  return {
    student,
    courses,
    alternativeSlots: failedNotOffered.length,
    failedCoursesNotOffered: failedNotOffered,
  };
}

export const getAvailableCourses = asyncHandler(async (req, res) => {
  const plan = await buildRegistrationPlan(req.studentProfileId);
  if (!plan.student) return res.status(404).json({ success: false, message: "Student profile not found." });
  res.status(200).json({
    success: true,
    data: plan.courses,
    registrationPolicy: {
      alternativeElectiveSlots: plan.alternativeSlots,
      message: plan.alternativeSlots
        ? `${plan.alternativeSlots} elective slot(s) are available because failed courses are not offered this term.`
        : "Only mandatory semester courses and available retakes are shown.",
    },
  });
});

export const registerCourses = asyncHandler(async (req, res) => {
  const studentId = req.studentProfileId;
  const requestedIds = new Set((req.body.courseIds || []).map(String));
  const plan = await buildRegistrationPlan(studentId);
  if (!plan.student) return res.status(404).json({ success: false, message: "Student profile not found." });

  const selectable = plan.courses.filter((item) => !item.isLocked && !item.alreadyEnrolled);
  const mandatory = selectable.filter((item) => ["MANDATORY", "RETAKE"].includes(item.courseType));
  const electives = selectable.filter((item) => item.courseType === "ELECTIVE" && requestedIds.has(item.courseId));
  if (electives.length > plan.alternativeSlots) {
    return res.status(409).json({
      success: false,
      message: `You may select at most ${plan.alternativeSlots} elective course(s) this term.`,
    });
  }
  const targets = [...mandatory, ...electives];
  if (!targets.length) {
    return res.status(400).json({ success: false, message: "There are no eligible courses to register." });
  }

  const targetIds = new Set(targets.map((item) => item.courseId));
  for (const item of targets) {
    const missingCorequisite = item.corequisiteIds.find(
      (corequisiteId) => !targetIds.has(corequisiteId) && !plan.courses.some((course) => course.courseId === corequisiteId && course.alreadyEnrolled),
    );
    if (missingCorequisite) {
      return res.status(409).json({ success: false, message: `${item.course.title} must be registered with its companion course.` });
    }
  }

  const semesterMandatory = targets.filter((item) => item.courseType === "MANDATORY");
  const commonSectionLabels = semesterMandatory.length
    ? semesterMandatory[0].sections
        .map((section) => section.section)
        .filter((label) => semesterMandatory.every((item) => item.sections.some((section) => section.section === label)))
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
    : [];
  if (semesterMandatory.length && !commonSectionLabels.length) {
    return res.status(409).json({
      success: false,
      message: "No single section has space across every mandatory course. Ask the Registrar or HOD to align section capacities.",
    });
  }

  const session = await mongoose.startSession();
  const allocations = [];
  try {
    await session.withTransaction(async () => {
      const transactionAllocations = [];
      const persistClaim = async (item, claimed) => {
        await StudentCourseRegistration.create([{
          studentId,
          courseId: claimed.courseId,
          courseAssignmentId: claimed._id,
          section: claimed.section,
          termId: plan.student.termId,
          programId: plan.student.programId,
          semesterId: claimed.semesterId,
          status: "Registered",
          isRetake: item.courseType === "RETAKE",
        }], { session });
        transactionAllocations.push({ courseId: claimed.courseId, assignmentId: claimed._id, section: claimed.section });
      };

      // Claim one common section for the whole mandatory bundle. If Section A
      // fills between screen load and confirmation, release the partial claim
      // and immediately continue with Section B in the same transaction.
      let mandatoryClaims = [];
      for (const label of commonSectionLabels) {
        const attempt = [];
        for (const item of semesterMandatory) {
          const section = item.sections.find((candidate) => candidate.section === label);
          const claimed = section
            ? await CourseAssignment.findOneAndUpdate(
                { _id: section.assignmentId, $expr: { $lt: [{ $ifNull: ["$enrolledCount", 0] }, "$capacity"] } },
                { $inc: { enrolledCount: 1 } },
                { new: true, session },
              )
            : null;
          if (!claimed) {
            await Promise.all(attempt.map(({ assignment }) =>
              CourseAssignment.updateOne({ _id: assignment._id }, { $inc: { enrolledCount: -1 } }, { session }),
            ));
            attempt.length = 0;
            break;
          }
          attempt.push({ item, assignment: claimed });
        }
        if (attempt.length === semesterMandatory.length) {
          mandatoryClaims = attempt;
          break;
        }
      }
      if (semesterMandatory.length && !mandatoryClaims.length) {
        const error = new Error("Sections filled while you were confirming. No common section is currently available across all mandatory courses.");
        error.statusCode = 409;
        throw error;
      }
      for (const { item, assignment } of mandatoryClaims) {
        await persistClaim(item, assignment);
      }

      const remainingTargets = targets.filter((item) => item.courseType !== "MANDATORY");
      for (const item of remainingTargets) {
        let claimed = null;
        for (const section of item.sections) {
          claimed = await CourseAssignment.findOneAndUpdate(
            {
              _id: section.assignmentId,
              $expr: { $lt: [{ $ifNull: ["$enrolledCount", 0] }, "$capacity"] },
            },
            { $inc: { enrolledCount: 1 } },
            { new: true, session },
          );
          if (claimed) break;
        }
        if (!claimed) {
          const error = new Error(`All sections for ${item.course.title} filled while you were registering. Refresh and try again.`);
          error.statusCode = 409;
          throw error;
        }
        await persistClaim(item, claimed);
      }
      allocations.splice(0, allocations.length, ...transactionAllocations);
    });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error?.code === 11000 ? "One or more courses are already registered." : error.message,
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    success: true,
    message: `Registration confirmed for ${allocations.length} course(s).`,
    data: { allocations },
  });
});
