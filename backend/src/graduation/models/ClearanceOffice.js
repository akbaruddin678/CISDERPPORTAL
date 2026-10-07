import mongoose from "mongoose";

// An auxiliary office that must confirm a graduating student holds none of
// its property (Library, Hostel, ...). Data-driven so an admin can add more
// without a code change: access to an office's desk is granted by holding one
// of its `roles`, or by being listed in `officerUserIds`.
const clearanceOfficeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    roles: [{ type: String }],
    officerUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // "transport" / "hostel" offices look the student's allocation up and
    // refuse approval while one is still active.
    autoCheck: { type: String, enum: ["none", "transport", "hostel"], default: "none" },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 100 },
  },
  { timestamps: true },
);

export default mongoose.models.ClearanceOffice ||
  mongoose.model("ClearanceOffice", clearanceOfficeSchema);
