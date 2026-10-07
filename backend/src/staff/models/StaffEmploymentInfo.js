import mongoose from "mongoose";

const staffEmploymentInfoSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      unique: true,
      index: true,
    },
    dateOfJoining: { type: Date, required: true },
    probationEndDate: { type: Date },
    salaryGrade: { type: String }, // e.g., BPS-18
    basicSalary: { type: Number, required: true },

    // Bank Details for Accountant / Payroll
    bankDetails: {
      bankName: { type: String },
      branchCode: { type: String },
      accountTitle: { type: String },
      accountNumber: { type: String },
      iban: { type: String },
    },

    // Faculty-specific allowances — amounts, 0 meaning "not applicable"
    // rather than a separate boolean toggle per allowance.
    allowances: {
      phdAllowance: { type: Number, default: 0 },
      researchAllowance: { type: Number, default: 0 },
      housingAllowance: { type: Number, default: 0 },
      transportAllowance: { type: Number, default: 0 },
    },

    taxInfo: {
      ntn: { type: String },
      taxBracket: { type: String },
    },

    providentFund: {
      enrolled: { type: Boolean, default: false },
      employeeContributionPercent: { type: Number, default: 0 },
      employerContributionPercent: { type: Number, default: 0 },
    },

    // Hierarchical Structure
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile", // Usually points to the HOD
    },
  },
  { timestamps: true },
);

export default mongoose.model("StaffEmploymentInfo", staffEmploymentInfoSchema);
