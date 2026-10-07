import ClearanceOffice from "../models/ClearanceOffice.js";

const SYSTEM_OFFICES = [
  {
    key: "library",
    name: "Library",
    description: "Confirms all borrowed books are returned and no library dues remain.",
    roles: ["library"],
    autoCheck: "none",
    sortOrder: 10,
  },
  {
    key: "transport",
    name: "Transport",
    description: "Confirms the student holds no active transport allocation and owes no fare.",
    roles: ["transport"],
    autoCheck: "transport",
    sortOrder: 20,
  },
  {
    key: "hostel",
    name: "Hostel",
    description: "Confirms the room is vacated and no hostel property or dues remain.",
    roles: ["hostel"],
    autoCheck: "hostel",
    sortOrder: 30,
  },
  {
    key: "it_labs",
    name: "IT & Labs",
    description: "Confirms all lab equipment, accounts and IT assets are returned.",
    roles: ["it_labs"],
    autoCheck: "none",
    sortOrder: 40,
  },
];

// Idempotent: creates a missing built-in office but never overwrites one an
// admin has since renamed, re-assigned or deactivated.
export async function seedClearanceOffices() {
  try {
    for (const office of SYSTEM_OFFICES) {
      await ClearanceOffice.updateOne(
        { key: office.key },
        { $setOnInsert: { ...office, isSystem: true, isActive: true } },
        { upsert: true },
      );
    }
  } catch (error) {
    console.error("Error seeding clearance offices:", error);
  }
}
