// Full, READ-ONLY export of a MongoDB database into a folder of NDJSON files
// (one per collection, canonical Extended JSON so ObjectId/Date/Decimal etc.
// survive the round trip) plus the index definitions.
//
//   node scripts/db-backup.mjs                       -> ../backup/<db>-<timestamp>/
//   node scripts/db-backup.mjs --out /some/dir       -> that exact dir
//   node scripts/db-backup.mjs --uri mongodb://...   -> use another URI than MONGO_URI
//
// It never writes to, drops or modifies the database it reads.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import { EJSON } from "bson";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const uri = arg("uri") || process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not configured");

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 45000 });
await client.connect();
const db = client.db();

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.resolve(arg("out") || path.join("..", "backup", `${db.databaseName}-${stamp}`));
fs.mkdirSync(outDir, { recursive: true });

const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
  .map((c) => c.name)
  .filter((n) => !n.startsWith("system."))
  .sort();

const manifest = { database: db.databaseName, createdAt: new Date().toISOString(), collections: {} };

for (const name of collections) {
  const file = path.join(outDir, `${name}.ndjson`);
  const fd = fs.openSync(file, "w");
  let count = 0;
  const cursor = db.collection(name).find({}, { batchSize: 1000 });
  for await (const doc of cursor) {
    fs.writeSync(fd, EJSON.stringify(doc, { relaxed: false }) + "\n");
    count++;
  }
  fs.closeSync(fd);

  let indexes = [];
  try {
    indexes = await db.collection(name).indexes();
  } catch {}
  manifest.collections[name] = { documents: count, indexes };
  console.log(`  ${name}: ${count}`);
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
await client.close();
console.log(`\nBackup complete: ${outDir}`);
