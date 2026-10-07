import Course from "../models/Course.js";
import CourseAssignment from "../models/CourseAssignment.js";
import mongoose from "mongoose";

export const getAllCourses = async (req, res) => {
  try {
    // Dynamically build the filter based on the query parameters
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.owningDepartmentId)
      filter.owningDepartmentId = req.query.owningDepartmentId;
    if (req.query.proposedBy) filter.proposedBy = req.query.proposedBy;

    if (req.query.search) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ title: regex }, { code: regex }];
    }

    // Program filter — a Course only stores a Department, not a Program, so
    // "courses in this program" is resolved via CourseAssignment (courses
    // a HOD has actually offered/assigned to that program in some term).
    if (req.query.programId) {
      const assignedCourseIds = await CourseAssignment.find({
        programId: req.query.programId,
      }).distinct("courseId");
      filter._id = { $in: assignedCourseIds };
    }

    let query = Course.find(filter)
      .populate("owningDepartmentId", "name code")
      .populate("prerequisites", "code title status")
      .populate("corequisites", "code title status")
      .populate("proposedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    // Pagination is opt-in — only kicks in when the caller explicitly sends
    // page/limit, so the many existing callers that expect the full
    // unpaginated list back (Exam course registration, HOD catalog list,
    // SuperAdmin catalog) keep working exactly as before.
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    if (page && limit) {
      const statsFilter = { ...filter };
      delete statsFilter.status;
      const [total, courses, statsTotal, active, draft, retired] = await Promise.all([
        Course.countDocuments(filter),
        query.skip((page - 1) * limit).limit(limit),
        Course.countDocuments(statsFilter),
        Course.countDocuments({ ...statsFilter, status: "ACTIVE" }),
        Course.countDocuments({ ...statsFilter, status: "DRAFT" }),
        Course.countDocuments({ ...statsFilter, status: "RETIRED" }),
      ]);
      const stats = { total: statsTotal, active, draft, retired };
      return res.status(200).json({
        success: true,
        data: courses,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    }

    const courses = await query;
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    // Course begins strictly as a DRAFT. Code is not required yet — the
    // Registrar assigns one separately via assignCourseCode.
    const courseData = {
      ...req.body,
      status: "DRAFT",
      prerequisites: req.body.prerequisites || [],
      corequisites: req.body.corequisites || [],
      clos: req.body.clos || [],
    };

    const newCourse = new Course(courseData);
    const savedCourse = await newCourse.save();
    await savedCourse.populate([
      { path: "prerequisites", select: "code title" },
      { path: "corequisites", select: "code title" },
    ]);

    res.status(201).json({ success: true, data: savedCourse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    // Prevent edits once a course is active — it must be retired and
    // re-created as a new revision instead of silently changed underneath
    // whichever programs/students already rely on it.
    if (course.status === "ACTIVE") {
      return res.status(403).json({
        success: false,
        message:
          "Cannot edit an active course directly. Must create a new revision.",
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true },
    )
      .populate("owningDepartmentId", "name code")
      .populate("prerequisites", "code title");
    await updatedCourse.populate("corequisites", "code title");

    res.status(200).json({ success: true, data: updatedCourse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Registrar (or Admin) assigns the official course code, which is what
// activates the course — this is the only step between a Draft course and
// an Active one now that the multi-stage approval chain is gone.
export const assignCourseCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "A course code is required to activate this course.",
      });
    }

    const course = await Course.findById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    if (course.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: `Only draft courses can be assigned a code (current status: ${course.status}).`,
      });
    }

    const existingCode = await Course.findOne({
      code: code.trim(),
      _id: { $ne: id },
    });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `The course code ${code} is already assigned to another course.`,
      });
    }

    course.code = code.trim().toUpperCase();
    course.status = "ACTIVE";
    const updatedCourse = await course.save();

    res.status(200).json({ success: true, data: updatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    if (course.status === "ACTIVE") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot delete an ACTIVE course." });
    }

    await Course.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Head of Academia owns prerequisite/corequisite policy. This endpoint is
// intentionally separate from general course editing so an active course's
// title/content cannot be changed through the policy workflow.
export const updateAcademicRules = async (req, res) => {
  try {
    const { id } = req.params;
    const prerequisites = [...new Set((req.body.prerequisites || []).map(String))];
    const corequisites = [...new Set((req.body.corequisites || []).map(String))];
    const allIds = [...prerequisites, ...corequisites];
    if (!mongoose.isValidObjectId(id) || allIds.some((courseId) => !mongoose.isValidObjectId(courseId))) {
      return res.status(400).json({ success: false, message: "Academic rules contain an invalid course." });
    }
    if (allIds.includes(String(id))) {
      return res.status(409).json({ success: false, message: "A course cannot require itself." });
    }
    if (new Set(allIds).size !== allIds.length) {
      return res.status(409).json({ success: false, message: "A course cannot be both a prerequisite and a corequisite." });
    }
    const referenced = await Course.find({ _id: { $in: allIds }, status: { $ne: "RETIRED" } }).select("_id prerequisites").lean();
    if (referenced.length !== allIds.length) {
      return res.status(409).json({ success: false, message: "Every prerequisite and corequisite must be an active catalog course." });
    }
    const ruleGraph = new Map(
      (await Course.find({ status: { $ne: "RETIRED" } }).select("_id prerequisites").lean())
        .map((course) => [String(course._id), (course.prerequisites || []).map(String)]),
    );
    const reachesTarget = (startId) => {
      const pending = [startId];
      const visited = new Set();
      while (pending.length) {
        const current = pending.pop();
        if (current === String(id)) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        pending.push(...(ruleGraph.get(current) || []));
      }
      return false;
    };
    if (prerequisites.some(reachesTarget)) {
      return res.status(409).json({ success: false, message: "This prerequisite would create a dependency cycle." });
    }
    const updated = await Course.findByIdAndUpdate(
      id,
      {
        $set: { prerequisites, corequisites },
        $push: {
          approvalLogs: {
            actorId: req.user._id,
            actorRole: req.user.roles?.includes("head_of_academia") ? "head_of_academia" : "admin",
            action: "ACADEMIC_RULES_UPDATED",
            comments: req.body.reason || "Prerequisite/corequisite policy updated.",
          },
        },
      },
      { new: true },
    ).populate(["prerequisites", "corequisites"]);
    if (!updated) return res.status(404).json({ success: false, message: "Course not found." });
    res.json({ success: true, message: "Academic rules updated.", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
