// models/FamilyInfo.js
import mongoose from "mongoose";

const familyInfoSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    fatherName: { type: String, required: true },
    fatherCnic: { type: String },
    motherName: { type: String },
    motherCnic: { type: String },
    guardianStatus: { 
      type: String, 
      enum: ["alive", "deceased", "other"],
      default: "alive" 
    },
    guardianPhone: { type: String },
    fathersProfession: { 
      type: String,
     
    },
    guardianDesignation: { type: String },
    incomeBracket: {
      type: String,
     
    }
  },
  { timestamps: true }
);

export default mongoose.model("FamilyInfo", familyInfoSchema);