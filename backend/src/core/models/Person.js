// src/core/models/Person.js
import mongoose from "mongoose";

const personSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    dob: Date,
    nationalId: String,
    gender: String,
    profilePhotoUrl: { type: String, default: null },
    contact: {
      address: String,
      city: String,
      country: String,
      phone: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Person", personSchema);
