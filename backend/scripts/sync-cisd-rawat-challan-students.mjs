import path from "node:path";
import { createRequire } from "node:module";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import School from "../src/school/model/School.js";
import Department from "../src/catalog/model/Department.js";
import Program from "../src/catalog/model/Program.js";
import Semester from "../src/catalog/model/Semester.js";
import Term from "../src/catalog/model/Term.js";
import User from "../src/user/model/User.js";
import Person from "../src/core/models/Person.js";
import StudentProfile from "../src/student/models/StudentProfile.js";
import PersonalInfo from "../src/student/models/PersonalInfo.js";
import FamilyInfo from "../src/student/models/FamilyInfo.js";
import Enrollment from "../src/student/models/Enrollment.js";
import StudentAuth from "../src/student/models/StudentAuth.js";

dotenv.config();

const frontendRequire = createRequire(new URL("../../frontend/package.json", import.meta.url));
const XLSX = frontendRequire("xlsx");

const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
const sourcePath = path.resolve(
  sourceArg?.slice("--source=".length)
    || "C:/Users/USET/Downloads/College_Fee_Challan_Automated.xlsm",
);
const audit = process.argv.includes("--audit");
const apply = process.argv.includes("--apply") && !audit;

const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizeName = (value) => normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const correctedNameAliases = new Map([
  ["haleemasadiamalik", "haleemasadia"],
  ["warishakaram", "warishaakram"],
  ["maryamahmad", "maryamahmed"],
  ["abdulmoiz", "moizzunaira"],
  ["kashifhussain", "kashif"],
  ["sardarwasikzubair", "sardarwasik"],
  ["rajamuhammadhashirali", "hashir"],
  ["saverafirdous", "sawairafardoos"],
  ["zarminabibi", "zarmeenabibi"],
  ["hamnaemanyasir", "hamnaeman"],
  ["minahilbashir", "minahilbasheer"],
  ["laraibmuqaddas", "laibamuqaddas"],
]);

const nameKeys = (name) => {
  const key = normalizeName(name);
  const keys = new Set([key]);
  if (key.startsWith("muhammad") && key.length > "muhammad".length) {
    keys.add(`m${key.slice("muhammad".length)}`);
  }
  if (correctedNameAliases.has(key)) keys.add(correctedNameAliases.get(key));
  return [...keys];
};

const normalizeProgram = (value) => {
  const key = normalizeName(value);
  if (key.includes("fashion")) return { name: "Fashion Designing", suffix: "FD" };
  if (key.includes("graphic")) return { name: "Graphic Designing", suffix: "GD" };
  if (key.includes("digital")) return { name: "Digital Marketing", suffix: "DM" };
  if (key.includes("office")) return { name: "Office Management", suffix: "OM" };
  if (key.includes("comp")) return { name: "Computer Applications", suffix: "CA" };
  if (key.includes("beaut")) return { name: "Beautician", suffix: "BT" };
  throw new Error(`Unrecognized program/group: ${value}`);
};

const existingProgramCodes = {
  "09:FD": "FD001",
  "09:GD": "GD001",
  "10:FD": "FD002",
  "10:GD": "GD002",
  "11:GD": "GD003",
  "12:FD": "FD004",
  "12:GD": "GD004",
  "SC:DM": "CISDSCDM",
  "SC:OM": "CISDSCOM",
  "SC:CA": "CISDSCCA",
  "SC:BT": "CISDSCBT",
};

const parseShortCourseDate = (value) => {
  const source = normalizeText(value).replace(/^starting\s*/i, "");
  const normalized = source
    .replace(/july/i, "Jul")
    .replace(/may/i, "May")
    .replace(/-/g, " ");
  const parts = normalized.split(/\s+/);
  if (parts.length !== 3) throw new Error(`Unrecognized short-course session: ${value}`);
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const day = Number(parts[0]);
  const month = Number(parts[1]) || months[parts[1].slice(0, 3).toLowerCase()];
  const year = Number(parts[2]);
  if (!day || !month || !year) throw new Error(`Unrecognized short-course session: ${value}`);
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const label = new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return {
    name: `Short Course — ${label}`,
    code: `CISD-SC-${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`,
    termType: "short",
    startDate: new Date(`${iso}T00:00:00.000Z`),
    endDate: null,
  };
};

const classifyGrade = (grade) => {
  const value = normalizeText(grade);
  if (/^9th\b/i.test(value)) {
    return {
      classKey: "09",
      departmentName: "9th Class",
      departmentCode: "9THCLASS",
      term: {
        name: "Session 2026–2028",
        code: "CISD-2026-2028",
        termType: "annual",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2028-12-31T00:00:00.000Z"),
      },
    };
  }
  if (/^10th\b/i.test(value)) {
    return {
      classKey: "10",
      departmentName: "10th Class",
      departmentCode: "10TH",
      term: {
        name: "2025-2027",
        code: "2025-2027",
        termType: "semester",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2027-12-31T00:00:00.000Z"),
      },
    };
  }
  if (/^1st\s+year\b/i.test(value)) {
    return {
      classKey: "11",
      departmentName: "11th Class",
      departmentCode: "11TH",
      term: {
        name: "Session 2026–2028",
        code: "CISD-2026-2028",
        termType: "annual",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2028-12-31T00:00:00.000Z"),
      },
    };
  }
  if (/^2nd\s+year\b/i.test(value)) {
    return {
      classKey: "12",
      departmentName: "12th Class",
      departmentCode: "12TH",
      term: {
        name: "2025-2027",
        code: "2025-2027",
        termType: "semester",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2027-12-31T00:00:00.000Z"),
      },
    };
  }
  if (/^starting\b/i.test(value)) {
    return {
      classKey: "SC",
      departmentName: "Short Courses",
      departmentCode: "SHORTCOURSES",
      term: parseShortCourseDate(value),
    };
  }
  throw new Error(`Unrecognized class/session value: ${grade}`);
};

const workbook = XLSX.readFile(sourcePath, { raw: false, cellDates: true });
const sheet = workbook.Sheets["Student List"];
if (!sheet) throw new Error('Worksheet "Student List" was not found');
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });

const sourceStudents = rows.slice(4).flatMap((row, index) => {
  if (!Number.isFinite(Number(row[0])) || !normalizeText(row[1])) return [];
  const grade = classifyGrade(row[5]);
  const program = normalizeProgram(row[4]);
  const programCode = existingProgramCodes[`${grade.classKey}:${program.suffix}`];
  if (!programCode) {
    throw new Error(`No existing-program mapping for ${grade.classKey}/${program.name}`);
  }
  const cnicDigits = digitsOnly(row[3]);
  return [{
    sourceRow: index + 5,
    serial: Number(row[0]),
    name: normalizeText(row[1]),
    fatherName: normalizeText(row[2]),
    sourceCnic: normalizeText(row[3]),
    validCnic: cnicDigits.length === 13 ? cnicDigits : null,
    programName: program.name,
    programSuffix: program.suffix,
    programCode,
    ...grade,
    withdrawn: /withdraw/i.test(normalizeText(row[7])),
  }];
});

if (sourceStudents.length !== 100) {
  throw new Error(`Expected 100 student rows, found ${sourceStudents.length}`);
}

const duplicateSourceNames = sourceStudents
  .map((student) => normalizeName(student.name))
  .filter((name, index, names) => names.indexOf(name) !== index);
if (duplicateSourceNames.length) {
  throw new Error(`Duplicate student names in source: ${[...new Set(duplicateSourceNames)].join(", ")}`);
}

const validCnics = sourceStudents.map((student) => student.validCnic).filter(Boolean);
const duplicateSourceCnics = validCnics.filter((cnic, index) => validCnics.indexOf(cnic) !== index);
if (duplicateSourceCnics.length) {
  throw new Error(`Duplicate valid CNICs in source: ${[...new Set(duplicateSourceCnics)].join(", ")}`);
}

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");
const connectionOptions = {
  serverSelectionTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  readPreference: apply ? "primary" : "secondaryPreferred",
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const connectDatabase = async (attempts = 4) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (mongoose.connection.readyState === 1) return;
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(attempt * 1500);
    }
  }
  throw lastError;
};
const startSessionWithRetry = async () => {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await connectDatabase();
      return await mongoose.startSession();
    } catch (error) {
      lastError = error;
      await mongoose.disconnect().catch(() => {});
      if (attempt < 4) await wait(attempt * 1500);
    }
  }
  throw lastError;
};

await connectDatabase();

const summary = {
  mode: audit ? "audit" : apply ? "apply" : "dry-run",
  sourceRows: sourceStudents.length,
  matchedExisting: 0,
  created: 0,
  updated: 0,
  withdrawn: 0,
  invalidOrMissingSourceCnic: sourceStudents.filter((student) => !student.validCnic).length,
  unmatchedLegacyPreserved: [],
  catalogsCreated: { departments: 0, programs: 0, sections: 0, sessions: 0 },
  failures: [],
};

const normalizedDepartment = (department) => normalizeName(department.name);

const ensureDepartment = async (student) => {
  const all = await Department.find({});
  let department = all.find(
    (item) => normalizedDepartment(item) === normalizeName(student.departmentName),
  ) || null;
  if (!department) {
    throw new Error(`Existing class not found: ${student.departmentName}`);
  }
  if (apply && department.code !== department.code.trim()) {
    department.code = department.code.trim();
    await department.save();
  }
  return department;
};

const ensureProgram = async (student, department) => {
  const program = await Program.findOne({ code: student.programCode });
  if (!program) {
    throw new Error(`Existing program not found: ${student.programCode} (${student.programName})`);
  }
  if (String(program.departmentId) !== String(department._id)) {
    throw new Error(`Program ${student.programCode} is not assigned to ${student.departmentName}`);
  }
  if (apply && program.name !== student.programName) {
    program.name = student.programName;
    await program.save();
  }
  return program;
};

const ensureSection = async (program) => {
  const sections = await Semester.find({ programId: program._id }).sort({ createdAt: 1 });
  let section = sections.find((item) => ["a", "sectiona"].includes(normalizeName(item.name))) || null;
  if (!section) {
    if (!apply) {
      return { _id: null, name: "A", number: 1, programId: program._id, isActive: true };
    }
    section = await Semester.create({
      programId: program._id,
      name: "A",
      number: 1,
      isActive: true,
    });
    summary.catalogsCreated.sections += 1;
  }
  return section;
};

const ensureTerm = async (definition) => {
  const term = await Term.findOne({ code: definition.code });
  if (!term) {
    throw new Error(`Existing session not found: ${definition.code}`);
  }
  return term;
};

try {
  const campus = await School.findOne({ name: /^CISD\s+RAWAT$/i, isActive: true });
  if (!campus) throw new Error("Active campus 'CISD RAWAT' was not found");

  const academicCache = new Map();
  for (const student of sourceStudents) {
    const key = [student.departmentName, student.programCode, student.term.code].join("|");
    if (academicCache.has(key)) continue;
    const department = await ensureDepartment(student);
    const program = await ensureProgram(student, department);
    const section = await ensureSection(program);
    const term = await ensureTerm(student.term);
    academicCache.set(key, { department, program, section, term });
  }

  const existingProfiles = await StudentProfile.find({ campusId: campus._id }).lean();
  const profileIds = existingProfiles.map((profile) => profile._id);
  const userIds = existingProfiles.map((profile) => profile.userId).filter(Boolean);
  const [people, personalRows] = await Promise.all([
    Person.find({ userId: { $in: userIds } }).lean(),
    PersonalInfo.find({ studentId: { $in: profileIds } }).lean(),
  ]);
  const personByUser = new Map(people.map((person) => [String(person.userId), person]));
  const personalByProfile = new Map(personalRows.map((personal) => [String(personal.studentId), personal]));
  const existingRecords = existingProfiles.map((profile) => ({
    profile,
    person: personByUser.get(String(profile.userId)) || null,
    personal: personalByProfile.get(String(profile._id)) || null,
  }));

  const byName = new Map();
  const byCnic = new Map();
  for (const record of existingRecords) {
    const currentName = record.personal?.fullName || record.person?.name;
    const key = normalizeName(currentName);
    if (key) byName.set(key, [...(byName.get(key) || []), record]);
    const cnic = digitsOnly(record.personal?.cnic);
    if (cnic.length === 13) byCnic.set(cnic, [...(byCnic.get(cnic) || []), record]);
  }

  const claimedProfiles = new Set();
  const plans = [];
  for (const student of sourceStudents) {
    let candidates = student.validCnic
      ? (byCnic.get(student.validCnic) || []).filter((record) => !claimedProfiles.has(String(record.profile._id)))
      : [];
    let matchMethod = candidates.length ? "cnic" : null;
    if (!candidates.length) {
      const found = new Map();
      for (const key of nameKeys(student.name)) {
        for (const record of byName.get(key) || []) {
          if (!claimedProfiles.has(String(record.profile._id))) found.set(String(record.profile._id), record);
        }
      }
      candidates = [...found.values()];
      if (candidates.length) matchMethod = "name";
    }
    if (candidates.length > 1) {
      throw new Error(`Ambiguous match for ${student.name} (source row ${student.sourceRow})`);
    }
    const existing = candidates[0] || null;
    if (existing) {
      claimedProfiles.add(String(existing.profile._id));
      summary.matchedExisting += 1;
    }
    plans.push({ student, existing, matchMethod });
  }

  summary.unmatchedLegacyPreserved = existingRecords
    .filter((record) => !claimedProfiles.has(String(record.profile._id)))
    .map((record) => record.personal?.fullName || record.person?.name || record.profile.studentId)
    .sort((a, b) => a.localeCompare(b));

  console.log(JSON.stringify({
    mode: summary.mode,
    campus: { id: campus._id, name: campus.name, code: campus.code },
    sourceRows: summary.sourceRows,
    matches: summary.matchedExisting,
    newStudents: plans.filter((plan) => !plan.existing).length,
    invalidOrMissingSourceCnic: summary.invalidOrMissingSourceCnic,
    withdrawnInSource: sourceStudents.filter((student) => student.withdrawn).map((student) => student.name),
    unmatchedLegacyPreserved: summary.unmatchedLegacyPreserved,
    feeRecordsToCreate: 0,
  }, null, 2));

  if (audit) {
    const matchedIds = plans.map((plan) => plan.existing?.profile?._id).filter(Boolean);
    const [profiles, currentPersonal, families, enrollments] = await Promise.all([
      StudentProfile.find({ _id: { $in: matchedIds } })
        .populate("departmentId", "name code")
        .populate("programId", "name code departmentId")
        .populate("semesterId", "name number programId")
        .populate("termId", "name code termType")
        .lean(),
      PersonalInfo.find({ studentId: { $in: matchedIds } }).lean(),
      FamilyInfo.find({ studentId: { $in: matchedIds } }).lean(),
      Enrollment.find({ studentId: { $in: matchedIds } }).lean(),
    ]);
    const profileById = new Map(profiles.map((item) => [String(item._id), item]));
    const currentPersonalById = new Map(currentPersonal.map((item) => [String(item.studentId), item]));
    const familyById = new Map(families.map((item) => [String(item.studentId), item]));
    const enrollmentById = new Map(enrollments.map((item) => [String(item.studentId), item]));
    const errors = [];
    const seenCnics = new Map();
    const countsByClass = {};
    const countsByProgram = {};
    const countsBySession = {};
    const countsBySection = {};
    for (const plan of plans) {
      const { student, existing } = plan;
      if (!existing) {
        errors.push(`${student.name}: no portal student record found`);
        continue;
      }
      const profile = profileById.get(String(existing.profile._id));
      const personal = currentPersonalById.get(String(existing.profile._id));
      const family = familyById.get(String(existing.profile._id));
      const enrollment = enrollmentById.get(String(existing.profile._id));
      const checks = [
        [personal?.fullName === student.name, "student name"],
        [family?.fatherName === student.fatherName, "father name"],
        [digitsOnly(personal?.cnic).length === 13, "13-digit CNIC"],
        [!student.validCnic || digitsOnly(personal?.cnic) === student.validCnic, "source CNIC"],
        [normalizeName(profile?.departmentId?.name) === normalizeName(student.departmentName), "class"],
        [normalizeName(profile?.programId?.name) === normalizeName(student.programName), "program"],
        [["a", "sectiona"].includes(normalizeName(profile?.semesterId?.name)), "section"],
        [profile?.termId?.code === student.term.code, "session"],
        [String(profile?.admissionTermId) === String(profile?.termId?._id), "admission session"],
        [String(enrollment?.programId) === String(profile?.programId?._id), "enrollment program"],
        [String(enrollment?.semesterId) === String(profile?.semesterId?._id), "enrollment section"],
        [String(enrollment?.termId) === String(profile?.termId?._id), "enrollment session"],
        [profile?.status === (student.withdrawn ? "withdrawn" : "active"), "student status"],
        [enrollment?.status === (student.withdrawn ? "withdrawn" : "enrolled"), "enrollment status"],
      ];
      const failed = checks.filter(([passed]) => !passed).map(([, label]) => label);
      if (failed.length) errors.push(`${student.name}: ${failed.join(", ")}`);
      const cnic = digitsOnly(personal?.cnic);
      if (cnic) seenCnics.set(cnic, [...(seenCnics.get(cnic) || []), student.name]);
      countsByClass[student.departmentName] = (countsByClass[student.departmentName] || 0) + 1;
      countsByProgram[student.programName] = (countsByProgram[student.programName] || 0) + 1;
      countsBySession[student.term.name] = (countsBySession[student.term.name] || 0) + 1;
      countsBySection[profile?.semesterId?.name || "Missing"] = (countsBySection[profile?.semesterId?.name || "Missing"] || 0) + 1;
    }
    for (const [cnic, names] of seenCnics.entries()) {
      if (names.length > 1) errors.push(`Duplicate CNIC ${cnic}: ${names.join(", ")}`);
    }
    summary.verification = {
      checked: sourceStudents.length,
      valid: sourceStudents.length - errors.length,
      errors,
      countsByClass,
      countsByProgram,
      countsBySession,
      countsBySection,
    };
    if (errors.length) process.exitCode = 1;
  }

  if (!apply) {
    console.log(audit ? "Audit complete." : "Dry run complete. Re-run with --apply to synchronize the portal.");
  } else {
    const defaultPasswordHash = await bcrypt.hash("Welcome123!", 12);
    for (const plan of plans) {
      const { student, existing } = plan;
      const academic = academicCache.get([student.departmentName, student.programCode, student.term.code].join("|"));
      let session;
      try {
        session = await startSessionWithRetry();
      } catch (error) {
        summary.failures.push({ row: student.sourceRow, name: student.name, error: error.message });
        continue;
      }
      try {
        await session.withTransaction(async () => {
          let profile;
          let user;
          let personal;
          if (existing) {
            profile = await StudentProfile.findById(existing.profile._id).session(session);
            user = profile.userId ? await User.findById(profile.userId).session(session) : null;
            personal = await PersonalInfo.findOne({ studentId: profile._id }).session(session);
          }

          const retainedCnic = digitsOnly(personal?.cnic);
          const cnic = student.validCnic
            || (retainedCnic.length === 13 ? retainedCnic : `99777${String(student.serial).padStart(7, "0")}${student.serial % 10}`);

          const cnicOwner = await PersonalInfo.findOne({
            cnic,
            ...(profile ? { studentId: { $ne: profile._id } } : {}),
          }).session(session);
          if (cnicOwner) throw new Error(`CNIC ${cnic} is already assigned to another student`);

          if (!profile) {
            const serial = String(student.serial).padStart(3, "0");
            const email = `rawat.challan.${serial}@students.cisd.edu.pk`;
            const phone = `0300${String(student.serial).padStart(7, "0")}`;
            let studentId = `CR-2026-${serial}`;
            let suffix = 1;
            while (await StudentProfile.exists({ studentId }).session(session)) {
              studentId = `CR-2026-${serial}-${suffix}`;
              suffix += 1;
            }
            [user] = await User.create([{
              email,
              phone,
              passwordHash: defaultPasswordHash,
              roles: ["student"],
              status: "disabled",
              emailVerified: false,
              campusId: campus._id,
            }], { session });
            await Person.create([{
              userId: user._id,
              name: student.name,
              nationalId: cnic,
              dob: new Date(`${student.classKey === "09" ? 2011 : student.classKey === "10" ? 2010 : student.classKey === "11" ? 2009 : student.classKey === "12" ? 2008 : 2000}-01-01T00:00:00.000Z`),
              gender: ["Fashion Designing", "Beautician"].includes(student.programName) ? "female" : "other",
              contact: { address: "CISD Rawat Campus", city: "Rawat", country: "Pakistan", phone },
            }], { session });
            [profile] = await StudentProfile.create([{
              userId: user._id,
              externalId: `CISD-RAWAT-CHALLAN-${serial}`,
              studentId,
              campusId: campus._id,
              departmentId: academic.department._id,
              programId: academic.program._id,
              semesterId: academic.section._id,
              termId: academic.term._id,
              admissionTermId: academic.term._id,
              status: student.withdrawn ? "withdrawn" : "active",
              remark: `Synced from ${path.basename(sourcePath)} — Student List row ${student.sourceRow}`,
            }], { session });
            [personal] = await PersonalInfo.create([{
              studentId: profile._id,
              fullName: student.name,
              cnic,
              phone,
              email,
              dob: new Date(`${student.classKey === "09" ? 2011 : student.classKey === "10" ? 2010 : student.classKey === "11" ? 2009 : student.classKey === "12" ? 2008 : 2000}-01-01T00:00:00.000Z`),
              gender: ["Fashion Designing", "Beautician"].includes(student.programName) ? "female" : "other",
              currentAddress: { address: "CISD Rawat Campus", district: "Rawat", province: "Punjab", country: "Pakistan" },
              permanentAddress: { address: "CISD Rawat Campus", district: "Rawat", province: "Punjab", country: "Pakistan" },
            }], { session });
            await FamilyInfo.create([{
              studentId: profile._id,
              fatherName: student.fatherName,
              guardianStatus: "alive",
              guardianPhone: phone,
              fathersProfession: "Not provided",
              guardianDesignation: "Guardian",
              incomeBracket: "Not provided",
            }], { session });
            await Enrollment.create([{
              studentId: profile._id,
              programId: academic.program._id,
              semesterId: academic.section._id,
              termId: academic.term._id,
              status: student.withdrawn ? "withdrawn" : "enrolled",
            }], { session });
            await StudentAuth.create([{
              studentProfileId: profile._id,
              email,
              rollNumber: studentId,
              password: "Welcome123!",
              status: "BLOCKED",
            }], { session });
          } else {
            await Promise.all([
              User.updateOne(
                { _id: profile.userId },
                { $set: { campusId: campus._id } },
                { session },
              ),
              Person.updateOne(
                { userId: profile.userId },
                { $set: { name: student.name, nationalId: cnic } },
                { upsert: true, session },
              ),
              PersonalInfo.updateOne(
                { studentId: profile._id },
                { $set: { fullName: student.name, cnic } },
                { session },
              ),
              FamilyInfo.updateOne(
                { studentId: profile._id },
                { $set: { fatherName: student.fatherName }, $setOnInsert: { guardianStatus: "alive" } },
                { upsert: true, session },
              ),
              Enrollment.updateOne(
                { studentId: profile._id },
                {
                  $set: {
                    programId: academic.program._id,
                    semesterId: academic.section._id,
                    termId: academic.term._id,
                    status: student.withdrawn ? "withdrawn" : "enrolled",
                  },
                },
                { upsert: true, session },
              ),
              StudentProfile.collection.updateOne(
                { _id: profile._id },
                {
                  $set: {
                    campusId: campus._id,
                    departmentId: academic.department._id,
                    programId: academic.program._id,
                    semesterId: academic.section._id,
                    termId: academic.term._id,
                    admissionTermId: academic.term._id,
                    status: student.withdrawn ? "withdrawn" : "active",
                    remark: `Synced from ${path.basename(sourcePath)} — Student List row ${student.sourceRow}`,
                    updatedAt: new Date(),
                  },
                },
                { session },
              ),
            ]);
          }
        });
        if (existing) summary.updated += 1;
        else summary.created += 1;
        if (student.withdrawn) summary.withdrawn += 1;
      } catch (error) {
        summary.failures.push({ row: student.sourceRow, name: student.name, error: error.message });
      } finally {
        await session.endSession();
      }
    }
  }
} finally {
  await mongoose.disconnect();
}

console.log(JSON.stringify(summary, null, 2));
if (summary.failures.length) process.exitCode = 1;
