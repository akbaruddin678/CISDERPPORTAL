import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import School from "../model/School.js";
import User from "../../user/model/User.js";

const publicSchool = (school) => ({
  id: school._id,
  name: school.name,
  code: school.code,
  logoUrl: school.logoUrl,
  address: school.address,
  phone: school.phone,
  email: school.email,
  isActive: school.isActive,
});

async function saveLogo(file) {
  if (!file) return null;
  const extension = file.mimetype === "image/png" ? ".png" : ".jpg";
  const filename = `campus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${extension}`;
  const directory = path.resolve("uploads", "schools");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), file.buffer);
  return `/uploads/schools/${filename}`;
}

export async function listSchools(req, res) {
  const roles = req.user?.roles || [];
  const canSeeAll = roles.includes("admin") || roles.includes("headofaccount") || req.user?.allCampuses === true;
  const filter = canSeeAll ? {} : { _id: req.user?.campusId };
  const schools = await School.find(filter).sort({ name: 1 }).lean();
  res.json({ success: true, data: schools.map(publicSchool) });
}

export async function listPublicSchools(_req, res) {
  const schools = await School.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json({ success: true, data: schools.map(publicSchool) });
}

export async function createSchool(req, res) {
  try {
    const { name, code, address = "", phone = "", email = "" } = req.body;
    if (!name?.trim() || !code?.trim() || !req.file) {
      return res.status(400).json({ error: "School name, code, and logo are required." });
    }
    const logoUrl = await saveLogo(req.file);
    const school = await School.create({
      name: name.trim(), code: code.trim(), logoUrl, address, phone, email, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: publicSchool(school) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "That school code is already in use." });
    res.status(500).json({ error: error.message || "Failed to create school." });
  }
}

export async function updateSchool(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid school id." });
  const school = await School.findById(req.params.id);
  if (!school) return res.status(404).json({ error: "School not found." });
  for (const field of ["name", "code", "address", "phone", "email", "isActive"]) {
    if (req.body[field] !== undefined) school[field] = req.body[field];
  }
  if (!school.name?.trim() || !school.code?.trim()) {
    return res.status(400).json({ error: "School name and code are required." });
  }
  school.name = school.name.trim();
  school.code = school.code.trim();
  if (req.file) school.logoUrl = await saveLogo(req.file);
  try {
    await school.save();
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "That school code is already in use." });
    throw error;
  }
  res.json({ success: true, data: publicSchool(school) });
}

export async function deleteSchool(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid school id." });
  const assignedUsers = await User.countDocuments({ campusId: req.params.id });
  if (assignedUsers) return res.status(409).json({ error: "Reassign this school's user accounts before deleting it." });
  const school = await School.findByIdAndDelete(req.params.id);
  if (!school) return res.status(404).json({ error: "School not found." });
  res.json({ success: true, message: "School deleted." });
}
