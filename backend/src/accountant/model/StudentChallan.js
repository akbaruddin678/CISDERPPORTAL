import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

const StudentChallanSchema = new mongoose.Schema(
  {
    challanNo: { type: String, required: true, unique: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },

    // References
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
    },

    challanType: {
      type: String, // e.g. "tuition_exam"
      required: true,
    },

    // --- CRITICAL FIX: Use Map for Dynamic Fee Breakdown ---
    feeDetails: {
      type: Map,
      of: Number,
      default: {},
    },

    // Calculations
    originalTotal: { type: Number, required: true, min: 0 },
    scholarshipAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    discountReason: { type: String },
    fineAmount: { type: Number, default: 0, min: 0 },

    // Arrears is now just a static number if you ever want to add it manually,
    // but logic won't auto-calculate it from previous challans anymore.
    arrears: { type: Number, default: 0, min: 0 },

    includedChallanIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "StudentChallan" },
    ],

    netAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },

    // Installment Tracking
    isInstallment: { type: Boolean, default: false },
    installmentGroup: { type: String },
    installmentNumber: { type: Number },

    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentScholarship",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "issued",
        "partial",
        "paid",
        "overdue",
        "cancelled",
        "merged",
      ],
      default: "draft",
    },
    dueDate: { type: Date, required: true },

    // Which calendar month this bill/installment is for — required for
    // installment challans (each installment lands on a specific month from
    // the student's plan), optional for lump-sum ones. Was previously used
    // throughout this file's queries/index/exports without ever being
    // declared here, so it was silently dropped on every save.
    billingMonth: { type: String, default: null },

    //Expay data
    paymentReference: { type: String },
    ezPayBillId: { type: String },
    ezPayTranId: { type: String },
    isSyncedToEzPay: { type: Boolean, default: false },
    syncedAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletionReason: { type: String, trim: true },
    remarks: { type: String },
    // Optional note carried over from the Fee Setup screen (StudentFeeStructure.remarks)
    // at generation time — kept separate from `remarks` above, which is used for
    // system-generated audit text (cancellations, fine notes, merges, etc.).
    feeSetupRemark: { type: String, default: "" },
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    paymentProof: { type: String },
    paymentRemark: { type: String },
  },
  { timestamps: true },
);

// Recalculate Hook
StudentChallanSchema.methods.recalculateTotals = function () {
  const original = this.originalTotal || 0;
  const scholarship = this.scholarshipAmount || 0;
  const fine = this.fineAmount || 0;
  const arrears = this.arrears || 0;
  const paid = this.paidAmount || 0;
  const discount = this.discountAmount || 0;

  // Logic: (Original - Scholarship - Discount) + Fine + Arrears
  const basePayable = Math.max(0, original - scholarship - discount);
  this.netAmount = basePayable + fine + arrears;
  this.remainingAmount = Math.max(0, this.netAmount - paid);

  // Status Update Logic
  if (this.status !== "cancelled" && this.status !== "merged") {
    if (paid >= this.netAmount && this.netAmount > 0) {
      this.status = "paid";
      if (!this.paidAt) this.paidAt = new Date();
    } else if (paid > 0) {
      this.status = "partial";
    } else if (this.status === "issued" && this.dueDate < new Date()) {
      this.status = "overdue";
    }
  }
};

StudentChallanSchema.pre("save", function (next) {
  this.recalculateTotals();
  // Stashed here (mongoose's documented scratch space for passing data
  // between pre/post hooks on the same operation) since by the time the
  // post-save hook below runs, `isNew` has already flipped to false —
  // there'd otherwise be no way to tell "just created" apart from "just
  // updated" (e.g. marked paid).
  this.$locals.wasNew = this.isNew;
  next();
});

// A student created via the Admission Process starts invisible to every
// other module (feeActivated: false, see StudentProfile.js) until they've
// paid at least one fee — this is the single place that flips it back on,
// since every payment path (markPaid, installment payments, bulk ops)
// ultimately calls `.save()` on a StudentChallan and lands here. Once set
// true it is never reset, even if the student later goes overdue again.
StudentChallanSchema.post("save", async function (doc) {
  if (doc.status === "paid") {
    try {
      const StudentProfile = mongoose.model("StudentProfile");
      await StudentProfile.updateOne(
        { _id: doc.studentId, feeActivated: false },
        { $set: { feeActivated: true, feeActivatedAt: new Date() } },
      );
    } catch {
      // Non-fatal — the challan is already saved; activation would simply
      // be retried the next time a challan for this student is saved paid.
    }
  }

  // A newly-admitted student's admission fee challan is usually generated
  // some time AFTER promoteStudent() already sent the congratulations
  // email (with nothing to attach yet) — this catches that moment and
  // sends the same email again, now WITH the challan attached, the instant
  // their first-ever admission-type challan is actually created. Hooked
  // here (not in the generation code paths themselves) so it fires
  // regardless of which of the several challan-creation flows produced it
  // — same reasoning as the feeActivated flip above.
  const isNewAdmissionChallan =
    doc.$locals.wasNew &&
    !doc.isDeleted &&
    /admission/i.test(doc.challanType || "") &&
    !/readmission/i.test(doc.challanType || "");
  if (isNewAdmissionChallan) {
    try {
      const StudentChallanModel = mongoose.model("StudentChallan");
      const priorAdmissionChallans = await StudentChallanModel.countDocuments({
        studentId: doc.studentId,
        _id: { $ne: doc._id },
        isDeleted: false,
        $and: [
          { challanType: /admission/i },
          { challanType: { $not: /readmission/i } },
        ],
      });
      // Only the very first admission challan for this student triggers
      // the email — admission fee is a one-time charge, so this is
      // normally the only one that will ever exist.
      if (priorAdmissionChallans === 0) {
        const { sendAdmissionEmailForStudent } = await import(
          "../services/admissionEmailService.js"
        );
        sendAdmissionEmailForStudent(doc.studentId, { challan: doc }).catch(
          (err) =>
            console.error("Admission-challan-generated email failed:", err),
        );
      }
    } catch (err) {
      console.error("Admission-challan-generated email trigger failed:", err);
    }
  }
});

StudentChallanSchema.index(
  {
    studentId: 1,
    termId: 1,
    semesterId: 1,
    challanType: 1,
    billingMonth: 1,
    installmentNumber: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
    },
  },
);

StudentChallanSchema.plugin(campusScopedPlugin);
export default mongoose.model("StudentChallan", StudentChallanSchema);
