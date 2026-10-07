import { asyncHandler } from "../../accountant/middleware/asyncHandler.js";
import { HostelAllocationService } from "../services/hostelAllocation.service.js";
import { EzPayService } from "../../accountant/services/ezPay.service.js";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";

export const assignHostel = asyncHandler(async (req, res) => {
  const result = await HostelAllocationService.assignHostel(req.body);

  let ezPayStatus = "Skipped/No Challan";

  if (result.challan) {
    try {
      const isSynced = await EzPayService.syncToEzPay(result.challan._id);
      ezPayStatus = isSynced ? "Success" : "Failed";
    } catch (e) {
      console.error("EzPay Sync Error on Hostel Assign:", e.message);
      ezPayStatus = "Error";
    }
  }

  res.status(201).json({
    success: true,
    message: `Assigned successfully. EzPay Sync: ${ezPayStatus}`,
    data: {
      allocation: result.allocation,
      challan: result.challan,
      ezPayStatus,
    },
  });
});

export const generateBulkChallan = asyncHandler(async (req, res) => {
  const challans = await HostelAllocationService.generateBulkChallan(req.body);

  let syncedCount = 0;
  let failedCount = 0;

  if (challans && challans.length > 0) {
    for (const challan of challans) {
      try {
        const isSynced = await EzPayService.syncToEzPay(challan._id);
        if (isSynced) {
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (e) {
        console.error(
          `EzPay Sync Error for Bulk Hostel ${challan._id}:`,
          e.message,
        );
        failedCount++;
      }
    }
  }

  res.status(201).json({
    success: true,
    message: `Generated ${challans.length} Challans. EzPay Synced: ${syncedCount}, Failed: ${failedCount}`,
    data: challans,
    syncStats: { syncedCount, failedCount },
  });
});

export const getHostelChallans = asyncHandler(async (req, res) => {
  const result = await HostelAllocationService.getHostelChallans(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getAllocations = asyncHandler(async (req, res) => {
  const result = await HostelAllocationService.getAllocations(req.query);
  res.status(200).json({ success: true, data: result });
});

export const vacateHostel = asyncHandler(async (req, res) => {
  await HostelAllocationService.vacateHostel(req.params.id);
  res.status(200).json({ success: true, message: "Vacated" });
});

export const getStats = asyncHandler(async (req, res) => {
  const result = await HostelAllocationService.getStats();
  res.status(200).json({ success: true, data: result });
});

export const updateAllocation = asyncHandler(async (req, res) => {
  const result = await HostelAllocationService.updateAllocation(
    req.params.id,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: "Allocation updated successfully",
    data: result,
  });
});

// =========================================================
// 🔥 AGGRESSIVE EMERGENCY REPAIR & SYNC FOR OLD BROKEN CHALLANS
// =========================================================
export const syncExistingHostelChallans = asyncHandler(async (req, res) => {
  const challans = await StudentChallan.find({
    challanType: { $in: ["hostel_admission", "hostel_monthly"] },
    isDeleted: false,
  });

  let syncedCount = 0;
  let fixedCount = 0;
  let errors = [];

  const hasLettersOrHyphens = (str) => /[^0-9]/.test(str || "");

  for (const challan of challans) {
    try {
      let needsSave = false;

      const isMissing =
        !challan.paymentReference || challan.paymentReference === "00000000";
      const isBadFormat =
        hasLettersOrHyphens(challan.paymentReference) ||
        hasLettersOrHyphens(challan.challanNo);

      if (isMissing || isBadFormat) {
        const validNumericId = await StudentChallanService.generateChallanNo();

        challan.challanNo = validNumericId;
        challan.paymentReference = validNumericId;
        needsSave = true;
      }

      if (needsSave) {
        await challan.save();
        fixedCount++;

        if (["issued", "overdue", "pending"].includes(challan.status)) {
          const isSynced = await EzPayService.syncToEzPay(challan._id);
          if (isSynced) syncedCount++;
        }
      }
    } catch (error) {
      console.error(`Failed to sync ${challan._id}:`, error.message);
      errors.push(`${challan._id}: ${error.message}`);
    }
  }

  res.status(200).json({
    success: true,
    message: "Aggressive Hostel Challans Repair & Sync Complete.",
    data: {
      totalFoundInDatabase: challans.length,
      brokenInvoiceIdsRepaired: fixedCount,
      successfullySyncedToEzPay: syncedCount,
      failedSyncs: errors.length,
      errorLog: errors,
    },
  });
});
