import mongoose from "mongoose";

const { Schema } = mongoose;

export const STEP_STATUS = ["locked", "pending", "approved", "rejected", "not_applicable"];

const confirmationSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String },
    remark: { type: String, required: true },
  },
  { _id: false },
);

// One approval step (HOD / Exam / Finance / Registrar, and each office).
const stepFields = {
  status: { type: String, enum: STEP_STATUS, default: "locked" },
  actedBy: { type: Schema.Types.ObjectId, ref: "User" },
  actedByName: { type: String },
  actedAt: { type: Date },
  remarks: { type: String, default: "" },
  // Manual confirmations the approver ticked for checks the system could not
  // verify from data, each with the remark they gave.
  confirmations: { type: [confirmationSchema], default: [] },
};

const stepSchema = new Schema(stepFields, { _id: false });

const officeStepSchema = new Schema(
  {
    officeId: { type: Schema.Types.ObjectId, ref: "ClearanceOffice" },
    key: { type: String, required: true },
    name: { type: String, required: true },
    autoCheck: { type: String, default: "none" },
    ...stepFields,
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    stage: { type: String },
    officeKey: { type: String },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    byName: { type: String },
    remarks: { type: String, default: "" },
  },
  { _id: false },
);

const graduationClearanceSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", index: true },
    programId: { type: Schema.Types.ObjectId, ref: "Program" },
    termId: { type: Schema.Types.ObjectId, ref: "Term" },
    semesterId: { type: Schema.Types.ObjectId, ref: "Semester" },

    status: {
      type: String,
      enum: ["in_progress", "graduated", "cancelled"],
      default: "in_progress",
      index: true,
    },
    currentStage: {
      type: String,
      enum: ["hod", "exam", "offices", "finance", "registrar", "completed", "cancelled"],
      default: "hod",
      index: true,
    },

    startedBy: { type: Schema.Types.ObjectId, ref: "User" },
    startedByName: { type: String },

    stages: {
      hod: { type: stepSchema, default: () => ({ status: "pending" }) },
      exam: { type: stepSchema, default: () => ({}) },
      finance: { type: stepSchema, default: () => ({}) },
      registrar: { type: stepSchema, default: () => ({}) },
    },
    offices: { type: [officeStepSchema], default: [] },

    // Frozen at Exam Office approval: the official transcript.
    transcript: { type: Schema.Types.Mixed, default: null },
    // Finance tick: degree-issuance / convocation fee received.
    feeReceived: { type: Boolean, default: false },

    graduatedAt: { type: Date },
    graduationYear: { type: Number },
    degreeSerial: { type: String },

    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelReason: { type: String },

    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

// A student can only have one clearance running at a time.
graduationClearanceSchema.index(
  { studentId: 1 },
  { name: "studentId_in_progress_unique", unique: true, partialFilterExpression: { status: "in_progress" } },
);
graduationClearanceSchema.index({ studentId: 1, status: 1 });
// Degree serials are unique across the whole graduation roll.
graduationClearanceSchema.index(
  { degreeSerial: 1 },
  { unique: true, partialFilterExpression: { degreeSerial: { $type: "string" } } },
);

export default mongoose.models.GraduationClearance ||
  mongoose.model("GraduationClearance", graduationClearanceSchema);
