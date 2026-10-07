import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Program from "../model/Program.js";
import Semester from "../model/Semester.js";
import { semesterUsage, describeSemesterUsage } from "../utils/semesterUsage.js";

const MAX_STAGES = 14;

export const getAllPrograms = async (req, res) => {
  try {
    const {
      context,
      page = 1,
      limit = 50,
      search = "",
      departmentId,
    } = req.query;

    let matchStage = {};
    const collegeKeywords = [
      "HSSC",
      "INTERMEDIATE",
      "FSC",
      "FA",
      "ICS",
      "ICOM",
    ];

    if (context === "college") {
      matchStage.level = { $in: collegeKeywords };
    } else if (context === "university") {
      matchStage.level = { $nin: collegeKeywords };
    }

    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      matchStage.departmentId = new mongoose.Types.ObjectId(departmentId);
    }

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "departmentDetails",
        },
      },
      {
        $unwind: {
          path: "$departmentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ];

    const result = await Program.aggregate(pipeline);

    const formattedData = result[0].data.map((prog) => ({
      ...prog,
      departmentId: prog.departmentDetails || null,
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
      total: result[0].metadata[0]?.total || 0,
    });
  } catch (error) {
    console.error("Program Fetch Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch programs" });
  }
};

export const getProgramsByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const items = await Program.find({ departmentId })
    .populate("departmentId", "name code")
    .lean();
  res.status(200).json({ success: true, count: items.length, data: items });
});

export const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id).populate(
    "departmentId",
  );
  if (!program)
    return res.status(404).json({ success: false, error: "Program not found" });
  res.status(200).json({ success: true, data: program });
});

export const createProgram = asyncHandler(async (req, res) => {
  const { name, code, departmentId, level, durationStages } = req.body;

  const stages = Number(durationStages);
  if (!Number.isInteger(stages) || stages < 1 || stages > MAX_STAGES) {
    return res.status(400).json({
      success: false,
      error: `Number of semesters must be a whole number between 1 and ${MAX_STAGES}.`,
    });
  }

  const program = await Program.create({
    name,
    code,
    departmentId,
    level,
    durationStages: stages,
  });

  const semestersToCreate = [];
  for (let i = 1; i <= stages; i++) {
    const stageName =
      level === "HSSC" || level === "DIPLOMA" ? `Part ${i}` : `Semester ${i}`;
    semestersToCreate.push({
      programId: program._id,
      name: stageName,
      number: i,
    });
  }

  if (semestersToCreate.length > 0) {
    await Semester.insertMany(semestersToCreate);
  }

  res
    .status(201)
    .json({ success: true, message: "Program created", data: program });
});

export const updateProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, departmentId, level, durationStages } = req.body;

  const program = await Program.findById(id);
  if (!program)
    return res.status(404).json({ success: false, error: "Program not found" });

  program.name = name || program.name;
  program.code = code || program.code;
  program.departmentId = departmentId || program.departmentId;
  program.level = level || program.level;

  let removedDuplicates = 0;

  if (durationStages !== undefined && durationStages !== null) {
    const newDuration = Number(durationStages);
    if (!Number.isInteger(newDuration) || newDuration < 1 || newDuration > MAX_STAGES) {
      return res.status(400).json({
        success: false,
        error: `Number of semesters must be a whole number between 1 and ${MAX_STAGES}.`,
      });
    }

    // Reconcile against the semesters that ACTUALLY exist, not the stored
    // duration number — the two can drift apart (legacy field names, older
    // double-generation), and trusting the stored number left extra
    // semesters behind even after the duration was reduced.
    const existing = await Semester.find({ programId: id }).sort({ number: 1, createdAt: 1 });

    const outOfRange = existing.filter((s) => s.number > newDuration);
    const inUse = await semesterUsage(outOfRange);
    if (inUse.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Can't reduce to ${newDuration} semesters — ${inUse.join("; ")}. Move or remove those first.`,
      });
    }

    // Duplicate copies of the same number inside the range: keep one (the
    // one in use, else the oldest) and drop unused extras. A duplicate that
    // is in use is kept — never delete anything that has data on it.
    const byNumber = new Map();
    existing
      .filter((s) => s.number <= newDuration)
      .forEach((s) => byNumber.set(s.number, [...(byNumber.get(s.number) || []), s]));
    const toDelete = outOfRange.map((s) => s._id);
    for (const group of byNumber.values()) {
      if (group.length < 2) continue;
      const used = [];
      for (const sem of group) {
        // eslint-disable-next-line no-await-in-loop
        used.push((await describeSemesterUsage(sem)).length > 0);
      }
      const keepIdx = used.includes(true) ? used.indexOf(true) : 0;
      group.forEach((sem, i) => {
        if (i !== keepIdx && !used[i]) {
          toDelete.push(sem._id);
          removedDuplicates += 1;
        }
      });
    }
    if (toDelete.length > 0) {
      await Semester.deleteMany({ _id: { $in: toDelete } });
    }

    const have = new Set(existing.filter((s) => s.number <= newDuration).map((s) => s.number));
    // Upsert by (program, number) rather than blind insert, so a double
    // click / retried request can never create a second "Semester N".
    const upserts = [];
    for (let i = 1; i <= newDuration; i++) {
      if (have.has(i)) continue;
      upserts.push({
        updateOne: {
          filter: { programId: program._id, number: i },
          update: {
            $setOnInsert: {
              programId: program._id,
              number: i,
              name:
                program.level === "HSSC" || program.level === "DIPLOMA"
                  ? `Part ${i}`
                  : `Semester ${i}`,
              isActive: true,
              courses: [],
            },
          },
          upsert: true,
        },
      });
    }
    if (upserts.length > 0) {
      await Semester.bulkWrite(upserts);
    }
    program.durationStages = newDuration;
  }

  const currentSemesters = await Semester.find({ programId: id });

  for (const sem of currentSemesters) {
    const correctName =
      program.level === "HSSC" || program.level === "DIPLOMA"
        ? `Part ${sem.number}`
        : `Semester ${sem.number}`;

    const semNameLow = sem.name?.toLowerCase() || "";

    if (
      !sem.name ||
      semNameLow.includes("part") ||
      semNameLow.includes("semester")
    ) {
      if (sem.name !== correctName) {
        sem.name = correctName;
        await sem.save();
      }
    }
  }

  await program.save();

  // ✅ NEW FIX: Hard-delete the old legacy fields from the database document
  await Program.collection.updateOne(
    { _id: program._id },
    { $unset: { durationSemesters: "", duration: "" } },
  );

  // Re-fetch the perfectly clean document to send back to frontend
  const cleanProgram = await Program.findById(id);

  res.status(200).json({
    success: true,
    message: removedDuplicates ? `Program updated. Removed ${removedDuplicates} duplicate semester(s).` : "Program updated successfully",
    data: cleanProgram,
  });
});

export const toggleProgramStatus = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program)
    return res.status(404).json({ success: false, error: "Program not found" });

  program.isActive = !program.isActive;
  await program.save();
  res.status(200).json({
    success: true,
    message: `Program ${program.isActive ? "activated" : "deactivated"}`,
    data: program,
  });
});

export const deleteProgram = asyncHandler(async (req, res) => {
  await Program.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Program deleted" });
});
