import path from "node:path";
import { createRequire } from "node:module";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import School from "../src/school/model/School.js";
import Department from "../src/catalog/model/Department.js";
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
const sourcePath = path.resolve(sourceArg?.slice("--source=".length) || "C:/Users/USET/Downloads/CISD Rawat.xlsx");
const apply = process.argv.includes("--apply");

const sheetClassMap = new Map([
  ["9th", "9th"],
  ["10th", "10th"],
  ["1st Year (2025) Old", "11th"],
  ["1st Year (2026) New", "11th"],
  ["2nd Yr Fashion Designing", "12th"],
  ["2nd Yr Graphic Designing", "12th"],
]);

const departmentNames = {
  "9th": "9th Class",
  "10th": "10thClass",
  "11th": "11th Class",
  "12th": "12th Class",
};

const normalize = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
const invalidStudentName = (name) =>
  !name || name === "TOTAL" || name.startsWith("Note:") || /erased with correction fluid|name cut off/i.test(name);

const workbook = XLSX.readFile(sourcePath, { raw: false });
const sourceStudents = [];

for (const [sheetName, className] of sheetClassMap) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Required worksheet not found: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  for (const row of rows.slice(5)) {
    const name = String(row[2] || "").trim().replace(/\s+/g, " ");
    if (invalidStudentName(name)) continue;
    sourceStudents.push({ name, className, sheetName });
  }
}

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");
await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000,
  connectTimeoutMS: 30000,
});

const results = { sourceRows: sourceStudents.length, created: [], skipped: [], failed: [] };

try {
  const campus = await School.findOne({ name: /^CISD\s+RAWAT$/i, isActive: true }).lean();
  if (!campus) throw new Error("Active campus 'CISD RAWAT' was not found");

  const departments = await Department.find({}).lean();
  const departmentByClass = {};
  for (const [className, expectedName] of Object.entries(departmentNames)) {
    const department = departments.find((item) => normalize(item.name) === normalize(expectedName));
    if (!department) throw new Error(`Department for class ${className} was not found (${expectedName})`);
    departmentByClass[className] = department;
  }

  const classCounters = { "9th": 0, "10th": 0, "11th": 0, "12th": 0 };
  const planned = sourceStudents.map((student) => {
    const sequence = ++classCounters[student.className];
    const classNumber = student.className.replace(/\D/g, "").padStart(2, "0");
    const sequenceText = String(sequence).padStart(3, "0");
    const externalId = `CISD-RAWAT-${classNumber}-${sequenceText}`;
    return {
      ...student,
      sequence,
      classNumber,
      externalId,
      studentId: `CR-${classNumber}-${sequenceText}`,
      email: `rawat.${classNumber}.${sequenceText}@students.cisd.edu.pk`,
      phone: `+92355${classNumber}${String(sequence).padStart(5, "0")}`,
      cnic: `99999-${classNumber}${String(sequence).padStart(5, "0")}-${sequence % 10}`,
      dob: new Date(`${Number(classNumber) === 9 ? 2011 : Number(classNumber) === 10 ? 2010 : Number(classNumber) === 11 ? 2009 : 2008}-01-01T00:00:00.000Z`),
      gender: student.sheetName.includes("Fashion Designing")
        ? "female"
        : student.sheetName.includes("Graphic Designing")
          ? "male"
          : "other",
    };
  });

  const duplicateNames = [...new Set(planned.map((item) => normalize(item.name)).filter((name, index, names) => names.indexOf(name) !== index))];
  if (duplicateNames.length) throw new Error(`Duplicate student names in workbook: ${duplicateNames.join(", ")}`);

  const existingIds = new Set(
    (await StudentProfile.find({ externalId: { $in: planned.map((item) => item.externalId) } }).select("externalId").lean())
      .map((item) => item.externalId),
  );

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    campus: { id: campus._id, name: campus.name, code: campus.code },
    classes: Object.fromEntries(Object.entries(departmentByClass).map(([key, value]) => [key, { id: value._id, name: value.name, code: value.code }])),
    sourceRows: planned.length,
    countsByClass: planned.reduce((counts, item) => ({ ...counts, [item.className]: (counts[item.className] || 0) + 1 }), {}),
    alreadyImported: existingIds.size,
    excludedNonStudents: 2,
    feeRecordsToCreate: 0,
  }, null, 2));

  if (!apply) {
    console.log("Dry run complete. Re-run with --apply to create the student records.");
  } else {
    const defaultPasswordHash = await bcrypt.hash("Welcome123!", 12);
    for (const student of planned) {
      if (existingIds.has(student.externalId)) {
        results.skipped.push({ externalId: student.externalId, name: student.name, reason: "already imported" });
        continue;
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const department = departmentByClass[student.className];
          const [user] = await User.create([{
            email: student.email,
            phone: student.phone,
            passwordHash: defaultPasswordHash,
            roles: ["student"],
            status: "disabled",
            emailVerified: false,
            campusId: campus._id,
          }], { session });

          await Person.create([{
            userId: user._id,
            name: student.name,
            dob: student.dob,
            gender: student.gender,
            contact: { address: "CISD Rawat Campus", city: "Rawat", country: "Pakistan", phone: student.phone },
          }], { session });

          const [profile] = await StudentProfile.create([{
            userId: user._id,
            externalId: student.externalId,
            studentId: student.studentId,
            departmentId: department._id,
            campusId: campus._id,
            status: "active",
            remark: `Imported from ${path.basename(sourcePath)} — ${student.sheetName}`,
          }], { session });

          await Promise.all([
            PersonalInfo.create([{
              studentId: profile._id,
              fullName: student.name,
              cnic: student.cnic,
              phone: student.phone,
              email: student.email,
              dob: student.dob,
              gender: student.gender,
              currentAddress: { address: "CISD Rawat Campus", district: "Rawat", province: "Punjab", country: "Pakistan" },
              permanentAddress: { address: "CISD Rawat Campus", district: "Rawat", province: "Punjab", country: "Pakistan" },
            }], { session }),
            FamilyInfo.create([{
              studentId: profile._id,
              fatherName: "XZY",
              guardianStatus: "alive",
              guardianPhone: student.phone,
              fathersProfession: "Not provided",
              guardianDesignation: "Guardian",
              incomeBracket: "Not provided",
            }], { session }),
            Enrollment.create([{
              studentId: profile._id,
              status: "enrolled",
            }], { session }),
            StudentAuth.create([{
              studentProfileId: profile._id,
              email: student.email,
              rollNumber: student.studentId,
              password: "Welcome123!",
              status: "BLOCKED",
            }], { session }),
          ]);

          results.created.push({
            externalId: student.externalId,
            studentId: student.studentId,
            name: student.name,
            className: student.className,
            email: student.email,
          });
        });
      } catch (error) {
        results.failed.push({ externalId: student.externalId, name: student.name, error: error.message });
      } finally {
        await session.endSession();
      }
    }
  }
} finally {
  await mongoose.disconnect();
}

console.log(JSON.stringify({
  summary: {
    sourceRows: results.sourceRows,
    created: results.created.length,
    skipped: results.skipped.length,
    failed: results.failed.length,
  },
  failed: results.failed,
}, null, 2));

if (results.failed.length) process.exitCode = 1;
