import crypto from "node:crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/user/model/User.js";
import Person from "../src/core/models/Person.js";
import { hashPassword } from "../src/core/utils/password.js";

dotenv.config();

const arg = (name, fallback = "") =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;

const email = arg("email", "admin@cisd.edu.pk").trim().toLowerCase();
const name = arg("name", "CISD System Administrator").trim();
const suppliedPassword = process.env.ADMIN_PASSWORD || arg("password");
const password = suppliedPassword || `Cisd!${crypto.randomBytes(12).toString("base64url")}9`;

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid admin email");
if (password.length < 12) throw new Error("Admin password must be at least 12 characters");

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 45000 });
try {
  let user = await User.findOne({ email });
  const passwordHash = await hashPassword(password);

  if (!user) {
    user = await User.create({
      email,
      passwordHash,
      roles: ["admin"],
      status: "active",
      emailVerified: true,
      campusId: null,
      passwordChangedAt: new Date(),
    });
  } else {
    user.passwordHash = passwordHash;
    user.roles = Array.from(new Set([...(user.roles || []), "admin"]));
    user.status = "active";
    user.emailVerified = true;
    user.passwordChangedAt = new Date();
    await user.save();
  }

  await Person.updateOne(
    { userId: user._id },
    { $set: { name } },
    { upsert: true },
  );

  console.log(JSON.stringify({
    success: true,
    userId: user._id.toString(),
    email,
    name,
    password,
    roles: user.roles,
    status: user.status,
  }));
} finally {
  await mongoose.disconnect();
}
