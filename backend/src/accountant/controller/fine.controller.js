import { asyncHandler } from '../middleware/asyncHandler.js';
import { FineService } from '../services/fine.service.js';
import StudentChallan from '../model/StudentChallan.js';
import FineSetting from '../model/FineSetting.js';
import { getLateFineSchedule, saveLateFineSchedule } from '../services/fineSetting.service.js';

// Late fine charged after a challan's due date. 0 = no fine.
export const getFineSettings = asyncHandler(async (req, res) => {
  const campusId = req.campus?.campusId || null;
  const lateFineTiers = await getLateFineSchedule(campusId);
  const lateFineAmount = lateFineTiers[0]?.amount || 0;
  const hasOwnSetting = Boolean(await FineSetting.exists({ campusId }));
  res.status(200).json({ success: true, data: { lateFineAmount, lateFineTiers, hasOwnSetting, campusId } });
});

export const updateFineSettings = asyncHandler(async (req, res) => {
  const campusId = req.campus?.campusId || null;
  const lateFineTiers = await saveLateFineSchedule(campusId, req.body.lateFineTiers, req.user?._id);
  const lateFineAmount = lateFineTiers[0]?.amount || 0;

  // Every open challan picks up the schedule. Overdue challans are recalculated
  // immediately; paid/cancelled challans keep their historical charge.
  const filter = { isDeleted: false, status: { $in: ['issued', 'partial', 'draft', 'overdue'] } };
  if (campusId) {
    filter.campusId = campusId;
  } else {
    // "All campuses" edits the default: skip campuses that have their own setting.
    const own = await FineSetting.find({ campusId: { $ne: null } }).select('campusId').lean();
    filter.campusId = { $nin: own.map((o) => o.campusId) };
  }
  // Mark the automatic portion on legacy overdue challans before replacing
  // their old flat snapshot, otherwise the new stage-one fine would be added
  // on top of the same fine a second time.
  await StudentChallan.updateMany(
    {
      ...filter,
      status: 'overdue',
      autoLateFineAmount: { $in: [null, 0] },
      fineAmount: { $gt: 0 },
    },
    [
      {
        $set: {
          autoLateFineAmount: {
            $min: ['$fineAmount', { $ifNull: ['$lateFeeAmount', '$fineAmount'] }],
          },
        },
      },
    ],
  );

  const result = await StudentChallan.updateMany(filter, {
    $set: { lateFeeAmount: lateFineAmount, lateFineTiers },
  });
  await FineService.processOverdue();

  res.status(200).json({
    success: true,
    message: lateFineTiers.some((tier) => tier.amount > 0)
      ? 'Three-stage late fine schedule saved.'
      : 'Late fine turned off. No fine will be imposed after the due date.',
    data: { lateFineAmount, lateFineTiers, updatedChallans: result.modifiedCount || 0 },
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
