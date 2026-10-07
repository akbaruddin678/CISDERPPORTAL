import { asyncHandler } from "../middleware/asyncHandler.js";
import { StudentChallanService } from "../services/studentChallan.service.js";
import StudentChallan from "../model/StudentChallan.js";

// --- Generation ---
export const generateChallan = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.generate(req.body);

  if (result.successCount === 0) {
    return res.status(400).json({
      success: false,
      message:
        result.errors[0] ||
        "Failed to generate challan. Please check constraints.",
      errors: result.errors,
      data: result,
    });
  }

  // Previous challans the accountant chose to delete outright instead of
  // carrying forward — only actually removed once the new challan(s) were
  // successfully created above, so a failed generation never destroys them.
  let deletedCount = 0;
  if (Array.isArray(req.body.deleteChallanIds) && req.body.deleteChallanIds.length > 0) {
    deletedCount = await StudentChallanService.deletePreviousDuesChallans(
      req.body.deleteChallanIds,
    );
  }

  res.status(201).json({
    success: true,
    message: `Generated ${result.successCount} challan(s) successfully.${
      deletedCount > 0 ? ` Deleted ${deletedCount} previous challan(s).` : ""
    }`,
    data: result,
  });
});

// Previous-dues preview for a batch of students — powers Bulk Generation's
// "include previous dues" summary (same eligibility as generate()'s own
// mergeBase/carryFine).
export const getPreviousDuesSummary = asyncHandler(async (req, res) => {
  const raw = req.query.studentIds || "";
  const studentIds = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (studentIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: { perStudent: {}, totalAmount: 0, totalStudentsWithDues: 0 },
    });
  }

  const result = await StudentChallanService.getPreviousDuesForStudents(
    studentIds,
  );
  res.status(200).json({ success: true, data: result });
});

// --- Auto Fee Generator: pick a session, a billing month and a due date,
// and every student whose next installment is scheduled for that month
// gets a challan generated automatically. ---
export const getAutoGeneratePreview = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.getAutoGeneratePreview(req.query);
  res.status(200).json({ success: true, data: result });
});

export const autoGenerateByMonth = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.autoGenerateForMonth(req.body);

  res.status(200).json({
    success: true,
    message:
      result.matchedCount > 0
        ? `Matched ${result.matchedCount} student(s) with an installment due in the selected month — generated ${result.successCount} challan(s).`
        : result.errors[0] || "No students matched this month's installment schedule.",
    data: result,
  });
});

// --- Paginated Directory (THE CRITICAL 10 PARAMETERS) ---
export const getChallansPaginated = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    search,
    termId,
    status,
    departmentId,
    programId,
    semesterId,
    excludeType,
    month,
    type,
    excludeUnactivated,
    studentId,
  } = req.query;

  // Safe fallback math to prevent NaN crashes
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);

  const result = await StudentChallanService.getPaginated(
    parsedPage,
    parsedLimit,
    search,
    termId,
    status,
    departmentId,
    programId,
    semesterId,
    excludeType,
    month,
    type,
    excludeUnactivated,
    studentId,
  );

  res.status(200).json({ success: true, data: result });
});

export const getChallans = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    search,
    termId,
    status,
    departmentId,
    programId,
    semesterId,
    excludeType,
    month,
    type,
  } = req.query;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);

  const result = await StudentChallanService.getPaginated(
    parsedPage,
    parsedLimit,
    search,
    termId,
    status,
    departmentId,
    programId,
    semesterId,
    excludeType,
    month,
    type,
  );

  res.status(200).json({ success: true, data: result });
});

export const getChallansByStudentId = asyncHandler(async (req, res) => {
  const challans = await StudentChallanService.getChallansByStudentId(
    req.params.studentId,
    req.query,
  );
  res.status(200).json({ success: true, data: { challans } });
});

// --- Reports ---
export const getReports = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.getFinanceReports(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getMonthlyFinanceReport = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.getMonthlyReport(req.query);
  res.status(200).json({ success: true, data: result });
});

// --- Fine & Due Date Actions ---
export const triggerOverdueProcessing = asyncHandler(async (req, res) => {
  const result =
    await StudentChallanService.processOverdueChallansAutomatically();
  res.status(200).json({
    success: true,
    message: "Calculation complete",
    processedCount: result.processedCount,
  });
});

export const updateFineAndDueDate = asyncHandler(async (req, res) => {
  const data = await StudentChallanService.updateFineAndDueDate(
    req.params.id,
    req.body,
  );
  res.status(200).json({ success: true, data });
});

export const bulkUpdateFineAndDueDate = asyncHandler(async (req, res) => {
  const challans = await StudentChallanService.bulkUpdateFineAndDueDate(
    req.body.challanIds,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: `Updated ${challans.length} records`,
    data: challans,
  });
});

export const bulkUpdateDates = asyncHandler(async (req, res) => {
  const count = await StudentChallanService.bulkUpdateDate(
    req.body.challanIds,
    req.body.dueDate,
  );
  res.status(200).json({ success: true, message: `Updated ${count} items` });
});

export const bulkDeleteChallans = asyncHandler(async (req, res) => {
  const count = await StudentChallanService.bulkDelete(req.body.challanIds);
  res.status(200).json({ success: true, message: `Deleted ${count} items` });
});

export const bulkRenewChallans = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.bulkRenewChallans(
    req.body.challanIds,
  );
  res.status(200).json({
    success: true,
    message: `Renewed ${result.renewedCount} challan(s).${
      result.conflictCount > 0 ? ` ${result.conflictCount} need a decision.` : ""
    }${result.errorCount > 0 ? ` ${result.errorCount} failed.` : ""}`,
    data: result,
  });
});

export const getOverdueInstallments = asyncHandler(async (req, res) => {
  const data = await StudentChallanService.getOverdueInstallments(req.query);
  res.status(200).json({ success: true, data });
});

// --- Daily Invoice (College) ---
export const getDailyInvoices = asyncHandler(async (req, res) => {
  const scope = req.query.scope === "university" ? "university" : "college";
  const result = await StudentChallanService.getDailyInvoices(req.query, scope);
  res.status(200).json({ success: true, ...result });
});

export const bulkShiftUnpaidInvoiceDueDate = asyncHandler(async (req, res) => {
  const scope = req.body.scope === "university" ? "university" : "college";
  const count = await StudentChallanService.bulkShiftUnpaidInvoiceDueDate(
    req.body.filters || {},
    req.body.newDueDate,
    scope,
  );
  res
    .status(200)
    .json({ success: true, message: `Shifted due date on ${count} unpaid invoice(s).` });
});

export const bulkCancelUnpaidInvoices = asyncHandler(async (req, res) => {
  const scope = req.body.scope === "university" ? "university" : "college";
  const count = await StudentChallanService.bulkCancelUnpaidInvoices(
    req.body.filters || {},
    scope,
  );
  res
    .status(200)
    .json({ success: true, message: `Cleared ${count} unpaid invoice(s).` });
});

// --- Single ID Operations ---
export const markChallanPaid = asyncHandler(async (req, res) => {
  const data = await StudentChallanService.markPaid(
    req.params.id,
    req.body,
    req.file,
  );
  res.status(200).json({ success: true, data });
});

export const deleteChallan = asyncHandler(async (req, res) => {
  await StudentChallanService.deleteChallan(req.params.id);
  res.status(200).json({ success: true, message: "Deleted" });
});

export const createInstallments = asyncHandler(async (req, res) => {
  const data = await StudentChallanService.createCustomInstallments(
    req.params.id,
    req.body.installments,
  );
  res.status(200).json({ success: true, data });
});

export const updateChallanDueDate = asyncHandler(async (req, res) => {
  const data = await StudentChallanService.updateDueDate(
    req.params.id,
    req.body.dueDate,
  );
  res.status(200).json({ success: true, data });
});

export const applyDiscount = asyncHandler(async (req, res) => {
  await StudentChallanService.applyDiscount(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Discount Applied" });
});

export const removeDiscount = asyncHandler(async (req, res) => {
  await StudentChallanService.removeDiscount(req.params.id);
  res.status(200).json({ success: true, message: "Discount Removed" });
});

// Stubs for remaining logic
export const getChallan = asyncHandler(async (req, res) => {
  const data = await StudentChallan.findById(req.params.id).populate(
    "studentId",
  );
  res.json({ success: true, data });
});

export const getChallanForPrint = asyncHandler(async (req, res) =>
  res.json({ success: true }),
);
export const applyScholarshipToChallan = asyncHandler(async (req, res) =>
  res.json({ success: true }),
);
// Renew Overdue Installment — deletes the overdue challan and reissues it
// one month later carrying its fine forward. Body may include
// `resolution: "shiftAll" | "merge"` when re-called after the frontend
// resolves a "status: conflict" response from the first call.
export const regenerateLateChallan = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.renewChallan(
    req.params.id,
    req.body,
  );
  res.status(200).json({ success: true, ...result });
});
export const updateChallan = asyncHandler(async (req, res) =>
  res.json({ success: true }),
);
export const convertToInstallment = asyncHandler(async (req, res) =>
  res.json({ success: true }),
);

export const getMasterFinancialReport = asyncHandler(async (req, res) => {
  const result = await StudentChallanService.getMasterFinancialReport(
    req.query,
    req.query.scope === "college" ? "college" : "university",
  );
  res.status(200).json({
    success: true,
    count: result.summaryRows.length,
    data: result,
  });
});

export const getStudentFinancialDossier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { termId, semesterId, scope } = req.query;

  const dossier = await StudentChallanService.getStudentFinancialDossier(
    id,
    termId,
    semesterId,
    scope === "college" ? "college" : "university",
  );

  res.status(200).json({
    success: true,
    data: dossier,
  });
});

export const createGeneralChallan = asyncHandler(async (req, res) => {
  const { category, amount, dueDate, remarks, studentRegNo } = req.body;

  if (!studentRegNo) {
    return res.status(400).json({
      success: false,
      message: "Student Registration Number is required.",
    });
  }

  const result = await StudentChallanService.createGeneral({
    studentRegNo,
    feeTitle: `${category} Fee`,
    amount,
    dueDate,
    remarks: remarks || "",
  });

  res.status(201).json({
    success: true,
    message: "Challan generated successfully",
    data: result,
  });
});
