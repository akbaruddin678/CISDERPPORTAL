import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import InventoryItem from "../../inventory/models/InventoryItem.js";
import InventoryAssignment from "../../inventory/models/InventoryAssignment.js";
import StaffProfile from "../../staff/models/StaffProfile.js";

// ============================================================================
// ITEMS — the catalog side (rooms, furniture, stationery, equipment...)
// ============================================================================

// Building/Floor/Room live on the same collection, self-referenced via
// parentId (Floor -> Building, Room -> Floor). Given the small size of a
// single institution's location tree, it's simplest and fastest to fetch
// every Building+Floor once and stitch breadcrumbs on in memory rather than
// chase parentId with per-row queries.
const buildLocationBreadcrumbMap = async () => {
  const locations = await InventoryItem.find({
    category: { $in: ["Building", "Floor"] },
    isDeleted: { $ne: true },
  })
    .select("name category parentId")
    .lean();
  const byId = new Map(locations.map((l) => [String(l._id), l]));
  return byId;
};

const breadcrumbFor = (floorId, byId) => {
  const floor = byId.get(String(floorId));
  if (!floor) return null;
  const building = byId.get(String(floor.parentId));
  return { floorId: floor._id, floorName: floor.name, buildingId: building?._id, buildingName: building?.name };
};

export const getInventoryItems = asyncHandler(async (req, res) => {
  const { category, search, departmentId, lowStockOnly, parentId, roomId } = req.query;
  const filter = { isDeleted: { $ne: true } };
  if (category) filter.category = category;
  if (departmentId) filter.departmentId = departmentId;
  if (parentId) filter.parentId = parentId;
  if (roomId) filter.roomId = roomId;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { serialNumber: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  let items = await InventoryItem.find(filter)
    .populate("departmentId", "name code")
    .populate("roomId", "name")
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });

  if (lowStockOnly === "true") {
    items = items.filter((i) => i.availableQuantity <= (i.minThreshold || 0));
  }

  // Attach building/floor breadcrumbs to Room rows and Building names to
  // Floor rows, so the frontend never has to walk parentId itself.
  const needsBreadcrumb = items.some((i) => i.category === "Room" || i.category === "Floor");
  if (needsBreadcrumb) {
    const byId = await buildLocationBreadcrumbMap();
    items = items.map((i) => {
      if (i.category === "Room") return { ...i, breadcrumb: breadcrumbFor(i.parentId, byId) };
      if (i.category === "Floor") {
        const building = byId.get(String(i.parentId));
        return { ...i, breadcrumb: building ? { buildingId: building._id, buildingName: building.name } : null };
      }
      return i;
    });
  }

  res.status(200).json({ success: true, data: items, count: items.length });
});

// Full Building -> Floor -> Room tree in one call — powers the Rooms &
// Spaces screen's hierarchy browser and the "which room is this in"
// picker used by every other category.
export const getInventoryLocationTree = asyncHandler(async (req, res) => {
  const locations = await InventoryItem.find({
    category: { $in: ["Building", "Floor", "Room"] },
    isDeleted: { $ne: true },
  })
    .select("name category parentId roomDetails condition")
    .sort({ name: 1 })
    .lean();

  const buildings = locations.filter((l) => l.category === "Building");
  const floors = locations.filter((l) => l.category === "Floor");
  const rooms = locations.filter((l) => l.category === "Room");

  const tree = buildings.map((b) => ({
    ...b,
    floors: floors
      .filter((f) => String(f.parentId) === String(b._id))
      .map((f) => ({
        ...f,
        rooms: rooms.filter((r) => String(r.parentId) === String(f._id)),
      })),
  }));

  // Floors/rooms whose parent no longer exists (orphaned by a delete edge
  // case) still surface here so nothing silently disappears from view.
  const orphanFloors = floors.filter((f) => !buildings.some((b) => String(b._id) === String(f.parentId)));
  const orphanRooms = rooms.filter((r) => !floors.some((f) => String(f._id) === String(r.parentId)));

  res.status(200).json({ success: true, data: { tree, orphanFloors, orphanRooms } });
});

export const getInventoryItemById = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    .populate("departmentId", "name code")
    .lean({ virtuals: true });
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  res.status(200).json({ success: true, data: item });
});

// A Floor must sit under a real Building, a Room under a real Floor, and
// any non-location item's roomId must point at a real Room — this is the
// "properly connected" integrity check for the whole hierarchy.
const validateLocationLinks = async (category, parentId, roomId) => {
  if (category === "Floor") {
    if (!parentId) return "A Floor must be assigned to a Building.";
    const parent = await InventoryItem.findOne({ _id: parentId, category: "Building", isDeleted: { $ne: true } }).select("_id");
    if (!parent) return "Selected Building was not found.";
  }
  if (category === "Room") {
    if (!parentId) return "A Room must be assigned to a Floor.";
    const parent = await InventoryItem.findOne({ _id: parentId, category: "Floor", isDeleted: { $ne: true } }).select("_id");
    if (!parent) return "Selected Floor was not found.";
  }
  if (roomId) {
    const room = await InventoryItem.findOne({ _id: roomId, category: "Room", isDeleted: { $ne: true } }).select("_id");
    if (!room) return "Selected Room was not found.";
  }
  return null;
};

export const createInventoryItem = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user?._id };
  if (!payload.name || !payload.category) {
    return res.status(400).json({ success: false, message: "name and category are required." });
  }

  const linkError = await validateLocationLinks(payload.category, payload.parentId || null, payload.roomId || null);
  if (linkError) return res.status(400).json({ success: false, message: linkError });

  const item = await InventoryItem.create(payload);
  res.status(201).json({ success: true, message: "Item created.", data: item });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });

  const editable = [
    "name", "category", "description", "sku", "unit", "totalQuantity",
    "isConsumable", "minThreshold", "condition", "location", "departmentId",
    "roomDetails", "serialNumber", "purchaseDate", "purchaseCost", "vendor",
    "warrantyExpiry", "notes", "parentId", "roomId",
  ];

  const nextCategory = req.body.category !== undefined ? req.body.category : item.category;
  const nextParentId = req.body.parentId !== undefined ? req.body.parentId : item.parentId;
  const nextRoomId = req.body.roomId !== undefined ? req.body.roomId : item.roomId;
  const linkError = await validateLocationLinks(nextCategory, nextParentId || null, nextRoomId || null);
  if (linkError) return res.status(400).json({ success: false, message: linkError });

  editable.forEach((key) => {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  });

  // Never let a manual quantity edit put stock below what's already out
  // the door — assigned/consumed units are real, physically-elsewhere
  // units and can't just be edited away.
  const committed = (item.assignedQuantity || 0) + (item.consumedQuantity || 0);
  if (item.totalQuantity < committed) {
    return res.status(400).json({
      success: false,
      message: `Total quantity can't be less than ${committed} — that many units are currently assigned or consumed.`,
    });
  }

  await item.save();
  res.status(200).json({ success: true, message: "Item updated.", data: item });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });

  if (["Building", "Floor"].includes(item.category)) {
    const childCount = await InventoryItem.countDocuments({ parentId: item._id, isDeleted: { $ne: true } });
    if (childCount > 0) {
      const childLabel = item.category === "Building" ? "floor(s)" : "room(s)";
      return res.status(409).json({
        success: false,
        message: `Can't delete — it still has ${childCount} ${childLabel}. Remove those first.`,
      });
    }
  }
  if (item.category === "Room") {
    const housedCount = await InventoryItem.countDocuments({ roomId: item._id, isDeleted: { $ne: true } });
    if (housedCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Can't delete — ${housedCount} item(s) are still located in this room. Relocate them first.`,
      });
    }
  }

  const activeAssignments = await InventoryAssignment.countDocuments({
    itemId: item._id,
    status: "Active",
  });
  if (activeAssignments > 0) {
    return res.status(409).json({
      success: false,
      message: `Can't delete — ${activeAssignments} unit(s) are currently assigned to staff. Return them first.`,
    });
  }

  item.isDeleted = true;
  item.deletedAt = new Date();
  await item.save();
  res.status(200).json({ success: true, message: "Item removed from inventory." });
});

// Powers the Inventory Dashboard's stat tiles and per-category module cards.
export const getInventoryStats = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({ isDeleted: { $ne: true } }).lean({ virtuals: true });

  const byCategory = {};
  let lowStockCount = 0;
  let totalUnits = 0;
  let assignedUnits = 0;

  items.forEach((i) => {
    byCategory[i.category] = byCategory[i.category] || { count: 0, totalQuantity: 0 };
    byCategory[i.category].count += 1;
    byCategory[i.category].totalQuantity += i.totalQuantity || 0;
    totalUnits += i.totalQuantity || 0;
    assignedUnits += i.assignedQuantity || 0;
    if (i.availableQuantity <= (i.minThreshold || 0)) lowStockCount += 1;
  });

  const activeAssignments = await InventoryAssignment.countDocuments({ status: "Active" });

  res.status(200).json({
    success: true,
    data: {
      totalItemTypes: items.length,
      totalUnits,
      assignedUnits,
      lowStockCount,
      activeAssignments,
      byCategory,
    },
  });
});

// ============================================================================
// ASSIGNMENTS — issue / return, tracked against a staff record
// ============================================================================

export const getInventoryAssignments = asyncHandler(async (req, res) => {
  const { staffId, itemId, status } = req.query;
  const filter = {};
  if (staffId) filter.staffId = staffId;
  if (itemId) filter.itemId = itemId;
  if (status) filter.status = status;

  const assignments = await InventoryAssignment.find(filter)
    .populate({ path: "itemId", select: "name category unit sku isConsumable" })
    .populate({
      path: "staffId",
      select: "employeeId designation personalInfo",
      populate: { path: "personalInfo", select: "name" },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: assignments, count: assignments.length });
});

export const assignInventoryItem = asyncHandler(async (req, res) => {
  const { itemId, staffId, quantity, expectedReturnDate, conditionAtIssue, remarks } = req.body;
  const qty = Number(quantity) || 1;

  if (!itemId || !staffId) {
    return res.status(400).json({ success: false, message: "itemId and staffId are required." });
  }
  if (!mongoose.Types.ObjectId.isValid(itemId) || !mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json({ success: false, message: "Invalid itemId or staffId." });
  }

  const [item, staff] = await Promise.all([
    InventoryItem.findOne({ _id: itemId, isDeleted: { $ne: true } }),
    StaffProfile.findById(staffId).select("_id"),
  ]);
  if (!item) return res.status(404).json({ success: false, message: "Item not found." });
  if (!staff) return res.status(404).json({ success: false, message: "Staff member not found." });

  const available = Math.max(0, (item.totalQuantity || 0) - (item.assignedQuantity || 0) - (item.consumedQuantity || 0));
  if (qty > available) {
    return res.status(400).json({
      success: false,
      message: `Only ${available} unit(s) of "${item.name}" are available.`,
    });
  }

  const isConsumable = item.isConsumable;
  const record = await InventoryAssignment.create({
    itemId: item._id,
    staffId,
    quantity: qty,
    type: isConsumable ? "Consumption" : "Assignment",
    status: isConsumable ? "Consumed" : "Active",
    expectedReturnDate: isConsumable ? undefined : expectedReturnDate || undefined,
    conditionAtIssue: conditionAtIssue || item.condition,
    remarks,
    assignedBy: req.user?._id,
  });

  if (isConsumable) {
    item.consumedQuantity = (item.consumedQuantity || 0) + qty;
  } else {
    item.assignedQuantity = (item.assignedQuantity || 0) + qty;
  }
  await item.save();

  res.status(201).json({
    success: true,
    message: isConsumable ? "Item issued and logged as consumed." : "Item assigned to staff.",
    data: record,
  });
});

export const returnInventoryItem = asyncHandler(async (req, res) => {
  const { status = "Returned", conditionAtReturn, remarks } = req.body;
  const record = await InventoryAssignment.findById(req.params.id);
  if (!record) return res.status(404).json({ success: false, message: "Assignment not found." });
  if (record.type !== "Assignment") {
    return res.status(400).json({ success: false, message: "Consumable issues can't be returned." });
  }
  if (record.status !== "Active") {
    return res.status(400).json({ success: false, message: "This item has already been resolved." });
  }
  if (!["Returned", "Lost", "Damaged"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid return status." });
  }

  const item = await InventoryItem.findById(record.itemId);
  if (item) {
    item.assignedQuantity = Math.max(0, (item.assignedQuantity || 0) - record.quantity);
    // A lost unit is permanently gone from stock; a damaged one stays in
    // stock (now available again) but its condition should be revisited
    // by staff — captured on the record itself via conditionAtReturn.
    if (status === "Lost") {
      item.totalQuantity = Math.max(0, (item.totalQuantity || 0) - record.quantity);
    }
    await item.save();
  }

  record.status = status;
  record.returnedDate = new Date();
  record.conditionAtReturn = conditionAtReturn || (status === "Lost" ? "Lost" : undefined);
  if (remarks) record.remarks = remarks;
  await record.save();

  res.status(200).json({ success: true, message: `Item marked as ${status.toLowerCase()}.`, data: record });
});
