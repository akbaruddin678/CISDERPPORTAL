import { WebsitePortalFeeService } from "../services/websitePortalFee.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import StudentProfile from "../../student/models/StudentProfile.js";

// @desc    Get logged-in student's challans for the Website Portal
// @route   GET /api/portal/student/my-challans
// @access  Private (Student Only)
export const getMyPortalChallans = asyncHandler(async (req, res) => {
  // 1. Extract User ID
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing User ID in token payload",
    });
  }

  // 2. Find the StudentProfile that belongs to this User ID
  const studentProfile = await StudentProfile.findOne({
    $or: [{ userId: userId }, { user: userId }, { _id: userId }],
  });

  if (!studentProfile) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "Profile not found or not yet approved.",
    });
  }

  // 3. Fetch the challans
  const challans = await WebsitePortalFeeService.getStudentPortalChallans(
    studentProfile._id,
  );

  res.status(200).json({
    success: true,
    count: challans.length,
    data: challans,
  });
});

// @desc    Get all students fee overview for Website Admin
// @route   GET /api/portal/admin/students-fee-overview
// @access  Private (Admin Only)
export const getAdminStudentsFeeOverview = asyncHandler(async (req, res) => {

  const data = await WebsitePortalFeeService.getAdminStudentsFeeOverview(
    req.query,
  );

  res.status(200).json({
    success: true,
    count: data.length,
    data: data,
  });
});

// @desc    Get single student fee detail for Website Admin
// @route   GET /api/portal/admin/students-fee-overview/:id
// @access  Private (Admin Only)
export const getAdminSingleStudentFeeDetail = asyncHandler(async (req, res) => {
  const data = await WebsitePortalFeeService.getAdminSingleStudentFeeDetail(
    req.params.id,
  );

  res.status(200).json({
    success: true,
    data: data,
  });
});
