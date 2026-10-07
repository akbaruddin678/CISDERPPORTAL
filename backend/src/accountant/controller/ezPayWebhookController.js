import StudentChallan from "../model/StudentChallan.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

export const handleEzPayNotification = asyncHandler(async (req, res) => {
  // console.log("=== INCOMING EZPAY WEBHOOK ===");
  // console.log("BODY:", req.body);

  /* // 🚨 TEMPORARILY DISABLED API KEY CHECK FOR TESTING
  const apiKey = req.headers["api_key"] || req.headers["api-key"] || req.headers.api_key || req.query.api_key;
  if (!apiKey || apiKey !== process.env.EZPAY_API_KEY) {
    console.error("❌ Webhook Auth Failed.");
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  */

  // 1. Extract payload
  const { billno, rcvdamount, rcvddate, rcvdtime, rcvdvia } = req.body;

  // 2. Strict Input Validation
  if (!billno) {
    return res.status(400).json({
      status: "error",
      message: "Invalid payload: 'billno' is required.",
    });
  }

  // 3. ⚡ INSTANTLY RETURN 200 OK TO THE BANK
  // This prevents the bank's system from timing out while your database processes the update.
  res.status(200).json({ status: "success" });

  // 4. PROCESS THE DATABASE UPDATE IN THE BACKGROUND
  setImmediate(async () => {
    try {
      // Find Challan
      const challan = await StudentChallan.findOne({ paymentReference: billno });

      if (!challan) {
        console.error(`[WEBHOOK DB] ⚠️ Challan with reference ${billno} not found in DB.`);
        return;
      }

      // Check if already paid (Idempotency check to prevent duplicate processing)
      if (challan.status === "paid") {
        console.log(`[WEBHOOK DB] ✅ Challan ${billno} is already marked as paid.`);
        return;
      }

      // Calculate paid amount and remaining balance accurately
      const paidAmount = parseFloat(rcvdamount) || challan.netAmount;
      challan.paidAmount = paidAmount;
      challan.remainingAmount = Math.max(0, challan.netAmount - paidAmount);

      // If fully paid, mark as 'paid', otherwise mark as 'partial'
      challan.status = challan.remainingAmount <= 0 ? "paid" : "partial";

      // Safely parse the exact bank payment date/time, fallback to now if invalid
      try {
        challan.paidAt = (rcvddate && rcvdtime) 
          ? new Date(`${rcvddate}T${rcvdtime}`) 
          : new Date();
      } catch {
        challan.paidAt = new Date();
      }

      // Append the new remark without erasing old ones
      const newRemark = `Paid via ${rcvdvia || "Unknown Bank"}`;
      challan.remarks = challan.remarks ? `${challan.remarks} | ${newRemark}` : newRemark;

      // Save to database
      await challan.save();
      console.log(`[WEBHOOK DB] 💰 Successfully processed payment for Challan: ${billno}`);

    } catch (bgError) {
      // If the database fails, catch it here so the Node server doesn't crash
      console.error(`[WEBHOOK DB ERROR] ❌ Failed to process billno ${billno}:`, bgError.message);
    }
  });
});