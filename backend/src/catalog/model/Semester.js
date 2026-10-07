import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },

   
    name: {
      type: String,
      required: true,
      trim: true,
    },

    number: {
      type: Number,
      required: true,
    },

    
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);


export default mongoose.models.Semester ||
  mongoose.model("Semester", semesterSchema);
