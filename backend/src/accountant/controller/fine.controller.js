import { asyncHandler } from '../middleware/asyncHandler.js';
import { FineService } from '../services/fine.service.js';
import StudentChallan from '../model/StudentChallan.js';
import FineSetting from '../model/FineSetting.js';
import { getLateFineAmount, saveLateFineAmount } from '../services/fineSetting.service.js';

// Late fine charged after a challan's due date. 0 = no fine.
export const getFineSettings = asyncHandler(async (req, res) => {
  const campusId = req.campus?.campusId || null;
  const lateFineAmount = await getLateFineAmount(campusId);
  const hasOwnSetting = Boolean(await FineSetting.exists({ campusId }));
  res.status(200).json({ success: true, data: { lateFineAmount, hasOwnSetting, campusId } });
});

export const updateFineSettings = asyncHandler(async (req, res) => {
  const campusId = req.campus?.campusId || null;
  const lateFineAmount = await saveLateFineAmount(campusId, req.body.lateFineAmount, req.user?._id);

  // Challans that are still open and not yet overdue pick up the new amount,
  // so what is printed ("Payable after due date") and what is charged match.
  // Challans that already went overdue keep the fine they were charged.
  const filter = { isDeleted: false, status: { $in: ['issued', 'partial', 'draft'] } };
  if (campusId) {
    filter.campusId = campusId;
  } else {
    // "All campuses" edits the default: skip campuses that have their own setting.
    const own = await FineSetting.find({ campusId: { $ne: null } }).select('campusId').lean();
    filter.campusId = { $nin: own.map((o) => o.campusId) };
  }
  const result = await StudentChallan.updateMany(filter, { $set: { lateFeeAmount: lateFineAmount } });

  res.status(200).json({
    success: true,
    message: lateFineAmount > 0
      ? `Late fine set to Rs ${lateFineAmount}.`
      : 'Late fine turned off. No fine will be imposed after the due date.',
    data: { lateFineAmount, updatedChallans: result.modifiedCount || 0 },
  });
});

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