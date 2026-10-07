import mongoose from "mongoose";

const staffPersonalInfoSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true },
    fatherName: { type: String },
    cnic: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    dob: { type: Date, required: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
    },
    address: {
      current: { type: String },
      permanent: { type: String },
      city: { type: String },
    },
    profilePhoto: { type: String }, // URL to image
  },
  { timestamps: true },
);

export default mongoose.model("StaffPersonalInfo", staffPersonalInfoSchema);
