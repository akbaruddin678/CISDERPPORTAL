import mongoose from "mongoose";

// One record per issue event — either a returnable Assignment (room key,
// chair, laptop...) or a one-way Consumption (pens, paper...). Kept as a
// single collection (rather than splitting) so a staff member's full
// inventory history — everything ever issued against their name — is one
// query away.
const inventoryAssignmentSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile", required: true, index: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },

    type: { type: String, enum: ["Assignment", "Consumption"], required: true },
    status: {
      type: String,
      enum: ["Active", "Returned", "Lost", "Damaged", "Consumed"],
      default: "Active",
    },

    assignedDate: { type: Date, default: Date.now },
    expectedReturnDate: { type: Date },
    returnedDate: { type: Date },

    conditionAtIssue: { type: String },
    conditionAtReturn: { type: String },
    remarks: { type: String, trim: true },

    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("InventoryAssignment", inventoryAssignmentSchema);
