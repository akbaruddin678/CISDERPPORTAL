import { useMemo } from "react";

// Derives every stats number directly from the SAME real, already-fetched
// bucket data the pipeline tabs render (incomplete/complete counts + the
// pipeline hook's buckets) — not a separate backend aggregate. This is the
// fix for the stats tab disagreeing with what a tab actually shows (e.g.
// "Fee Overdue: 1" in stats while the Fee Overdue tab was empty): there is
// now only one source of truth, so the two can never diverge again.
export const useAdmissionStatsController = ({ draftCount, submittedCount, buckets, trashCount }) => {
  const stats = useMemo(() => {
    const accepted = buckets.accepted.length;
    const challanGenerated = buckets.challanGenerated.length;
    const feePaid = buckets.feePaid.length;
    const feeOverdue = buckets.feeOverdue.length;
    const cancelledNonPayment = buckets.cancelledNonPayment?.length || 0;

    const acceptedTotal = accepted + challanGenerated + feePaid + feeOverdue + cancelledNonPayment;
    const challanGeneratedTotal = challanGenerated + feePaid + feeOverdue + cancelledNonPayment;
    const totalSubmittedEver = submittedCount + acceptedTotal;

    return {
      draft: draftCount,
      submitted: submittedCount,
      accepted,
      challanGenerated,
      feePaid,
      feeOverdue,
      cancelledNonPayment,
      trashCount,
      acceptedTotal,
      challanGeneratedTotal,
      totalSubmittedEver,
    };
  }, [draftCount, submittedCount, buckets, trashCount]);

  const chartData = useMemo(
    () => [
      { name: "Incomplete", value: stats.draft, color: "#94a3b8" },
      { name: "Complete", value: stats.submitted, color: "#3b82f6" },
      { name: "Accepted", value: stats.accepted, color: "#8b5cf6" },
      { name: "Challan Generated", value: stats.challanGenerated, color: "#f59e0b" },
      { name: "Fee Paid", value: stats.feePaid, color: "#10b981" },
      { name: "Fee Overdue", value: stats.feeOverdue, color: "#ef4444" },
      { name: "Cancelled — Non-Payment", value: stats.cancelledNonPayment, color: "#78716c" },
    ],
    [stats],
  );

  return { stats, chartData };
};
