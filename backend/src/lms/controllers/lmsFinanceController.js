import { asyncHandler } from "../middleware/asyncHandler.js";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StudentFeePreference from "../../accountant/model/StudentFeePreference.js";
import StudentFeeStructure from "../../accountant/model/StudentFeeStructure.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";

export const getMyChallans = asyncHandler(async (req, res) => {
  // Securely get the ID from the verified token, NOT from the URL parameters
  const studentId = req.studentProfileId;

  // Reuse your existing accountant service to fetch the data
  const challans =
    await StudentChallanService.getChallansByStudentId(studentId);

  // This service is shared with the accountant console, which deliberately
  // keeps voided/deleted challans visible (struck through, badged "VOID")
  // as part of the staff-facing history. The student portal has no such
  // badge, so a voided challan was showing up looking like a real pending
  // fee voucher — filtered out here, at the LMS boundary, so the admin
  // console's own behavior stays untouched.
  const visibleChallans = challans.filter(
    (c) => !c.isDeleted && c.status !== "cancelled" && c.status !== "merged",
  );

  res.status(200).json({ success: true, data: visibleChallans });
});

// The student's full installment schedule for their CURRENT semester —
// unlike /my-challans (which only ever shows challans that already exist),
// this also surfaces installments that haven't been billed yet, so a
// student can see their whole upcoming month-by-month plan, not just
// whatever has already been generated. Paid installments are dropped
// entirely (they still show up in the full Voucher History via
// /my-challans); planned-but-not-yet-issued ones fall back to the amount
// implied by their configured percentage of the Tuition fee.
export const getMyInstallmentPlan = asyncHandler(async (req, res) => {
  const studentId = req.studentProfileId;

  const student = await StudentProfile.findById(studentId)
    .select("semesterId")
    .populate("semesterId", "name number");

  if (!student || !student.semesterId) {
    return res.status(200).json({ success: true, data: { hasPlan: false } });
  }

  const semesterId = student.semesterId._id;

  // Same legacy-untagged fallback used by the accountant-side
  // getStudentPreference — a preference saved before semesterId tagging
  // existed should still count as this semester's plan when it's the only
  // untagged one on record.
  let preference = await StudentFeePreference.findOne({
    studentId,
    semesterId,
  });
  if (!preference) {
    const untagged = await StudentFeePreference.find({
      studentId,
      semesterId: { $in: [null, undefined] },
    });
    if (untagged.length === 1) preference = untagged[0];
  }

  if (!preference || (preference.defaultInstallments || 1) <= 1) {
    return res.status(200).json({ success: true, data: { hasPlan: false } });
  }

  const count = preference.defaultInstallments;
  let percentages = preference.customPercentages || [];
  if (
    percentages.length !== count ||
    Math.abs(percentages.reduce((a, b) => a + b, 0) - 100) > 0.5
  ) {
    const base = Math.floor(100 / count);
    percentages = Array(count).fill(base);
    percentages[count - 1] += 100 - base * count;
  }
  const months = preference.customMonths || [];

  // Tuition (ACADEMIC) fee actually configured for this semester — the base
  // that installment percentages are a split of, same lookup + untagged
  // fallback used by the Installment Configuration screens.
  const academicFees = await StudentFeeStructure.find({
    studentId,
    category: "ACADEMIC",
    isActive: true,
  });
  let tuitionFee = academicFees.find(
    (f) => String(f.semesterId || "") === String(semesterId),
  );
  if (!tuitionFee) {
    const untaggedFees = academicFees.filter((f) => !f.semesterId);
    if (untaggedFees.length === 1) tuitionFee = untaggedFees[0];
  }
  const totalAmount = tuitionFee?.totalAmount || 0;

  const generatedChallans = await StudentChallan.find({
    studentId,
    semesterId,
    isInstallment: true,
    isDeleted: false,
    status: { $nin: ["cancelled", "merged"] },
  });

  const installments = [];
  for (let i = 0; i < count; i++) {
    const installmentNumber = i + 1;
    const plannedMonth = months[i] || null;
    const generated = generatedChallans.find(
      (c) => c.installmentNumber === installmentNumber,
    );

    if (generated) {
      if (generated.status === "paid") continue; // already paid — hide it
      installments.push({
        installmentNumber,
        month: generated.billingMonth || plannedMonth,
        amount: generated.netAmount,
        dueDate: generated.dueDate,
        status: generated.status,
        isGenerated: true,
        challanId: generated._id,
      });
    } else {
      const plannedAmount = totalAmount
        ? Math.round((totalAmount * (percentages[i] || 0)) / 100)
        : 0;
      installments.push({
        installmentNumber,
        month: plannedMonth,
        amount: plannedAmount,
        dueDate: null,
        status: "not_generated",
        isGenerated: false,
        challanId: null,
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      hasPlan: true,
      semester: {
        name: student.semesterId.name,
        number: student.semesterId.number,
      },
      totalAmount,
      installments,
    },
  });
});
