import { asyncHandler } from "../../accountant/middleware/asyncHandler.js";
import { HostelAllocationService } from "../services/hostelAllocation.service.js";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";

export const assignHostel = asyncHandler(async (req, res) => {
  const result = await HostelAllocationService.assignHostel(req.body);

  res.status(201).json({
    success: true,
    message: "Assigned successfully.",
    data: {
      allocation: result.allocation,
      challan: result.challan,
    },
  });
});

export const generateBulkChallan = asyncHandler(async (req, res) => {
  const challans = await HostelAllocationService.generateBulkChallan(req.body);

  res.status(201).json({
    success: true,
    message: `Generated ${challans.length} Challans.`,
    data: challans,
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
// 🔥 EMERGENCY REPAIR FOR OLD BROKEN CHALLANS
// =========================================================
export const syncExistingHostelChallans = asyncHandler(async (req, res) => {
  const challans = await StudentChallan.find({
    challanType: { $in: ["hostel_admission", "hostel_monthly"] },
    isDeleted: false,
  });

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
      }
    } catch (error) {
      console.error(`Failed to sync ${challan._id}:`, error.message);
      errors.push(`${challan._id}: ${error.message}`);
    }
  }

  res.status(200).json({
    success: true,
    message: "Hostel challans repair complete.",
    data: {
      totalFoundInDatabase: challans.length,
      brokenInvoiceIdsRepaired: fixedCount,
      failedSyncs: errors.length,
      errorLog: errors,
    },
  });
});
