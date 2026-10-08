import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const apply = process.argv.includes("--apply");
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
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect().catch(() => {});
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(attempt * 1500);
    }
  }
  throw lastError;
};

await connectDatabase();
const db = mongoose.connection.db;

const protectedRoles = new Set([
  "admin",
  "accountant",
  "headofaccount",
  "admission",
  "staff",
  "teacher",
  "hr",
  "manager",
  "hod",
  "head_of_academia",
  "vc",
  "vice_vc",
  "exam",
  "viwer",
  "registrar",
  "course coordinator",
  "transport",
  "library",
  "hostel",
  "it_labs",
  "clearance_officer",
]);

// These collections contain only student/applicant records. Configuration
// collections (catalog, fees, courses, exams, staff, schools) are omitted.
const studentOnlyCollections = [
  "admissions",
  "applications",
  "applicantprofiles",
  "offers",
  "challans",
  "deletedstudentrecords",
  "completedadmissionrecords",
  "studentprofiles",
  "personalinfos",
  "familyinfos",
  "educationhistories",
  "studentdocuments",
  "enrollments",
  "studentauths",
  "promotionoverrides",
  "studentidcards",
  "studenttrashrecords",
  "studentcourseregistrations",
  "creditoverrides",
  "coursewithdrawalrecords",
  "attendancerecords",
  "studentfeestructures",
  "studentfeepreferences",
  "studentchallans",
  "studentscholarships",
  "studentinstallmentassignments",
  "payments",
  "finehistories",
  "transportallocations",
  "hostelallocations",
  "studentmentorships",
  "disciplinaryfiles",
  "degreeclearances",
  "alumniprofiles",
  "graduationclearances",
  "ufmreports",
  "studentacademicrecords",
  "reevaluations",
  "examresults",
  "examregistrations",
  "examattendances",
  "admitcards",
  "gradecorrectionrequests",
];

const preservedCollections = [
  "schools",
  "departments",
  "programs",
  "semesters",
  "terms",
];

const existingCollections = new Set(
  (await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name),
);
const collection = (name) => db.collection(name);
const countIfPresent = async (name, filter = {}) => (
  existingCollections.has(name) ? collection(name).countDocuments(filter) : 0
);
const idsIfPresent = async (name) => (
  existingCollections.has(name)
    ? (await collection(name).find({}, { projection: { _id: 1 } }).sort({ _id: 1 }).toArray()).map((item) => String(item._id))
    : []
);

const profiles = existingCollections.has("studentprofiles")
  ? await collection("studentprofiles").find({}, { projection: { _id: 1, userId: 1 } }).toArray()
  : [];
const profileIds = profiles.map((item) => item._id);
const profileUserIds = profiles.map((item) => item.userId).filter(Boolean);

const users = existingCollections.has("users")
  ? await collection("users").find({}, { projection: { email: 1, roles: 1 } }).toArray()
  : [];
const staffUsers = users.filter((user) => (user.roles || []).some((role) => protectedRoles.has(role)));
const staffUserIds = new Set(staffUsers.map((user) => String(user._id)));
const deletableUsers = users.filter((user) => {
  if (staffUserIds.has(String(user._id))) return false;
  const roles = user.roles || [];
  return profileUserIds.some((id) => String(id) === String(user._id))
    || roles.includes("student")
    || roles.includes("applicant");
});
const deletableUserIds = deletableUsers.map((user) => user._id);
const deletableEmails = deletableUsers.map((user) => user.email).filter(Boolean);

const preservedBefore = {};
for (const name of preservedCollections) {
  preservedBefore[name] = {
    count: await countIfPresent(name),
    ids: await idsIfPresent(name),
  };
}
preservedBefore.staffUsers = {
  count: staffUsers.length,
  ids: staffUsers.map((user) => String(user._id)).sort(),
  roles: staffUsers.reduce((acc, user) => {
    const key = (user.roles || []).sort().join(",");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}),
};

const plannedDeletes = {};
for (const name of studentOnlyCollections) {
  plannedDeletes[name] = await countIfPresent(name);
}
plannedDeletes.pendingregistrations = await countIfPresent("pendingregistrations");
plannedDeletes.people = await countIfPresent("people", { userId: { $in: deletableUserIds } });
plannedDeletes.usersessions = await countIfPresent("usersessions", { userId: { $in: deletableUserIds } });
plannedDeletes.activitylogs = await countIfPresent("activitylogs", {
  $or: [
    { userId: { $in: deletableUserIds } },
    { userEmail: { $in: deletableEmails } },
  ],
});
plannedDeletes.coursediscussions = await countIfPresent("coursediscussions", {
  $or: [
    { authorModel: "StudentProfile" },
    { authorId: { $in: deletableUserIds } },
  ],
});
plannedDeletes.teacherevaluations = await countIfPresent("teacherevaluations", {
  studentId: { $in: profileIds },
});
plannedDeletes.users = deletableUsers.length;

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  studentProfiles: profileIds.length,
  studentOrApplicantUsers: deletableUsers.length,
  staffUsersPreserved: preservedBefore.staffUsers,
  academicCatalogPreserved: Object.fromEntries(
    preservedCollections.map((name) => [name, preservedBefore[name].count]),
  ),
  plannedDeletes: Object.fromEntries(
    Object.entries(plannedDeletes).filter(([, count]) => count > 0),
  ),
}, null, 2));

let deleted = {};
try {
  if (apply) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const name of studentOnlyCollections) {
          if (!existingCollections.has(name)) continue;
          const result = await collection(name).deleteMany({}, { session });
          deleted[name] = result.deletedCount;
        }

        if (existingCollections.has("pendingregistrations")) {
          const result = await collection("pendingregistrations").deleteMany({}, { session });
          deleted.pendingregistrations = result.deletedCount;
        }
        if (existingCollections.has("people")) {
          const result = await collection("people").deleteMany(
            { userId: { $in: deletableUserIds } },
            { session },
          );
          deleted.people = result.deletedCount;
        }
        if (existingCollections.has("usersessions")) {
          const result = await collection("usersessions").deleteMany(
            { userId: { $in: deletableUserIds } },
            { session },
          );
          deleted.usersessions = result.deletedCount;
        }
        if (existingCollections.has("activitylogs")) {
          const result = await collection("activitylogs").deleteMany({
            $or: [
              { userId: { $in: deletableUserIds } },
              { userEmail: { $in: deletableEmails } },
            ],
          }, { session });
          deleted.activitylogs = result.deletedCount;
        }
        if (existingCollections.has("coursediscussions")) {
          const result = await collection("coursediscussions").deleteMany({
            $or: [
              { authorModel: "StudentProfile" },
              { authorId: { $in: deletableUserIds } },
            ],
          }, { session });
          deleted.coursediscussions = result.deletedCount;
        }
        if (existingCollections.has("teacherevaluations")) {
          const result = await collection("teacherevaluations").deleteMany(
            { studentId: { $in: profileIds } },
            { session },
          );
          deleted.teacherevaluations = result.deletedCount;
        }
        if (existingCollections.has("announcements") && profileIds.length) {
          await collection("announcements").updateMany(
            { recipientStudentIds: { $in: profileIds } },
            { $pull: { recipientStudentIds: { $in: profileIds } } },
            { session },
          );
        }
        if (existingCollections.has("users")) {
          const result = await collection("users").deleteMany(
            { _id: { $in: deletableUserIds } },
            { session },
          );
          deleted.users = result.deletedCount;
        }
      });
    } finally {
      await session.endSession();
    }
  }
} finally {
  if (!apply) {
    await mongoose.disconnect();
  }
}

if (!apply) {
  console.log("Dry run complete. Re-run with --apply to permanently remove the listed student data.");
  process.exit(0);
}

const verification = {
  studentDataRemaining: {},
  preserved: {},
  errors: [],
};
for (const name of studentOnlyCollections) {
  const count = await countIfPresent(name);
  if (count > 0) verification.studentDataRemaining[name] = count;
}
for (const name of ["pendingregistrations"]) {
  const count = await countIfPresent(name);
  if (count > 0) verification.studentDataRemaining[name] = count;
}
const remainingStudentUsers = await countIfPresent("users", {
  $or: [{ roles: "student" }, { roles: "applicant" }],
  _id: { $nin: [...staffUserIds].map((id) => new mongoose.Types.ObjectId(id)) },
});
if (remainingStudentUsers > 0) verification.studentDataRemaining.users = remainingStudentUsers;

for (const name of preservedCollections) {
  const after = { count: await countIfPresent(name), ids: await idsIfPresent(name) };
  const before = preservedBefore[name];
  const unchanged = before.count === after.count
    && before.ids.length === after.ids.length
    && before.ids.every((id, index) => id === after.ids[index]);
  verification.preserved[name] = { count: after.count, unchanged };
  if (!unchanged) verification.errors.push(`${name} changed during the reset`);
}
const remainingStaffUsers = await collection("users")
  .find({ _id: { $in: staffUsers.map((user) => user._id) } }, { projection: { _id: 1 } })
  .toArray();
verification.preserved.staffUsers = {
  count: remainingStaffUsers.length,
  unchanged: remainingStaffUsers.length === staffUsers.length,
};
if (remainingStaffUsers.length !== staffUsers.length) {
  verification.errors.push("One or more protected staff users were changed or removed");
}
if (Object.keys(verification.studentDataRemaining).length) {
  verification.errors.push("Student data remains after the reset");
}

console.log(JSON.stringify({
  mode: "apply",
  deleted: Object.fromEntries(Object.entries(deleted).filter(([, count]) => count > 0)),
  verification,
}, null, 2));

await mongoose.disconnect();
if (verification.errors.length) process.exitCode = 1;
