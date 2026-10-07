// One-off migration: create a real Room per distinct room name currently
// duplicated as free text across TimetableEntry rows, then backfill each
// entry's new roomId.
//
// NOT YET RUN AGAINST PRODUCTION: the target Atlas cluster is at its hard
// 500/500 collection cap cluster-wide, so creating the new "rooms"
// collection will fail until that's resolved (see Phase 3 plan). Re-probe
// with `db.createCollection()` before running this for real.
//
// Usage:
//   node scripts/2026-10-backfill-room-collection.mjs --dry-run   (log only)
//   node scripts/2026-10-backfill-room-collection.mjs             (write)
//
// Idempotent: safe to re-run — distinct room names already migrated are
// skipped (unique index on Room.name), and only entries still missing
// roomId are touched on the second pass.
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import TimetableEntry from "../src/registrar/models/TimetableEntry.js";
import Room from "../src/registrar/models/Room.js";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  await connectDB();

  const entries = await TimetableEntry.find({ roomId: { $exists: false } })
    .select("room roomCapacity")
    .lean();

  // Group by case-insensitive, trimmed room name.
  const groups = new Map();
  for (const entry of entries) {
    if (!entry.room) continue;
    const key = entry.room.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { name: entry.room.trim(), capacities: new Set() });
    groups.get(key).capacities.add(Number(entry.roomCapacity));
  }

  console.log(`Found ${groups.size} distinct room name(s) across ${entries.length} entry/entries missing roomId.`);

  const roomIdByKey = new Map();
  for (const [key, group] of groups) {
    if (group.capacities.size > 1) {
      console.warn(
        `SKIPPING "${group.name}": inconsistent capacities found (${[...group.capacities].join(", ")}) — resolve manually before re-running.`,
      );
      continue;
    }
    const capacity = [...group.capacities][0];
    if (DRY_RUN) {
      console.log(`[dry-run] would create Room { name: "${group.name}", capacity: ${capacity} }`);
      continue;
    }
    let room = await Room.findOne({ name: group.name }).collation({ locale: "en", strength: 2 });
    if (!room) {
      room = await Room.create({ name: group.name, capacity });
      console.log(`Created Room "${group.name}" (capacity ${capacity}).`);
    }
    roomIdByKey.set(key, room._id);
  }

  if (!DRY_RUN) {
    for (const entry of entries) {
      if (!entry.room) continue;
      const key = entry.room.trim().toLowerCase();
      const roomId = roomIdByKey.get(key);
      if (!roomId) continue; // skipped group (inconsistent capacities)
      // eslint-disable-next-line no-await-in-loop
      await TimetableEntry.updateOne({ _id: entry._id }, { $set: { roomId } });
    }
  }

  const stillMissing = await TimetableEntry.countDocuments({ roomId: { $exists: false } });
  console.log(`${DRY_RUN ? "[dry-run] " : ""}TimetableEntry rows still missing roomId: ${stillMissing}.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
