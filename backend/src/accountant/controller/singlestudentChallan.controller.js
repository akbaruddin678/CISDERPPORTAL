import { asyncHandler } from '../middleware/asyncHandler.js';
import { StudentChallanService } from '../services/singlestudentChallan.service.js';
import mongoose from 'mongoose';

// Get challans by user ID (for students to see their own challans)
export const getChallansByUserId = asyncHandler(async (req, res) => {

  try {
    const userId = req.user._id;
    

    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const challans = await StudentChallanService.getChallansByUserId(userId);
    
    res.status(200).json({
      success: true,
      data: {
        challans: challans
      },
      message: challans.length === 0 ? 'No challans found for this user' : 'Challans retrieved successfully'
    });

  } catch (error) {
   
    
    // Handle specific errors gracefully
    if (error.message.includes('Student profile not found')) {
      return res.status(200).json({
        success: true,
        data: {
          challans: []
        },
        message: 'No student profile found - user may not be enrolled yet'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user challans',
      error: error.message
    });
  }
});