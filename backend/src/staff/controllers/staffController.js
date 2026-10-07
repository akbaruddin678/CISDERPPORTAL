import StaffProfile from "../models/StaffProfile.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

// ==========================================
// FETCH ALL STAFF (For Dropdowns & Rosters)
// ==========================================
export const getAllStaff = asyncHandler(async (req, res) => {
  // ✅ CLEAN & SIMPLE: Just use Mongoose populate to grab the Person data
  const staffProfiles = await StaffProfile.find({ status: "Active" })
    .populate("departmentId", "name code")
    .populate({
      path: "personalInfo",
      model: "Person", // Points to the unified Person collection
    })
    .lean();

  res.status(200).json({
    success: true,
    data: staffProfiles,
  });
});
