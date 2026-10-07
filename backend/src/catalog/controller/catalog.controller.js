import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Department from "../model/Department.js";
import Program from "../model/Program.js";
import Term from "../model/Term.js";
import Semester from "../model/Semester.js";

export const getCompleteCatalog = asyncHandler(async (req, res) => {
  const { level, excludeLevel } = req.query;

  // 1. Build the program filter based on frontend request
  let programQuery = {};
  if (level) {
    programQuery.level = level;
  }
  if (excludeLevel) {
    programQuery.level = { $ne: excludeLevel };
  }

  // 2. Fetch valid programs first to drive the rest of the cascading queries
  const programs = await Program.find(programQuery)
    .populate("departmentId", "name code")
    .lean();

  // 3. Extract IDs to cascade the filters down (Semesters) and up (Departments)
  const programIds = programs.map((p) => p._id);

  // Safely extract unique Department IDs that are tied ONLY to these valid programs
  const departmentIds = [
    ...new Set(
      programs
        .map(
          (p) => p.departmentId?._id?.toString() || p.departmentId?.toString(),
        )
        .filter(Boolean),
    ),
  ];

  // 4. If a filter was applied, enforce the department query to match only valid IDs
  let departmentQuery = {};
  if (level || excludeLevel) {
    departmentQuery._id = { $in: departmentIds };
  }

  // Terms are a single shared collection for both university semester
  // sessions (termType "semester"/"short") and college annual sessions
  // (termType "annual") — scope them the same way programs/departments/
  // semesters are scoped above, so a university-only request never surfaces
  // a college session (and vice versa).
  let termQuery = { isActive: true };
  if (level === "HSSC") {
    termQuery.termType = "annual";
  } else if (excludeLevel === "HSSC" || (level && level !== "HSSC")) {
    termQuery.termType = { $ne: "annual" };
  }

  // 5. Fetch the remaining catalog data concurrently
  const [departments, terms, semesters] = await Promise.all([
    // Only fetches departments that have at least one valid program
    Department.find(departmentQuery).select("_id name code").lean(),

    Term.find(termQuery).lean(),

    // Only fetch semesters that belong to the filtered programs
    Semester.find({ programId: { $in: programIds } })
      .populate("programId", "name code")
      .lean(),
  ]);

  // 6. Return standard structured response
  res.json({
    success: true,
    data: {
      departments,
      programs,
      terms,
      semesters,
      courses: [], // Safeguard: Empty array so frontend mapping doesn't crash if it expects courses
    },
    counts: {
      departments: departments.length,
      programs: programs.length,
      terms: terms.length,
      semesters: semesters.length,
    },
  });
});
