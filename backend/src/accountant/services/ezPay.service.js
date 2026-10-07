import axios from "axios";
import StudentChallan from "../model/StudentChallan.js";

// ✅ 1. IN-MEMORY TOKEN CACHE
let cachedEzPayToken = null;
let tokenExpiryTime = null;

export class EzPayService {
  
  /**
   * ✅ 2. AUTHENTICATION MANAGER (Prevents Rate-Limiting)
   * Reuses the token if it's valid, otherwise logs in.
   */
  static async getAuthToken() {
    // If we have a token and it expires more than 5 minutes from now, reuse it!
    if (cachedEzPayToken && tokenExpiryTime && tokenExpiryTime > Date.now() + 300000) {
      return cachedEzPayToken;
    }

    try {
      const baseUrl = process.env.EZPAY_BASE_URL;
      const loginRes = await axios.post(`${baseUrl}/loginUser`, {
        email: process.env.EZPAY_EMAIL,
        password: process.env.EZPAY_PASSWORD,
      }, { timeout: 10000 }); // 10s timeout to prevent hanging

      if (loginRes.data?.status === 200 && loginRes.data?.data?.token) {
        cachedEzPayToken = loginRes.data.data.token;
        // Assume token lasts 1 hour (set expiry to 55 minutes to be safe)
        tokenExpiryTime = Date.now() + (55 * 60 * 1000); 
        return cachedEzPayToken;
      }
      
      console.error("[EzPay Auth] Login Failed:", loginRes.data?.message);
      return null;
    } catch (error) {
      console.error("[EzPay Auth] Network or Server Error:", error.message);
      return null;
    }
  }

  /**
   * Syncs to EzPay and returns TRUE if successful, FALSE if failed.
   */
  static async syncToEzPay(challanOrId) {
    try {
      // 1. FETCH DATA
      const challanId = challanOrId._id || challanOrId;
      const challan = await StudentChallan.findById(challanId).populate({
        path: "studentId",
        select: "rollNo rollNumber studentId name email personalInfo",
        populate: { path: "personalInfo", select: "fullName phone email" },
      });

      if (!challan) return false;

      // Do not sync inactive or already paid challans
      if (["paid", "cancelled", "merged"].includes(challan.status)) {
        return false;
      }

      // 2. CHECK FOR ZERO AMOUNT
      const amountVal = Math.floor(challan.netAmount || 0);
      if (amountVal <= 0) {
        await StudentChallan.findByIdAndUpdate(challan._id, {
          isSyncedToEzPay: false,
          remarks: (challan.remarks ? challan.remarks + " | " : "") + "Zero amount - Skipped EzPay",
        });
        return true;
      }

      // 3. PREPARE SANITIZED DATA
      const studentProfile = challan.studentId || {};
      const personalInfo = studentProfile.personalInfo || {};

      const finalRegNo = studentProfile.studentId || studentProfile.rollNo || `REG-${challan.challanNo}`;

      // Phone Formatting: Strict 92XXXXXXXXXX matching EzPay standards
      let rawPhone = (personalInfo.phone || "923000000000").replace(/\D/g, "");
      if (rawPhone.startsWith("03")) rawPhone = "92" + rawPhone.substring(1);
      else if (rawPhone.startsWith("3")) rawPhone = "92" + rawPhone;
      if (rawPhone.length < 10 || rawPhone.length > 15) rawPhone = "923000000000";

      const amountStr = amountVal.toString();
      const amountLateStr = Math.floor(amountVal + (challan.fineAmount || 2000)).toString();

      const d = new Date(challan.dueDate || Date.now());
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const safeEmail = (personalInfo.email || studentProfile.email || process.env.EZPAY_FALLBACK_EMAIL || "no-reply@college.edu").trim();
      const safeName = (personalInfo.fullName || "Student Name").substring(0, 30).trim();

      const payload = {
        registration_number: finalRegNo,
        first_name: safeName,
        email: safeEmail,
        phone: rawPhone,
        amount: amountStr,
        amount_after_due_date: amountLateStr,
        due_date: formattedDate,
        description: (challan.challanType || "Fee").replace(/_/g, " "),
        misc_1: `Challan-${challan.challanNo}`,
        misc_2: challan._id.toString(), // Backup DB ID
        misc_3: "NA",
        misc_4: "NA",
      };

      // 4. GET TOKEN (Uses cache if available)
      const token = await this.getAuthToken();
      if (!token) return false;

      // 5. SEND INVOICE WITH TIMEOUT
      const invoiceRes = await axios.post(
        `${process.env.EZPAY_BASE_URL}/AddPayment/Student`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15-second timeout to prevent server hanging
        }
      );

      // 6. HANDLE RESPONSE
      if (invoiceRes.data?.status === 1) {
        const ezData = invoiceRes.data.data;
        await StudentChallan.findByIdAndUpdate(challan._id, {
          $set: {
            paymentReference: ezData.concat_vendor_invoice_one_bill_ref,
            ezPayBillId: ezData.one_bill_ref,
            ezPayTranId: ezData.tran_auth_id,
            isSyncedToEzPay: true,
            syncedAt: new Date(),
          },
        });
        return true;
      } else {
        console.error(`[EzPay Sync] Invoice failed for ${challan.challanNo}:`, invoiceRes.data);
        return false;
      }
    } catch (error) {
      console.error(`[EzPay Sync] System Error for ${challanOrId}:`, error.message);
      return false;
    }
  }
}