import mongoose from "mongoose";

const teacherEvaluationSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile" }, // Optional if kept strictly anonymous

    ratings: {
      subjectKnowledge: { type: Number, min: 1, max: 5, required: true },
      communicationSkills: { type: Number, min: 1, max: 5, required: true },
      punctuality: { type: Number, min: 1, max: 5, required: true },
      fairnessInGrading: { type: Number, min: 1, max: 5, required: true },
    },

    overallRating: { type: Number }, // Calculated average
    comments: { type: String }, // Qualitative feedback
  },
  { timestamps: true },
);

export default mongoose.model("TeacherEvaluation", teacherEvaluationSchema);
