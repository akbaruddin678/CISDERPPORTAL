import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half-Day", "On Leave"],
      required: true,
    },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    markedBy: {
      type: String,
      enum: ["Biometric", "Manual", "System"],
      default: "Biometric",
    },
    // Raw audit trail of every punch this day — unlike checkInTime/
    // checkOutTime (which only ever reflect the FIRST two), this records
    // every tap including any 3rd/4th "extra" punch, so HR can see
    // whether someone punched multiple times. Embedded here (not a
    // separate collection) since punches are always scoped to one day's
    // attendance record.
    punches: [
      {
        _id: false,
        timestamp: { type: Date, required: true },
        action: { type: String, enum: ["check-in", "check-out", "extra"], required: true },
        source: { type: String, enum: ["device", "kiosk"], default: "device" },
      },
    ],
  },
  { timestamps: true },
);

// Prevent duplicate attendance records for the same day
staffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.model("StaffAttendance", staffAttendanceSchema);
