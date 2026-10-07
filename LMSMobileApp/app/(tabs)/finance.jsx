import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Receipt,
  AlertCircle,
  CheckCircle2,
  Download,
  Clock,
  Printer,
} from "lucide-react-native";
import { useGetMyChallansQuery } from "../../src/services/lmsApi";
import * as Print from "expo-print";

// ✅ Imported logos
import neilogo from "../../assets/images/neilogo.png";
import logo1bill from "../../assets/images/onelink.png";
import accountstamp from "../../assets/images/accountstamp.jpeg"; // ✅ Account stamp imported

export default function FinanceScreen() {
  const user = useSelector((state) => state.auth.user);

  const {
    data: challansRes,
    isLoading,
    isError,
  } = useGetMyChallansQuery(user?.profileId, {
    skip: !user?.profileId,
  });

  const challans = challansRes?.data?.challans || challansRes?.data || [];

  const { totalDue, totalPaid, upcomingCount } = useMemo(() => {
    let due = 0;
    let paid = 0;
    let upcoming = 0;
    challans.forEach((challan) => {
      const amount = Number(challan.netAmount) || 0;
      if (challan.status === "paid") {
        paid += amount;
      } else {
        due += amount;
        upcoming += 1;
      }
    });
    return { totalDue: due, totalPaid: paid, upcomingCount: upcoming };
  }, [challans]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // PRINT LOGIC (SCROLL FIXED, STAMP ADDED, A4 ALIGNED)
  // =========================================================
  const handlePrint = async (challan) => {
    if (!challan) return;

    // 1. Properly resolve Image URIs for both Web and Mobile
    const logoUrl =
      Platform.OS === "web"
        ? new URL(neilogo, window.location.origin).href
        : Image.resolveAssetSource(neilogo).uri;

    const oneBillLogoUrl =
      Platform.OS === "web"
        ? new URL(logo1bill, window.location.origin).href
        : Image.resolveAssetSource(logo1bill).uri;

    // ✅ Resolve Stamp URI
    const stampUrl =
      Platform.OS === "web"
        ? new URL(accountstamp, window.location.origin).href
        : Image.resolveAssetSource(accountstamp).uri;

    const formatPrintDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        return new Date(dateString).toLocaleDateString("en-GB");
      } catch (e) {
        return "N/A";
      }
    };

    const formatCurrency = (amount) =>
      amount ? amount.toLocaleString("en-PK") : "0";

    const student = challan.studentId || {};
    const personalInfo = student.personalInfo || challan.personalInfo || {};
    const familyInfo = student.familyInfo || challan.familyInfo || {};

    const fatherName =
      familyInfo?.fatherName ||
      personalInfo?.fatherName ||
      student?.fatherName ||
      "-";
    const programName =
      challan.programId?.name ||
      student.programId?.name ||
      user?.program ||
      "N/A";
    const sessionName = challan.termId?.name || "N/A";
    const semesterName = challan.semesterId?.number
      ? ` ${challan.semesterId.number}`
      : "N/A";

    const invoiceSuffix = challan.paymentReference || "00000000";
    const fullOneBillId = `101340${invoiceSuffix}`;
    const challanTypeFormatted = challan.challanType
      ? challan.challanType.replace(/_/g, " ").toUpperCase()
      : "FEE";

    let feeRowsHTML = `
      <tr style="background-color: #f0f0f0;">
        <td class="fee-label" style="font-weight:900;">${challanTypeFormatted}</td>
        <td class="fee-amount" style="font-weight:900;">${formatCurrency(challan.netAmount)}</td>
      </tr>
    `;

    if (challan.feeDetails) {
      Object.entries(challan.feeDetails).forEach(([key, amount]) => {
        if (amount > 0 && !key.toLowerCase().includes("arrears")) {
          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
          feeRowsHTML += `<tr><td class="fee-label">${label}</td><td class="fee-amount">-</td></tr>`;
        }
      });
    }

    if (challan.arrears > 0)
      feeRowsHTML += `<tr><td class="fee-label">Arrears / Previous</td><td class="fee-amount">${formatCurrency(challan.arrears)}</td></tr>`;
    if (challan.fineAmount > 0)
      feeRowsHTML += `<tr><td class="fee-label">Late Fine</td><td class="fee-amount">${formatCurrency(challan.fineAmount)}</td></tr>`;
    if (challan.scholarshipAmount > 0)
      feeRowsHTML += `<tr><td class="fee-label">Scholarship</td><td class="fee-amount">(${formatCurrency(challan.scholarshipAmount)})</td></tr>`;
    if (challan.discountAmount > 0)
      feeRowsHTML += `<tr><td class="fee-label">Discount ${challan.discountReason ? `(${challan.discountReason})` : ""}</td><td class="fee-amount">(${formatCurrency(challan.discountAmount)})</td></tr>`;

    const generateCard = (copyTitle) => `
      <div class="challan-card">
        <div class="copy-label">${copyTitle}</div>
        <div class="bank-name-main">NATIONAL EXCELLENCE INSTITUTE</div>
        <div class="challan-header">
          <div class="logo-container"><img src="${logoUrl}" class="logo-img" alt="NEI Logo" onerror="this.style.display='none'"/></div>
          <div class="header-content">
            <div class="fee-challan-title">FEE CHALLAN</div>
            <div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
            <div style="margin-top: 6px; border: 2px solid #000; padding: 4px; background: #e0f7fa;">
               <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">1 Bill Invoice </div>
               <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">${fullOneBillId}</div>
            </div>
          </div>
          <div class="logo-container"><img src="${oneBillLogoUrl}" class="logo-img" style="object-fit:contain;" alt="1Bill Logo" onerror="this.style.display='none'"/></div>
        </div>
        <div class="separator-line"></div>
        <div class="content-area">
          <div class="info-section">
            <table class="info-table">
              <tr><td class="info-label">Due Date</td><td class="info-value">${formatPrintDate(challan.dueDate)}</td><td class="info-label">Reg ID</td><td class="info-value">${student.studentId || user?.rollNumber || "N/A"}</td></tr>
              <tr><td class="info-label">Name</td><td class="info-value">${personalInfo.fullName || user?.name || "N/A"}</td><td class="info-label">Father Name</td><td class="info-value">${fatherName}</td></tr>
              <tr><td class="info-label">Program</td><td class="info-value">${programName}</td><td class="info-label">Semester</td><td class="info-value">${semesterName}</td></tr>
              <tr><td class="info-label">Session</td><td class="info-value">${sessionName}</td><td class="info-label">Type</td><td class="info-value">${challanTypeFormatted}</td></tr>
              <tr><td class="info-label">Challan No</td><td class="info-value" colspan="3">${challan.challanNo}</td></tr>
            </table>
          </div> 
          <div class="separator-line"></div>
          <div class="fee-details-title">FEE DETAILS</div>
          <div class="table-container">
            <table class="fee-table">
              ${feeRowsHTML}
              <tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr>
              <tr class="total-row"><td class="fee-label">GRAND TOTAL</td><td class="fee-amount">${formatCurrency(challan.netAmount)}</td></tr>
            </table>
            <div class="amount-in-words"><strong>Total (Rs):</strong> ${formatCurrency(challan.netAmount)}</div>
            <div class="footer-notes">
                <p><strong>Note:</strong></p>
                <p>1- Pay your Bills through 1Link/1-Bill (Invoice/Voucher), Banking Apps, ATMs, Easypaisa, Jazz Cash etc.</p>
                <p>2- Direct Deposit by visiting any Bank in country.</p>
                <p><strong>Late Fee Policy:</strong> Due date is 6th. Rs. 2,000 will be charged for payments from 7th–10th, and Rs. 5,000 for payments from 11th–15th.</p>
            </div>
          </div>
          <div class="signature-section">
            <div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div>
            <div class="signature-box">
              <img src="${stampUrl}" style="height: 35px; width: auto; object-fit: contain; margin: 0 auto 2px auto; display: block;" alt="Stamp" onerror="this.style.display='none'"/>
              <div class="signature-line"></div>
              <div class="signature-label">ACCOUNTS OFFICER</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ✅ Full HTML Construction (CSS SCROLL / PAGE FIXES APPLIED)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Challan - ${challan.challanNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
          
          @media print {
            @page { size: A4 landscape; margin: 5mm; }
            body { 
              width: 297mm !important; 
              height: 210mm !important; 
              margin: 0 !important; 
              padding: 10mm !important; 
              background: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              overflow: hidden !important; 
            }
            .challan-row-container { 
              display: flex !important; 
              flex-direction: row !important; 
              width: 277mm !important; 
              height: 190mm !important; 
              gap: 4mm !important; 
              justify-content: space-between !important; 
              align-items: stretch !important; 
              page-break-inside: avoid !important; 
              break-inside: avoid !important; 
            }
            .challan-card { flex: 1 !important; min-width: 0 !important; border: 0.5mm dashed #000 !important; background: white !important; position: relative !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; page-break-inside: avoid !important; break-inside: avoid !important; }
            .info-label, .fee-label { background-color: #f5f5f5 !important; }
            .total-row { background-color: #e0e0e0 !important; }
            .bank-account { background-color: #f0f0f0 !important; }
            .footer-notes { background-color: #fffde7 !important; }
            .copy-label { padding: 2px 0.5px; background-color: rgb(255, 255, 255) !important; border: 0.2mm solid rgb(94, 94, 94) !important; color: #000000 !important}
            .no-print { display: none !important; }
          }
          
          .challan-header { text-align: center; padding: 2px 6px 6px;  background: white; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; position: relative; }
          .logo-container { flex-shrink: 0; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
          .logo-img { width: 55px; height: 55px; object-fit: contain; border-radius: 8px; }
          
          .header-content { flex: 1; text-align: center; }
          .bank-name-main { font-size: 16px; font-weight: bold; color: #1a237e; margin-top: 24px; margin-bottom: 2px; text-align: center; width: 100%; letter-spacing: 0.2px; }
          .fee-challan-title { font-size: 13px; font-weight: bold; color: #d32f2f; margin-bottom: 3px; text-transform: uppercase; line-height: 1.1; }
          .address { font-size: 10px; color: #000; margin-bottom: 4px; line-height: 1.1; white-space: normal; }
          .separator-line { border-top: 0.5mm solid #000; margin: 6px 0; flex-shrink: 0; }
          .info-section { width: 100%; padding: 6px; flex-shrink: 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; font-size: 9px; }
          .info-table td { border: 0.5mm solid #000; padding: 4px 5px; min-height: 24px; vertical-align: middle; white-space: normal; word-wrap: break-word; overflow: visible; }
          .info-label { font-weight: bold; width: 20%; font-size: 9px; }
          .info-value { text-align: left; width: 30%; font-size: 9px; }
          .fee-details-title { text-align: center; font-size: 12px; font-weight: bold; margin: 8px 0 4px; text-decoration: underline; flex-shrink: 0; }
          
          /* ✅ SCROLL FIXES APPLIED */
          .content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0 6px; } 
          .table-container { flex: 1; margin-bottom: 0.5px; min-height: 0; overflow: hidden; } 
          .fee-table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; flex-grow: 1; font-size: 9px; }
          .fee-table td { border: 0.5mm solid #000; padding: 2px 4px; height: auto; min-height: 16px; vertical-align: middle; overflow: hidden; } 
          
          .fee-label { font-weight: bold; background: #f5f5f5; width: 70%; font-size: 9px; }
          .fee-amount { text-align: right; width: 30%; font-weight: bold; font-family: 'Courier New', monospace; padding-right: 8px; font-size: 9px; }
          .total-row { font-weight: bold; background: #e0e0e0; }
          .total-row .fee-amount { font-size: 10px; }
          .footer-notes { margin: 8px 6px; padding: 5px; border: 0.5mm solid #000; background: #fffde7; font-size: 8px; line-height: 1.2; flex-shrink: 0; border-radius: 2px; }
          .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin: 10px 6px 6px; padding-top: 6px; flex-shrink: 0; }
          .signature-box { text-align: center; width: 45%; min-width: 0; }
          .signature-line { width: 100%; border-top: 0.5mm solid #000; margin: 2px 0; }
          .signature-label { font-size: 8px; font-weight: bold; line-height: 1.1; }
          .copy-label { position: absolute; top: 6px; left: 6px; padding: 2px 8px; font-weight: bold; font-size: 8px; z-index: 10; border-radius: 3px; color: white; }
          .amount-in-words { font-size: 9px; margin-bottom: 5px; border: 1px solid #ccc; padding: 3px; }
        </style>
      </head>
      <body>
        <div class="challan-row-container">
          ${generateCard("BANK COPY")}
          ${generateCard("OFFICE COPY")}
          ${generateCard("STUDENT COPY")}
        </div>
      </body>
      </html>
    `;

    try {
      if (Platform.OS === "web") {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(htmlContent);
        // Only append the print script on the Web platform
        printWindow.document.write(
          "<script>setTimeout(function(){ window.print(); }, 500);</script>",
        );
        printWindow.document.close();
      } else {
        // ✅ Native Mobile Print: Automatically forces landscape mode for the 3-part layout
        await Print.printAsync({
          html: htmlContent,
          orientation: Print.Orientation.landscape,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // =========================================================
  // MOBILE UI RENDER
  // =========================================================
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Fee Vouchers</Text>
          <Text style={styles.pageSub}>
            Manage your tuition fees and payment history.
          </Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { borderLeftColor: "#ea580c" }]}>
            <View style={[styles.iconBox, { backgroundColor: "#fff7ed" }]}>
              <AlertCircle size={20} color="#ea580c" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Due</Text>
              <Text style={[styles.summaryValue, { color: "#ea580c" }]}>
                Rs. {totalDue.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: "#16a34a" }]}>
            <View style={[styles.iconBox, { backgroundColor: "#f0fdf4" }]}>
              <CheckCircle2 size={20} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: "#16a34a" }]}>
                Rs. {totalPaid.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.listTitle}>Voucher History</Text>

        {challans.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Vouchers Found</Text>
            <Text style={styles.emptySub}>
              You do not have any fee challans issued at the moment.
            </Text>
          </View>
        ) : (
          challans.map((challan) => {
            const isOverdue =
              new Date(challan.dueDate) < new Date() &&
              challan.status !== "paid";
            return (
              <View key={challan._id} style={styles.challanCard}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.challanNo}>#{challan.challanNo}</Text>
                    <Text style={styles.challanType}>
                      {challan.challanType
                        ? challan.challanType.replace("_", " ")
                        : "Semester Fee"}
                    </Text>
                  </View>
                  <Text style={styles.amount}>
                    Rs. {Number(challan.netAmount || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.cardMiddle}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Issued</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(challan.issuedAt)}
                    </Text>
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Due</Text>
                    <Text
                      style={[
                        styles.dateValue,
                        isOverdue && { color: "#ef4444" },
                      ]}
                    >
                      {formatDate(challan.dueDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.statusWrap}>
                    {challan.status === "paid" ? (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: "#f0fdf4",
                            borderColor: "#bbf7d0",
                          },
                        ]}
                      >
                        <CheckCircle2 size={12} color="#16a34a" />
                        <Text style={[styles.badgeText, { color: "#16a34a" }]}>
                          PAID
                        </Text>
                      </View>
                    ) : isOverdue ? (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: "#fef2f2",
                            borderColor: "#fecaca",
                          },
                        ]}
                      >
                        <AlertCircle size={12} color="#ef4444" />
                        <Text style={[styles.badgeText, { color: "#ef4444" }]}>
                          OVERDUE
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: "#fff7ed",
                            borderColor: "#fed7aa",
                          },
                        ]}
                      >
                        <Clock size={12} color="#ea580c" />
                        <Text style={[styles.badgeText, { color: "#ea580c" }]}>
                          PENDING
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handlePrint(challan)}
                  >
                    {challan.status === "paid" ? (
                      <Download size={14} color="#334155" />
                    ) : (
                      <Printer size={14} color="#334155" />
                    )}
                    <Text style={styles.actionBtnText}>
                      {challan.status === "paid" ? "Receipt" : "Print"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  pageSub: { fontSize: 14, color: "#64748b", marginTop: 4, fontWeight: "500" },
  summaryContainer: { flexDirection: "column", gap: 12, marginBottom: 24 },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    elevation: 2,
  },
  iconBox: { padding: 10, borderRadius: 12 },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: { fontSize: 22, fontWeight: "900" },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
  },
  challanCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  challanNo: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  challanType: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  amount: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  cardMiddle: { flexDirection: "row", gap: 24, marginBottom: 16 },
  dateCol: { flex: 1 },
  dateLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 2,
  },
  dateValue: { fontSize: 13, color: "#334155", fontWeight: "700" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  statusWrap: { flexDirection: "row" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: "#334155" },
});
