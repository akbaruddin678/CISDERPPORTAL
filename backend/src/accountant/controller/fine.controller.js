import { asyncHandler } from '../middleware/asyncHandler.js';
import { FineService } from '../services/fine.service.js';

export const applyFine = asyncHandler(async (req, res) => {
  const result = await FineService.applyToChallan(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: `Fine of ₹${result.appliedFine} applied successfully`,
    data: result.updatedChallan
  });
});

export const getOverdueChallans = asyncHandler(async (req, res) => {
  const result = await FineService.getOverdueChallans(req.query);
  
  res.status(200).json({
    success: true,
    ...result
  });
});

export const processOverdueChallans = asyncHandler(async (req, res) => {
  const result = await FineService.processOverdue();
  
  res.status(200).json({
    success: true,
    message: `Processed ${result.processed} overdue challans`,
    data: result
  });
});

export const payFine = asyncHandler(async (req, res) => {
  const result = await FineService.payFine(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: `Fine payment of ₹${result.paidAmount} processed successfully`,
    data: result
  });
});

export const waiveFine = asyncHandler(async (req, res) => {
  const result = await FineService.waiveFine(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    message: `Fine of ₹${result.waivedAmount} waived successfully`,
    data: result
  });
});

export const getFineHistory = asyncHandler(async (req, res) => {
  const result = await FineService.getFineHistory(req.query);
  
  res.status(200).json({
    success: true,
    ...result
  });
});