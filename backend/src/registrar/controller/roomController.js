import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Room from "../models/Room.js";

// GET /api/registrar/rooms?isActive=&departmentId=
export const getRooms = asyncHandler(async (req, res) => {
  const { isActive, departmentId } = req.query;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (departmentId) filter.departmentId = departmentId;
  const rooms = await Room.find(filter).sort({ name: 1 }).lean();
  res.status(200).json({ success: true, data: rooms });
});

// POST /api/registrar/rooms  { name, capacity, departmentId? }
export const createRoom = asyncHandler(async (req, res) => {
  const { name, capacity, departmentId } = req.body;
  if (!name || !String(name).trim() || !Number(capacity) || Number(capacity) < 1) {
    return res.status(400).json({ success: false, message: "A room name and a valid capacity are required." });
  }
  try {
    const room = await Room.create({
      name: String(name).trim(),
      capacity: Number(capacity),
      departmentId: departmentId || undefined,
    });
    res.status(201).json({ success: true, message: "Room created.", data: room });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: `A room named "${name}" already exists.` });
    }
    throw error;
  }
});

// PATCH /api/registrar/rooms/:id  { name?, capacity?, departmentId?, isActive? }
export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: "Room not found." });

  const { name, capacity, departmentId, isActive } = req.body;
  if (name !== undefined) room.name = String(name).trim();
  if (capacity !== undefined) room.capacity = Number(capacity);
  if (departmentId !== undefined) room.departmentId = departmentId || undefined;
  if (isActive !== undefined) room.isActive = Boolean(isActive);

  try {
    await room.save();
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: `A room named "${name}" already exists.` });
    }
    throw error;
  }

  res.status(200).json({ success: true, message: "Room updated.", data: room });
});
