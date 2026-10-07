// models/PersonalInfo.js
import mongoose from "mongoose";

const personalInfoSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      // required: true,
      index: true,
    },
    fullName: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { 
      type: String, 
      enum: ["male", "female", "other"],
      required: true 
    },
    currentAddress: {
      address: String,
      district: String,
      province: String,
      country: { type: String, default: "Pakistan" }
    },
    permanentAddress: {
      address: String,
      district: String,
      province: String,
      country: { type: String, default: "Pakistan" }
    },
  },
  { timestamps: true }
);

export default mongoose.model("PersonalInfo", personalInfoSchema);