import mongoose from "mongoose";

// One flexible schema covers every kind of institutional asset — from a
// physical Room down to a box of ballpoint pens — rather than a separate
// collection per category. `category` drives which optional detail blocks
// (roomDetails, serial/warranty, consumable thresholds) are actually
// meaningful for a given item; the UI shows/hides fields accordingly.
const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: ["Building", "Floor", "Room", "Furniture", "Electronics", "Stationery", "Equipment", "Other"],
      required: true,
      index: true,
    },
    description: { type: String, trim: true },

    // Building → Floor → Room hierarchy, expressed as self-references on
    // the same flexible schema rather than two more collections: a Floor's
    // parentId points at its Building, a Room's at its Floor. Left null for
    // every other category (and for a Building itself, which is the root).
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", default: null, index: true },

    // Physical location for anything that ISN'T part of the Building/Floor/
    // Room hierarchy itself (Furniture, Electronics, Stationery, Equipment)
    // — which Room this item currently lives in. This is what makes
    // "everything in Room 204" a real query instead of a free-text guess.
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", default: null, index: true },
    sku: { type: String, trim: true, unique: true, sparse: true },
    unit: { type: String, default: "piece", trim: true },

    // Stock accounting — availableQuantity is derived (see virtual below),
    // never stored, so it can never drift out of sync with real
    // assignment/consumption activity.
    totalQuantity: { type: Number, required: true, min: 0, default: 1 },
    assignedQuantity: { type: Number, default: 0, min: 0 },
    consumedQuantity: { type: Number, default: 0, min: 0 },

    // Consumables (stationery: pens, paper, markers...) are handed out and
    // never returned — issuing one permanently reduces stock. Everything
    // else (rooms, furniture, electronics) is assigned-and-returned.
    isConsumable: { type: Boolean, default: false },
    // Below this available quantity, the item surfaces as "Low Stock" —
    // only meaningful for consumables, but harmless to set on anything.
    minThreshold: { type: Number, default: 0, min: 0 },

    condition: {
      type: String,
      enum: ["New", "Good", "Fair", "Poor", "Under Repair", "Retired"],
      default: "New",
    },
    location: { type: String, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },

    // Only meaningful when category === "Room" — building/floor are no
    // longer free text here, they come from walking `parentId` up the tree.
    roomDetails: {
      capacity: { type: Number, min: 0 },
      roomType: {
        type: String,
        enum: ["Classroom", "Lab", "Office", "Hall", "Store", "Other"],
      },
    },

    // Higher-value / trackable items (Electronics, Equipment, some Furniture)
    serialNumber: { type: String, trim: true },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number, min: 0 },
    vendor: { type: String, trim: true },
    warrantyExpiry: { type: Date },

    notes: { type: String, trim: true },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

inventoryItemSchema.virtual("availableQuantity").get(function () {
  return Math.max(
    0,
    (this.totalQuantity || 0) - (this.assignedQuantity || 0) - (this.consumedQuantity || 0),
  );
});

inventoryItemSchema.virtual("isLowStock").get(function () {
  return this.availableQuantity <= (this.minThreshold || 0);
});

export default mongoose.model("InventoryItem", inventoryItemSchema);
