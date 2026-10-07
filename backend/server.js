import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app, { bootstrap } from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Wait for the DB connection (and the fee-head seed / cron jobs that depend
// on it) before accepting any HTTP traffic — otherwise a request landing in
// the first several seconds of the process, while Atlas's DNS/TLS handshake
// is still in progress, hits Mongoose's buffering timeout instead of just
// waiting the extra moment for a real connection. `connectDB()` itself
// already retries forever on failure (see src/config/db.js), so this never
// rejects — it simply waits however long a real connection takes.
(async () => {
  await connectDB();
  await bootstrap();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
