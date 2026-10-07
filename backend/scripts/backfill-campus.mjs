import mongoose from "mongoose";
import dotenv from "dotenv";
import School from "../src/school/model/School.js";
import User from "../src/user/model/User.js";
import Admission from "../src/admissions/model/Admission.js";
import StudentProfile from "../src/student/models/StudentProfile.js";
import StudentChallan from "../src/accountant/model/StudentChallan.js";
import CompletedAdmissionRecord from "../src/admissions/model/CompletedAdmissionRecord.js";
import DeletedStudentRecord from "../src/admissions/model/DeletedStudentRecord.js";
import PaymentRecord from "../src/accountant/model/PaymentRecord.js";
import StudentScholarship from "../src/accountant/model/StudentScholarship.js";
import StudentFeeStructure from "../src/accountant/model/StudentFeeStructure.js";

dotenv.config();

const codeArg = process.argv.find((arg) => arg.startsWith("--school-code="));
const schoolCode = codeArg?.split("=")[1]?.trim().toUpperCase();
const apply = process.argv.includes("--apply");

if (!schoolCode) {
  console.error("Usage: npm run backfill:campus -- --school-code=CISD-ISB [--apply]");
  process.exit(1);
}
if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set");

await mongoose.connect(process.env.MONGO_URI);
try {
  const school = await School.findOne({ code: schoolCode }).lean();
  if (!school) throw new Error(`No school found with code ${schoolCode}`);

  const missing = { $or: [{ campusId: null }, { campusId: { $exists: false } }] };
  const counts = {
    users: await User.countDocuments({ ...missing, roles: { $in: ["applicant", "student", "accountant", "admission"] } }),
    admissions: await Admission.countDocuments(missing),
    students: await StudentProfile.countDocuments(missing),
    challans: await StudentChallan.countDocuments(missing),
    completedAdmissions: await CompletedAdmissionRecord.countDocuments(missing),
    deletedAdmissions: await DeletedStudentRecord.countDocuments(missing),
    paymentRecords: await PaymentRecord.countDocuments(missing),
    scholarships: await StudentScholarship.countDocuments(missing),
    studentFeeStructures: await StudentFeeStructure.countDocuments(missing),
  };

  console.log(`Target campus: ${school.name} (${school.code})`);
  console.log("Records without a campus:", counts);
  if (!apply) {
    console.log("Dry run only. Re-run with --apply to update these records.");
  } else {
    await User.updateMany(
      { ...missing, roles: { $in: ["applicant", "student", "accountant", "admission"] } },
      { $set: { campusId: school._id } },
    );
    await Admission.updateMany(missing, { $set: { campusId: school._id } });
    await StudentProfile.updateMany(missing, { $set: { campusId: school._id } });
    await StudentChallan.updateMany(missing, { $set: { campusId: school._id } });
    await CompletedAdmissionRecord.updateMany(missing, { $set: { campusId: school._id } });
    await DeletedStudentRecord.updateMany(missing, { $set: { campusId: school._id } });
    await PaymentRecord.updateMany(missing, { $set: { campusId: school._id } });
    await StudentScholarship.updateMany(missing, { $set: { campusId: school._id } });
    await StudentFeeStructure.updateMany(missing, { $set: { campusId: school._id } });
    console.log("Campus backfill completed.");
  }
} finally {
  await mongoose.disconnect();
}
