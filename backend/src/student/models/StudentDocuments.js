// models/StudentDocuments.js
import mongoose from "mongoose";

const studentDocumentsSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    profilePhoto: { type: String },
    cnicFront: { type: String },
    cnicBack: { type: String },
    matricCertificate: { type: String },
    fscCertificate: { type: String },
    domicileDoc: { type: String },
    otherDocuments: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("StudentDocuments", studentDocumentsSchema);