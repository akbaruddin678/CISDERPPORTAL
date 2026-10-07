import { asyncHandler } from "../../core/utils/asyncHandler.js";
import TimetableEntry from "../models/TimetableEntry.js";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import Program from "../../catalog/model/Program.js";
import Room from "../models/Room.js";
import { assertProgramInScope } from "../../course/middleware/courseAssignmentScope.js";

const ASSIGNMENT_POPULATE = [
  { path: "courseId", select: "title code" },
  {
    path: "programId",
    select: "name departmentId",
    populate: { path: "departmentId", select: "name" },
  },
  { path: "semesterId", select: "number" },
  { path: "termId", select: "name" },
  {
    path: "instructorId",
    populate: { path: "personalInfo", model: "Person", select: "name" },
  },
];

const getDepartmentProgramIds = async (departmentId) => {
  const programs = await Program.find({ departmentId }).select("_id").lean();
  return programs.map((p) => String(p._id));
};

// Room identity/capacity now live on one Room doc (see models/Room.js), so
// this no longer needs to reconcile free-text room names case-insensitively
// or guard against the same room name being registered with two different
// capacities — both of those were workarounds for not having a real entity.
export const validateTimetablePlacement = async ({ day, slot, roomId, roomCapacity, roomName, assignment, excludeId }) => {
  const conflicts = [];
  const entryFilter = { day, slot, ...(excludeId ? { _id: { $ne: excludeId } } : {}) };
  const existingEntries = await TimetableEntry.find(entryFilter)
    .populate({ path: "courseAssignmentId", select: "instructorId programId semesterId termId section courseType", populate: { path: "courseId", select: "code title" } })
    .lean();

  const roomConflict = existingEntries.find((entry) => idOf(entry.roomId) === idOf(roomId));
  if (roomConflict) conflicts.push(`${roomName} is already occupied by ${roomConflict.courseAssignmentId?.courseId?.code || "another class"} at this time.`);

  if (assignment.instructorId) {
    const teacherConflict = existingEntries.find(
      (entry) => idOf(entry.courseAssignmentId?.instructorId) === idOf(assignment.instructorId),
    );
    if (teacherConflict) conflicts.push(`The assigned teacher is already teaching ${teacherConflict.courseAssignmentId?.courseId?.code || "another class"} at this time.`);
  }

  if (assignment.courseType !== "ELECTIVE") {
    const cohortConflict = existingEntries.find((entry) => {
      const other = entry.courseAssignmentId;
      return other?.courseType !== "ELECTIVE" && idOf(other?.termId) === idOf(assignment.termId) && idOf(other?.programId) === idOf(assignment.programId) && idOf(other?.semesterId) === idOf(assignment.semesterId) && String(other?.section) === String(assignment.section);
    });
    if (cohortConflict) conflicts.push(`Section ${assignment.section} already has mandatory course ${cohortConflict.courseAssignmentId?.courseId?.code || "scheduled"} at this time.`);
  } else {
    // Two electives at the same slot are fine unless a specific student is
    // actually registered in both — a blanket same-section-electives clash
    // would wrongly block unrelated electives that happen to share a section
    // label but serve different students.
    const otherElectives = existingEntries.filter(
      (entry) => entry.courseAssignmentId?.courseType === "ELECTIVE" && idOf(entry.courseAssignmentId?._id) !== idOf(assignment._id),
    );
    for (const entry of otherElectives) {
      // eslint-disable-next-line no-await-in-loop
      if (await electiveRostersOverlap(assignment._id, entry.courseAssignmentId._id)) {
        conflicts.push(
          `This elective shares at least one registered student with ${entry.courseAssignmentId?.courseId?.code || "another elective"} scheduled at the same time.`,
        );
        break;
      }
    }
  }

  const enrolled = await StudentCourseRegistration.countDocuments({
    courseAssignmentId: assignment._id,
    status: { $in: ["Registered", "In-Progress"] },
  });
  const expectedAttendance = Math.max(enrolled, assignment.enrolledCount || 0);
  if (expectedAttendance > roomCapacity) {
    conflicts.push(`${roomName} holds ${roomCapacity}, but Section ${assignment.section} has ${expectedAttendance} registered students.`);
  }
  return conflicts;
};

const idOf = (value) => String(value?._id || value || "");

const ACTIVE_REGISTRATION_STATUSES = ["Registered", "In-Progress"];

// True only if some student is actually registered in BOTH sections right
// now — not just that both happen to be electives at the same slot.
export async function electiveRostersOverlap(assignmentIdA, assignmentIdB) {
  const rosterA = await StudentCourseRegistration.find({
    courseAssignmentId: assignmentIdA,
    status: { $in: ACTIVE_REGISTRATION_STATUSES },
  })
    .select("studentId")
    .lean();
  if (!rosterA.length) return false;
  return Boolean(
    await StudentCourseRegistration.exists({
      courseAssignmentId: assignmentIdB,
      status: { $in: ACTIVE_REGISTRATION_STATUSES },
      studentId: { $in: rosterA.map((r) => r.studentId) },
    }),
  );
}

// Read-only picker source for the "which class am I scheduling" dropdown —
// every course assignment across every department for Registrar/Admin, but
// scoped to just the caller's own department for an HOD.
export const getSchedulableAssignments = asyncHandler(async (req, res) => {
  const { termId, programId } = req.query;
  const query = {};
  if (termId) query.termId = termId;

  if (req.hodDepartmentId) {
    const scopedProgramIds = await getDepartmentProgramIds(req.hodDepartmentId);
    if (programId) {
      if (!scopedProgramIds.includes(String(programId))) {
        return res.status(403).json({
          success: false,
          message: "That program is outside your department.",
        });
      }
      query.programId = programId;
    } else {
      query.programId = { $in: scopedProgramIds };
    }
  } else if (programId) {
    query.programId = programId;
  }

  const assignments = await CourseAssignment.find(query)
    .populate(ASSIGNMENT_POPULATE)
    .lean();

  res.status(200).json({ success: true, data: assignments });
});

// Supports optional filters — day, termId, programId, departmentId — so both
// the Exam module's filter toolbar and HOD's department scoping can narrow
// results server-side instead of loading everything and filtering client-side.
export const getTimetableEntries = asyncHandler(async (req, res) => {
  const { day, termId, programId, departmentId } = req.query;

  const query = {};
  if (day) query.day = day;

  const caFilters = {};
  if (termId) caFilters.termId = termId;

  if (req.hodDepartmentId) {
    caFilters.programId = { $in: await getDepartmentProgramIds(req.hodDepartmentId) };
    if (programId) {
      // Narrow further to the requested program, but only if it's actually
      // within the HOD's own department.
      caFilters.programId = caFilters.programId.$in.includes(String(programId))
        ? programId
        : { $in: [] }; // outside scope — resolves to no results, not an error
    }
  } else if (programId) {
    caFilters.programId = programId;
  } else if (departmentId) {
    caFilters.programId = { $in: await getDepartmentProgramIds(departmentId) };
  }

  if (Object.keys(caFilters).length > 0) {
    const matching = await CourseAssignment.find(caFilters).select("_id").lean();
    query.courseAssignmentId = { $in: matching.map((a) => a._id) };
  }

  const entries = await TimetableEntry.find(query)
    .populate({ path: "courseAssignmentId", populate: ASSIGNMENT_POPULATE })
    .populate("roomId", "name capacity")
    .sort({ day: 1, slot: 1 })
    .lean();

  res.status(200).json({ success: true, data: entries });
});

export const createTimetableEntry = asyncHandler(async (req, res) => {
  const { day, slot, courseAssignmentId, roomId } = req.body;
  if (!day || !slot || !courseAssignmentId || !roomId) {
    return res.status(400).json({
      success: false,
      message: "day, slot, courseAssignmentId and roomId are required.",
    });
  }

  const room = await Room.findById(roomId).lean();
  if (!room || !room.isActive) {
    return res.status(404).json({ success: false, message: "Room not found or inactive." });
  }

  const assignment = await CourseAssignment.findById(courseAssignmentId)
    .select("_id programId semesterId termId courseId instructorId section courseType enrolledCount capacity")
    .lean();
  if (!assignment) {
    return res.status(404).json({ success: false, message: "Course assignment not found." });
  }

  if (req.hodDepartmentId && !(await assertProgramInScope(req, assignment.programId))) {
    return res.status(403).json({
      success: false,
      message: "You can only schedule courses within your own department.",
    });
  }

  const conflicts = await validateTimetablePlacement({
    day,
    slot,
    roomId,
    roomCapacity: room.capacity,
    roomName: room.name,
    assignment,
  });
  if (conflicts.length) {
    return res.status(409).json({
      success: false,
      message: "This timetable entry conflicts with the current schedule.",
      conflicts,
    });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();

  const entry = await TimetableEntry.create({
    day,
    slot,
    courseAssignmentId,
    roomId,
    createdBy: staffProfile?._id,
  });

  res.status(201).json({ success: true, message: "Timetable entry created.", data: entry });
});

export const updateTimetableEntry = asyncHandler(async (req, res) => {
  const { day, slot, roomId, courseAssignmentId } = req.body;
  const entry = await TimetableEntry.findById(req.params.id).populate({
    path: "courseAssignmentId",
    select: "programId",
  });
  if (!entry) {
    return res.status(404).json({ success: false, message: "Timetable entry not found." });
  }

  if (req.hodDepartmentId && !(await assertProgramInScope(req, entry.courseAssignmentId?.programId))) {
    return res.status(403).json({
      success: false,
      message: "You can only modify timetable entries within your own department.",
    });
  }

  if (courseAssignmentId) {
    const newAssignment = await CourseAssignment.findById(courseAssignmentId)
      .select("programId")
      .lean();
    if (!newAssignment) {
      return res.status(404).json({ success: false, message: "Course assignment not found." });
    }
    if (req.hodDepartmentId && !(await assertProgramInScope(req, newAssignment.programId))) {
      return res.status(403).json({
        success: false,
        message: "You can only assign courses within your own department.",
      });
    }
  }

  const nextDay = day || entry.day;
  const nextSlot = slot || entry.slot;
  const nextRoomId = roomId || entry.roomId;
  const nextRoom = await Room.findById(nextRoomId).lean();
  if (!nextRoom || !nextRoom.isActive) {
    return res.status(404).json({ success: false, message: "Room not found or inactive." });
  }
  const nextAssignmentId = courseAssignmentId || entry.courseAssignmentId?._id || entry.courseAssignmentId;
  const nextAssignment = await CourseAssignment.findById(nextAssignmentId)
    .select("_id programId semesterId termId courseId instructorId section courseType enrolledCount capacity")
    .lean();
  const conflicts = await validateTimetablePlacement({
    day: nextDay,
    slot: nextSlot,
    roomId: nextRoomId,
    roomCapacity: nextRoom.capacity,
    roomName: nextRoom.name,
    assignment: nextAssignment,
    excludeId: entry._id,
  });
  if (conflicts.length) {
    return res.status(409).json({
      success: false,
      message: "This timetable entry conflicts with the current schedule.",
      conflicts,
    });
  }

  entry.day = nextDay;
  entry.slot = nextSlot;
  entry.roomId = nextRoomId;
  if (courseAssignmentId) entry.courseAssignmentId = courseAssignmentId;
  await entry.save();

  res.status(200).json({ success: true, message: "Timetable entry updated.", data: entry });
});

export const deleteTimetableEntry = asyncHandler(async (req, res) => {
  const entry = await TimetableEntry.findById(req.params.id).populate({
    path: "courseAssignmentId",
    select: "programId",
  });
  if (!entry) {
    return res.status(404).json({ success: false, message: "Timetable entry not found." });
  }

  if (req.hodDepartmentId && !(await assertProgramInScope(req, entry.courseAssignmentId?.programId))) {
    return res.status(403).json({
      success: false,
      message: "You can only remove timetable entries within your own department.",
    });
  }

  await TimetableEntry.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Timetable entry removed." });
});
