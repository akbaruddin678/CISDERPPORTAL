import mongoose from "mongoose";

const StudentInstallmentAssignmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    challanId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentChallan", required: true },
    installmentPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "InstallmentPlan", required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    
    installments: [
      {
        installmentNumber: { type: Number, required: true, min: 1 },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
        paymentMethod: {
          type: String,
          enum: ["cash", "bank", "online", "card", null],
          default: null
        },
        transactionId: { type: String, trim: true },
        
        // ✅ NEW: Links to the physical generated voucher
        issuedChallanId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentChallan", default: null },
        
        status: {
          type: String,
          enum: ["pending", "issued", "paid", "overdue", "forwarded"], // Added 'forwarded' for rollovers
          default: "pending"
        },
        remarks: { type: String, trim: true }
      }
    ],

    totalPaid: { type: Number, default: 0, min: 0 },
    totalPending: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    assignedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

StudentInstallmentAssignmentSchema.pre('save', function(next) {
  this.totalPending = this.totalAmount - this.totalPaid;
  if (this.totalPending <= 0) this.status = "completed";
  
  this.installments.forEach(installment => {
    if (!installment.isPaid && installment.status !== "forwarded" && installment.dueDate < new Date()) {
      installment.status = "overdue";
    }
  });
  next();
});

export default mongoose.model("StudentInstallmentAssignment", StudentInstallmentAssignmentSchema);