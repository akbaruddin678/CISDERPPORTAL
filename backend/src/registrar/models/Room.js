import mongoose from "mongoose";

// A real physical room/classroom entity — replaces the free-text
// room/roomCapacity duplicated on every TimetableEntry, which could only
// reconcile two entries for "the same room" by case-insensitive string
// matching. One Room doc is now the single source of truth for a room's
// identity and capacity.
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    // Optional: the department that primarily owns this room. Unset means
    // shared/university-wide.
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    // No hard delete — mirrors Course.js's soft-lifecycle convention, since
    // a removed room's id may still be referenced by historical
    // TimetableEntry rows.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roomSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

export default mongoose.models.Room || mongoose.model("Room", roomSchema);
