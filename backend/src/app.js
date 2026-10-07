import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { notFound, errorHandler } from "./core/middleware/error.js";
import { activityLogger } from "./core/middleware/activityLogger.js";
import activityLogRoutes from "./core/routes/activityLog.routes.js";
import userSessionRoutes from "./user/routes/userSessionRoutes.js";
import schoolRoutes from "./school/routes/schoolRoutes.js";
import revenueExplorerRoutes from "./accountant/routes/revenueExplorer.routes.js";



// Import existing routes
import userRoutes from "./user/routes/userRoutes.js";
import adminRoutes from "./admin/routes/adminRoutes.js";
import adminLmsRoutes from "./admin/routes/adminLmsRoutes.js"
import admissionsRoutes from "./admissions/routes/admissionsRoutes.js";
import admissionchallanRoutes from "./admissions/routes/challanRoutes.js";
import admissionTrashRoutes from "./admissions/routes/admissionTrashRoutes.js";
import manualAdmissionRoutes from "./admissions/routes/manualAdmissionRoutes.js";
import admissionCampaignRoutes, {
  publicAdmissionCampaignRouter,
} from "./admissions/routes/admissionCampaignRoutes.js";
import studentRoutes from "./student/routes/studentRoutes.js";
import studentTrashRoutes from "./student/routes/studentTrashRoutes.js";
import promotionRoutes from "./student/routes/promotionRoutes.js";
import hodStudentRoutes from "./student/routes/hodStudentRoutes.js";
import studentCardRoutes from "./student/routes/studentCardRoutes.js";
import catalogRoutes from "./catalog/routes/catalogRoutes.js";
import programRegulationRoutes from "./catalog/routes/programRegulationRoutes.js";


import promotionRequestRoutes from "./student/routes/promotionRequestRoutes.js";

// Import fee management routes
import feeStructureRoutes from "./accountant/routes/feeStructure.routes.js";
import hostelAllocationRoutes from "./hostel/routes/hostelAllocation.routes.js";
import studentChallanRoutes from "./accountant/routes/studentChallan.routes.js";
import scholarshipRoutes from "./accountant/routes/scholarship.routes.js";
import installmentRoutes from "./accountant/routes/installment.routes.js";
import fineRoutes from "./accountant/routes/fine.routes.js";
import accountStudentRoutes from "./accountant/routes/student.routes.js";
import singlestudenttChallanRoutes from "./accountant/routes/singlestudentChallan.routes.js";
import webhookRoutes from "./accountant/routes/webhook.routes.js";
import studentFeeRoutes from "./accountant/routes/studentFee.routes.js";
//Transport Management
import transportroutes  from "./transport/routes/transportRoutes.js"
// Auto RUN
import { initializeFeeHeads } from "../src/accountant/utils/seedFeeHeads.js"


// --- Course Module ---
import courseRoutes from "../src/course/routes/courseRoutes.js";
import courseAssignmentRoutes from "../src/course/routes/courseAssignmentRoutes.js";
import courseWithdrawalRoutes from "../src/course/routes/courseWithdrawalRoutes.js";
import disciplinaryRoutes from "../src/registrar/routes/disciplinaryRoutes.js";
import timetableRoutes from "../src/registrar/routes/timetableRoutes.js";
import roomRoutes from "../src/registrar/routes/roomRoutes.js";
import graduationRoutes from "./graduation/routes/graduationRoutes.js";
import { seedClearanceOffices } from "./graduation/utils/seedClearanceOffices.js";
import alumniRoutes from "../src/registrar/routes/alumniRoutes.js";
import complianceRoutes from "../src/registrar/routes/complianceRoutes.js";
import registrarDashboardRoutes from "../src/registrar/routes/registrarDashboardRoutes.js";
import vcDashboardRoutes from "./vc/routes/vcDashboardRoutes.js";
import studentCourseRoutes from "../src/course/routes/studentCourseRoutes.js";
import creditOverrideRoutes from "../src/course/routes/creditOverrideRoutes.js";
import lectureRoutes from "../src/course/routes/lectureRoutes.js";
import assignmentRoutes from "../src/course/routes/assignmentRoutes.js";
import teacherAttendanceRoutes from "../src/course/routes/attendanceRoutes.js";

// --- Exam Module ---
import examSetupRoutes from "../src/exam/routes/examSetupRoutes.js";
import examRoutes from "../src/exam/routes/examRoutes.js";
import examConductionRoutes from "../src/exam/routes/examConductionRoutes.js";
import marksRoutes from "../src/exam/routes/marksRoutes.js";
import postExamRoutes from "../src/exam/routes/postExamRoutes.js";
import hodPostExamRoutes from "../src/exam/routes/hodPostExamRoutes.js";
import examHodRoutes from "../src/exam/routes/examHodRoutes.js";
import teacherMarksRoutes from "../src/exam/routes/teacherMarksRoutes.js";
import degreeAuditRoutes from "../src/exam/routes/degreeAuditRoutes.js";

//LMS ROUTES

import lmsAuthRoutes from  "../src/student/routes/lmsAuthRoutes.js"
import lmsFinanceRoutes from "../src/lms/routes/lmsFinanceRoutes.js";
import lmsCourseRoutes from "../src/lms/routes/lmsCourseRoutes.js";
import lmsDashboardRoutes from "../src/lms/routes/lmsDashboardRoutes.js";
import notificationRoutes from "../src/notification/routes/notificationRoutes.js";
import lmsTranscriptRoutes from "../src/lms/routes/lmsTranscriptRoutes.js";

import feeAnalyticsRoutes from "../src/finance/routes/feeAnalyticsRoutes.js";
import { startChallanCronJob } from "../src/accountant/utils/challanCron.js";
import { startStudentTrashCronJob } from "../src/student/utils/studentTrashCron.js";
import { startAdmissionTrashCronJob } from "../src/admissions/utils/admissionTrashCron.js";
import { startApplicantCleanupCronJob } from "../src/user/utils/applicantCleanupCron.js";
import paymentRecordRoutes from "../src/accountant/routes/paymentRecord.routes.js";
import websitePortalFeeRoutes from "../src/accountant/routes/websitePortalFee.routes.js";
import studentLeftRoutes from "../src/accountant/routes/studentLeft.routes.js";
import hrRoutes from "../src/hr/routes/hrRoutes.js";
import publicOnboardingRoutes from "../src/hr/routes/publicOnboardingRoutes.js";
import hrAttendanceRoutes from "../src/hr/routes/attendanceRoutes.js";
import hrPayrollRoutes from "../src/hr/routes/payrollRoutes.js";
import hrAppraisalRoutes from "../src/hr/routes/appraisalRoutes.js";
import hrRecruitmentRoutes from "../src/hr/routes/recruitmentRoutes.js";
import hrExitRoutes from "../src/hr/routes/exitRoutes.js";
import hrInventoryRoutes from "../src/hr/routes/inventoryRoutes.js";
import attendanceDeviceRoutes from "../src/hr/routes/attendanceDeviceRoutes.js";
import { startHrAlertCronJob } from "../src/hr/utils/hrAlertCron.js";
import { startAttendanceAbsenceCronJob } from "../src/hr/utils/attendanceAbsenceCron.js";
import { startZkBridge } from "../src/hr/utils/zkBridge.js";

import  staffroutes from  "../src/staff/routes/staffRoutes.js"
import staffLeaveRoutes from "../src/staff/routes/staffLeaveRoutes.js";
import staffAppraisalRoutes from "../src/staff/routes/staffAppraisalRoutes.js";
import classSubstitutionRoutes from "../src/staff/routes/classSubstitutionRoutes.js";


//College Registration 
import collegeSyncRoutes from "../src//student/routes/collegeSyncRoutes.js";

// Fee-head seeding and cron jobs both query the database, so both must wait
// for the connection to actually be ready instead of firing at module-load
// time — previously `connectDB()` here was fire-and-forget (no `await`) and
// the cron starts ran synchronously right after, meaning they (and any HTTP
// request that arrived in the first several seconds of the process, since
// `server.js` started listening immediately too) could hit Mongoose's
// buffering timeout during Atlas's DNS/TLS handshake window. `server.js`
// now awaits `connectDB()` and then this function before calling
// `server.listen()`, so nothing runs ahead of the connection being live.
export async function bootstrap() {
  await initializeFeeHeads();
  await seedClearanceOffices();
  startChallanCronJob();
  startStudentTrashCronJob();
  startAdmissionTrashCronJob();
  startApplicantCleanupCronJob();
  startHrAlertCronJob();
  startAttendanceAbsenceCronJob();
  // startZkBridge();
}

const app = express();

app.use(helmet());


app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Records every create/update/delete any user makes, anywhere in the app —
// must come after body parsing (needs req.body) but before the domain
// routers so it wraps every request. See core/middleware/activityLogger.js.
app.use(activityLogger);

app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "GET");
    next();
  },
  express.static(path.resolve("uploads"))
);

// Health check
app.get("/health", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes - Organized by domain
app.use("/api/user", userRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/lms", adminLmsRoutes);
app.use("/api/admissions", admissionsRoutes);
app.use("/api/admissions/challans", admissionchallanRoutes);
app.use("/api/admissions/trash", admissionTrashRoutes);
app.use("/api/admissions/manual", manualAdmissionRoutes);
app.use("/api/admissions/campaigns", admissionCampaignRoutes);
app.use("/api/public/admission-campaign", publicAdmissionCampaignRouter);
app.use("/api/student", studentRoutes);
app.use("/api/student-trash", studentTrashRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/hod/students", hodStudentRoutes);
app.use("/api/student-cards", studentCardRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/catalog/program-regulations", programRegulationRoutes);
app.use("/api/requests", promotionRequestRoutes);
// Fee Management Routes
app.use("/api/account/fee-structures", feeStructureRoutes);
app.use("/api/account/hostel-allocation", hostelAllocationRoutes);
app.use("/api/account/challans", studentChallanRoutes);
app.use("/api/account/scholarships", scholarshipRoutes);
app.use("/api/account/installments", installmentRoutes);
app.use("/api/account/fines", fineRoutes);
app.use("/api/account/students", accountStudentRoutes);
app.use("/api/account/single-student-challans", singlestudenttChallanRoutes);
app.use("/api/account/student-fees", studentFeeRoutes);
app.use("/api/portal", websitePortalFeeRoutes);
app.use("/api/students", studentLeftRoutes);



// Transport Routes

app.use("/api/transport", transportroutes)






app.use("/api/webhooks", webhookRoutes);


// --- Course Module Routing ---
  app.use("/api/course/management", courseRoutes);
  app.use("/api/course/assignment", courseAssignmentRoutes);
  app.use("/api/course/withdrawals", courseWithdrawalRoutes);
  app.use("/api/registrar/disciplinary", disciplinaryRoutes);
  app.use("/api/registrar/timetable", timetableRoutes);
  app.use("/api/registrar/rooms", roomRoutes);
  app.use("/api/graduation", graduationRoutes);
  app.use("/api/registrar/alumni", alumniRoutes);
  app.use("/api/registrar/compliance", complianceRoutes);
  app.use("/api/registrar/dashboard-stats", registrarDashboardRoutes);
  app.use("/api/vc", vcDashboardRoutes);
  app.use("/api/course/registration", studentCourseRoutes);
  app.use("/api/course/credit-overrides", creditOverrideRoutes);
  app.use("/api/course/lectures", lectureRoutes);
  app.use("/api/course/assignments", assignmentRoutes);
  app.use("/api/course/attendance", teacherAttendanceRoutes);

  // --- Exam Module Routing ---
  app.use("/api/exam/setup", examSetupRoutes);             
  app.use("/api/exam/management", examRoutes);             
  app.use("/api/exam/conduction", examConductionRoutes);  
  app.use("/api/exam/marks", marksRoutes);
app.use("/api/exam/post-exam", postExamRoutes);
app.use("/api/exam/hod-post-exam", hodPostExamRoutes);
app.use("/api/exam/hod-schedule", examHodRoutes);
app.use("/api/exam/teacher-marks", teacherMarksRoutes);
app.use("/api/exam/degree-audit", degreeAuditRoutes);
//LMS ROUTES

app.use("/api/lms/auth", lmsAuthRoutes);
app.use("/api/lms/finance", lmsFinanceRoutes);
app.use("/api/lms/courses", lmsCourseRoutes);
app.use("/api/lms/transcripts", lmsTranscriptRoutes);
app.use("/api/lms/dashboard", lmsDashboardRoutes);
app.use("/api/notifications", notificationRoutes);

//Viwer
app.use("/api/fee-analytics", feeAnalyticsRoutes);
app.use("/api/payment-records", paymentRecordRoutes);

//staff
app.use("/api/staff", staffroutes);
app.use("/api/staff/leaves", staffLeaveRoutes);
app.use("/api/staff/appraisals", staffAppraisalRoutes);
app.use("/api/staff/substitutions", classSubstitutionRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/public/teacher-onboarding", publicOnboardingRoutes);
app.use("/api/hr/attendance", hrAttendanceRoutes);
app.use("/api/attendance-device", attendanceDeviceRoutes);
app.use("/api/hr/payroll", hrPayrollRoutes);
app.use("/api/hr/appraisals", hrAppraisalRoutes);
app.use("/api/hr/recruitment", hrRecruitmentRoutes);
app.use("/api/hr/exits", hrExitRoutes);
app.use("/api/hr/inventory", hrInventoryRoutes);

app.use("/api/external-sync", collegeSyncRoutes);

app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/user-sessions", userSessionRoutes);
app.use("/api/account/revenue-explorer", revenueExplorerRoutes);

app.use(notFound);

// Error Handler - Must be last
app.use(errorHandler);

export default app;
