// Restores a folder created by db-backup.mjs into a MongoDB database.
//
//   node scripts/db-restore.mjs --from ../backup/<folder> [--uri mongodb://...] [--merge]
//
// SAFE BY DEFAULT: it never drops anything. A collection that already holds
// documents is skipped (so re-running cannot duplicate or overwrite data);
// pass --merge to insert only the documents whose _id is missing.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { MongoClient } from "mongodb";
import { EJSON } from "bson";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const from = arg("from");
if (!from) throw new Error("Usage: db-restore.mjs --from <backup folder> [--uri ...] [--merge]");
const merge = process.argv.includes("--merge");

const uri = arg("uri") || process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not configured");

const dir = path.resolve(from);
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 45000 });
await client.connect();
const db = client.db();
console.log(`Restoring "${manifest.database}" backup into "${db.databaseName}"${merge ? " (merge)" : ""}\n`);

for (const [name, info] of Object.entries(manifest.collections)) {
  const col = db.collection(name);
  const existing = await col.estimatedDocumentCount();
  if (existing > 0 && !merge) {
    console.log(`  ${name}: skipped (already has ${existing} documents; use --merge to add missing ones)`);
    continue;
  }

  let inserted = 0;
  let batch = [];
  const flush = async () => {
    if (!batch.length) return;
    try {
      const res = await col.insertMany(batch, { ordered: false });
      inserted += res.insertedCount;
    } catch (err) {
      // Duplicate _id errors are expected in --merge mode; anything else is real.
      const dup = (err.writeErrors || []).every((e) => e.code === 11000);
      if (!dup) throw err;
      inserted += err.result?.insertedCount ?? err.insertedCount ?? 0;
    }
    batch = [];
  };

  const file = path.join(dir, `${name}.ndjson`);
  const rl = readline.createInterface({ input: fs.createReadStream(file, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    batch.push(EJSON.parse(line, { relaxed: false }));
    if (batch.length >= 1000) await flush();
  }
  await flush();

  for (const idx of info.indexes || []) {
    if (idx.name === "_id_") continue;
    const { key, v, ns, ...options } = idx;
    try {
      await col.createIndex(key, options);
    } catch (err) {
      console.warn(`    index ${idx.name} on ${name}: ${err.message}`);
    }
  }
  console.log(`  ${name}: ${inserted}/${info.documents} restored`);
}

await client.close();
console.log("\nRestore finished.");
