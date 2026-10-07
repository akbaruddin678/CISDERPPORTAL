import express from 'express';
import {
  getChallansByUserId
} from '../controller/singlestudentChallan.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Get challans by user ID (for students to see their own challans)
router.get('/my-challans', getChallansByUserId);

export default router;