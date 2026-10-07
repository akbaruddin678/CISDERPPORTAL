import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import StudentProfile from "../src/student/models/StudentProfile.js";

// One-off, idempotent backfill for the academic-lifecycle feature: every
// StudentProfile created before `admissionTermId` existed gets it set to
// that student's CURRENT termId. This is an accepted approximation, not a
// recovery of the true original admission term — that was never captured
// before this field existed. Safe to re-run: only touches docs where
// admissionTermId is still missing, and only ever writes that one field.
async function run() {
  await connectDB();

  const filter = { admissionTermId: { $exists: false }, termId: { $exists: true, $ne: null } };
  const total = await StudentProfile.countDocuments(filter);
  console.log(`Backfilling admissionTermId on ${total} student(s)...`);

  const cursor = StudentProfile.find(filter).select("_id termId").cursor();
  let updated = 0;
  for await (const doc of cursor) {
    // eslint-disable-next-line no-await-in-loop
    await StudentProfile.updateOne({ _id: doc._id }, { $set: { admissionTermId: doc.termId } });
    updated += 1;
    if (updated % 500 === 0) console.log(`  ...${updated}/${total}`);
  }

  console.log(`Done. Updated ${updated} student(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
