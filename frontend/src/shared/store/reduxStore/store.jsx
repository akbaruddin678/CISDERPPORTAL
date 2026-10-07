import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "../../../components/user/api/userApi";
import { admissionApi } from "../../../components/user-admission/api/admissionApi";
import { profileApi } from "../../../components/profile/api/profileApi";
import { adminApi } from "../../../Admin/SupperAdmin/api/adminApi";
import { useradminApi } from "../../../Admin/SupperAdmin/api/useradminApi";
import { hrApi } from "../../../Admin/HrDepartment/api/HrApi";
import { hrLeaveApi } from "../../../Admin/HrDepartment/api/hrLeaveApi";

import { catalogApi } from "../../../components/user-admission/api/catalogApi";
import { studentApi } from "../../../Admin/Admission/services/studentApi"
import { admissionTrashApi } from "../../../Admin/Admission/services/admissionTrashApi";
import { admissionListApi } from "../../../Admin/Admission/services/admissionListApi";
import { manualAdmissionApi } from "../../../Admin/Admission/services/manualAdmissionApi";
import { studentTrashApi } from "../../../Admin/Admission/services/studentTrashApi";

// Account Related
import {challanSettingsApi}  from "../../../Admin/accountant/api/challanSettingsApi";
import {depsemtermpro}  from "../../../Admin/accountant/api/depsemtermpro";

import { accountantstudentApi } from "../../../Admin/accountant/api/accountantstudentApi";

import {studentChallanApi} from "../../../Admin/accountant/api/studentChallanApi";
import { scholarshipApi } from "../../../Admin/accountant/api/scholarshipApi";
import { installmentApi } from "../../../Admin/accountant/api/installmentApi";
import { feeStructureApi } from './../../../Admin/accountant/api/feeStructureApi';
import { fineManagementApi } from "../../../Admin/accountant/api/fineManagementApi";
import {hostelApi} from "../../../Admin/accountant/api/hostelApi";
import { paymentRecordApi } from "../../../Admin/accountant/api/paymentRecordApi";
import { leftCasesApi } from "../../../Admin/accountant/api/leftCasesApi";

//student Challan Api
import { singlestudentChallanApi } from '../../../components/profile/api/singlestudentChallanApi'

// Trasport mangement
import { transportApi } from "../../../Admin/Transport/api/transportApi";

// Exam API
import {examApi}  from  "../../../Admin/Exam/api/examApi"
import {marksApi} from "../../../Admin/Exam/api/marksApi"
import { studentCourseApi } from "../../../Admin/Exam/api/studentCourseApi";
import {feeAnalyticsApi} from "../../../Admin/Dashboard/api/feeAnalyticsApi";

import { coursestudentRegistrationApi } from "../../../Admin/Exam/api/coursestudentAssignment";
import { courseAssignmentApi } from "../../../Admin/Exam/api/courseAssignmentApi";
import { courseRegistrationApi } from "../../../Admin/Exam/api/courseRegistrationApi";

import {globalCatalogApi}   from "../../../components/catalog/api/catalogApi"

import {hodCourseAllocationApi} from "../../../Admin/HeadofDepartment/api/hodCourseAllocationApi"
import { approveMarksApi } from "../../../Admin/HeadofDepartment/api/approveMarksApi";
import { approveAttendanceApi } from "../../../Admin/HeadofDepartment/api/approveAttendanceApi";
import { approveUFMApi } from "../../../Admin/HeadofDepartment/api/approveUFMApi";
import { approveRecheckingApi } from "../../../Admin/HeadofDepartment/api/approveRecheckingApi";
import { monitorFacultyApi } from "../../../Admin/HeadofDepartment/api/monitorFacultyApi";
import { departmentReportsApi } from "../../../Admin/HeadofDepartment/api/departmentReportsApi";
import { examCoordinationApi } from "../../../Admin/HeadofDepartment/api/examCoordinationApi";
import { hodDashboardApi } from "../../../Admin/HeadofDepartment/api/hodDashboardApi";
import { academiaApproveMarksApi } from "../../../Admin/HeadofAcademia/api/approveMarksApi";
import { vcApproveMarksApi } from "../../../Admin/VC/api/approveMarksApi";
import { vcDashboardApi } from "../../../Admin/VC/api/vcDashboardApi";
import { vcAdmissionsApi } from "../../../Admin/VC/api/vcAdmissionsApi";
import { examResultsRegisterApi } from "../../../Admin/Registrar/api/examResultsRegisterApi";
import { admissionCampaignApi } from "../../../Admin/Registrar/api/admissionCampaignApi";
import { admissionsRegisterApi } from "../../../Admin/Registrar/api/admissionsRegisterApi";
import { registrarStudentApi } from "../../../Admin/Registrar/api/registrarStudentApi";
import { courseWithdrawalApi } from "../../../Admin/HeadofDepartment/api/courseWithdrawalApi";
import { hodStudentApi } from "../../../Admin/HeadofDepartment/api/hodStudentApi";
import { graduationApi } from "../../../Admin/Graduation/api/graduationApi";
import { degreeAuditApi } from "../../../Admin/Exam/api/degreeAuditApi";
import { programRegulationApi } from "../../../Admin/HeadofAcademia/api/programRegulationApi";
import { studentCardApi } from "../../../Admin/Admission/services/studentCardApi";
import { hodLeaveApi } from "../../../Admin/HeadofDepartment/api/hodLeaveApi";
import { kioskApi } from "../../../Kiosk/api/kioskApi";
import { publicOnboardingApi } from "../../../PublicOnboarding/api/publicOnboardingApi";
import { courseWithdrawalRegisterApi } from "../../../Admin/Registrar/api/courseWithdrawalRegisterApi";
import { disciplinaryFilesApi } from "../../../Admin/Registrar/api/disciplinaryFilesApi";
import { masterTimetableApi } from "../../../Admin/Registrar/api/masterTimetableApi";
import { roomApi } from "../../../Admin/Registrar/api/roomApi";
import { alumniRecordsApi } from "../../../Admin/Registrar/api/alumniRecordsApi";
import { complianceReportingApi } from "../../../Admin/Registrar/api/complianceReportingApi";
import { registrarDashboardApi } from "../../../Admin/Registrar/api/registrarDashboardApi";

import { teacherClassesApi } from "../../../Admin/teacher/api/teacherClassesApi";
import { lecturesApi } from "../../../Admin/teacher/lectures/api/lecturesApi";
import { assignmentsApi } from "../../../Admin/teacher/assignments/api/assignmentsApi";
import { attendanceApi } from "../../../Admin/teacher/attendance/api/attendanceApi";
import { teacherMarksApi } from "../../../Admin/teacher/marks/api/teacherMarksApi";
import { leaveApi } from "../../../Admin/teacher/leaves/api/leaveApi";
import { substitutionApi } from "../../../Admin/teacher/substitutions/api/substitutionApi";
import { appraisalSelfApi } from "../../../Admin/teacher/appraisals/api/appraisalSelfApi";
import { appraisalReviewApi } from "../../../Admin/HeadofDepartment/api/appraisalReviewApi";

import { activityLogApi } from "../../../Admin/ActivityLog/api/activityLogApi";
import { activeSessionsApi } from "../../../Admin/ActiveSessions/api/activeSessionsApi";
import { revenueExplorerApi } from "../../../Admin/accountant/api/revenueExplorerApi";

export const store = configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [admissionApi.reducerPath]: admissionApi.reducer,
    [catalogApi.reducerPath]: catalogApi.reducer,
    [hrApi.reducerPath]: hrApi.reducer,
    [hrLeaveApi.reducerPath]: hrLeaveApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [studentApi.reducerPath]: studentApi.reducer,
    [admissionTrashApi.reducerPath]: admissionTrashApi.reducer,
    [admissionListApi.reducerPath]: admissionListApi.reducer,
    [manualAdmissionApi.reducerPath]: manualAdmissionApi.reducer,
    [studentTrashApi.reducerPath]: studentTrashApi.reducer,
    [challanSettingsApi.reducerPath]: challanSettingsApi.reducer,
    [depsemtermpro.reducerPath]: depsemtermpro.reducer,
    [accountantstudentApi.reducerPath]: accountantstudentApi.reducer,
    [studentChallanApi.reducerPath]: studentChallanApi.reducer,
    [scholarshipApi.reducerPath]: scholarshipApi.reducer,
    [installmentApi.reducerPath]: installmentApi.reducer,
    [feeStructureApi.reducerPath]: feeStructureApi.reducer,
    [fineManagementApi.reducerPath]: fineManagementApi.reducer,
    [useradminApi.reducerPath]: useradminApi.reducer,
    [singlestudentChallanApi.reducerPath]: singlestudentChallanApi.reducer,
    [hostelApi.reducerPath]: hostelApi.reducer,
    [transportApi.reducerPath]: transportApi.reducer,
    [examApi.reducerPath]: examApi.reducer,
    [marksApi.reducerPath]: marksApi.reducer,
    [studentCourseApi.reducerPath]: studentCourseApi.reducer,
    [feeAnalyticsApi.reducerPath]: feeAnalyticsApi.reducer,
    [paymentRecordApi.reducerPath]: paymentRecordApi.reducer,
    [coursestudentRegistrationApi.reducerPath]:
      coursestudentRegistrationApi.reducer,
    [courseAssignmentApi.reducerPath]: courseAssignmentApi.reducer,
    [courseRegistrationApi.reducerPath]: courseRegistrationApi.reducer,
    [leftCasesApi.reducerPath]: leftCasesApi.reducer,
    [globalCatalogApi.reducerPath]: globalCatalogApi.reducer,
    [hodCourseAllocationApi.reducerPath]: hodCourseAllocationApi.reducer,
    [approveMarksApi.reducerPath]: approveMarksApi.reducer,
    [approveAttendanceApi.reducerPath]: approveAttendanceApi.reducer,
    [approveUFMApi.reducerPath]: approveUFMApi.reducer,
    [approveRecheckingApi.reducerPath]: approveRecheckingApi.reducer,
    [monitorFacultyApi.reducerPath]: monitorFacultyApi.reducer,
    [departmentReportsApi.reducerPath]: departmentReportsApi.reducer,
    [examCoordinationApi.reducerPath]: examCoordinationApi.reducer,
    [hodDashboardApi.reducerPath]: hodDashboardApi.reducer,
    [academiaApproveMarksApi.reducerPath]: academiaApproveMarksApi.reducer,
    [vcApproveMarksApi.reducerPath]: vcApproveMarksApi.reducer,
    [vcDashboardApi.reducerPath]: vcDashboardApi.reducer,
    [vcAdmissionsApi.reducerPath]: vcAdmissionsApi.reducer,
    [examResultsRegisterApi.reducerPath]: examResultsRegisterApi.reducer,
    [admissionCampaignApi.reducerPath]: admissionCampaignApi.reducer,
    [admissionsRegisterApi.reducerPath]: admissionsRegisterApi.reducer,
    [registrarStudentApi.reducerPath]: registrarStudentApi.reducer,
    [courseWithdrawalApi.reducerPath]: courseWithdrawalApi.reducer,
    [hodStudentApi.reducerPath]: hodStudentApi.reducer,
    [graduationApi.reducerPath]: graduationApi.reducer,
    [degreeAuditApi.reducerPath]: degreeAuditApi.reducer,
    [programRegulationApi.reducerPath]: programRegulationApi.reducer,
    [studentCardApi.reducerPath]: studentCardApi.reducer,
    [hodLeaveApi.reducerPath]: hodLeaveApi.reducer,
    [kioskApi.reducerPath]: kioskApi.reducer,
    [publicOnboardingApi.reducerPath]: publicOnboardingApi.reducer,
    [courseWithdrawalRegisterApi.reducerPath]: courseWithdrawalRegisterApi.reducer,
    [disciplinaryFilesApi.reducerPath]: disciplinaryFilesApi.reducer,
    [masterTimetableApi.reducerPath]: masterTimetableApi.reducer,
    [roomApi.reducerPath]: roomApi.reducer,
    [alumniRecordsApi.reducerPath]: alumniRecordsApi.reducer,
    [complianceReportingApi.reducerPath]: complianceReportingApi.reducer,
    [registrarDashboardApi.reducerPath]: registrarDashboardApi.reducer,
    [teacherClassesApi.reducerPath]: teacherClassesApi.reducer,
    [lecturesApi.reducerPath]: lecturesApi.reducer,
    [assignmentsApi.reducerPath]: assignmentsApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [teacherMarksApi.reducerPath]: teacherMarksApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [substitutionApi.reducerPath]: substitutionApi.reducer,
    [appraisalSelfApi.reducerPath]: appraisalSelfApi.reducer,
    [appraisalReviewApi.reducerPath]: appraisalReviewApi.reducer,
    [activityLogApi.reducerPath]: activityLogApi.reducer,
    [activeSessionsApi.reducerPath]: activeSessionsApi.reducer,
    [revenueExplorerApi.reducerPath]: revenueExplorerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userApi.middleware,
      admissionApi.middleware,
      adminApi.middleware,
      profileApi.middleware,
      hrApi.middleware,
      hrLeaveApi.middleware,
      catalogApi.middleware,
      studentApi.middleware,
      admissionTrashApi.middleware,
      admissionListApi.middleware,
      manualAdmissionApi.middleware,
      studentTrashApi.middleware,
      challanSettingsApi.middleware,
      depsemtermpro.middleware,
      accountantstudentApi.middleware,
      studentChallanApi.middleware,
      scholarshipApi.middleware,
      installmentApi.middleware,
      feeStructureApi.middleware,
      fineManagementApi.middleware,
      useradminApi.middleware,
      singlestudentChallanApi.middleware,
      hostelApi.middleware,
      transportApi.middleware,
      examApi.middleware,
      marksApi.middleware,
      studentCourseApi.middleware,
      feeAnalyticsApi.middleware,
      paymentRecordApi.middleware,
      coursestudentRegistrationApi.middleware,
      courseAssignmentApi.middleware,
      courseRegistrationApi.middleware,
      leftCasesApi.middleware,
      globalCatalogApi.middleware,
      hodCourseAllocationApi.middleware,
      approveMarksApi.middleware,
      approveAttendanceApi.middleware,
      approveUFMApi.middleware,
      approveRecheckingApi.middleware,
      monitorFacultyApi.middleware,
      departmentReportsApi.middleware,
      examCoordinationApi.middleware,
      hodDashboardApi.middleware,
      academiaApproveMarksApi.middleware,
      vcApproveMarksApi.middleware,
      vcDashboardApi.middleware,
      vcAdmissionsApi.middleware,
      examResultsRegisterApi.middleware,
      admissionCampaignApi.middleware,
      admissionsRegisterApi.middleware,
      registrarStudentApi.middleware,
      courseWithdrawalApi.middleware,
      hodStudentApi.middleware,
      graduationApi.middleware,
      degreeAuditApi.middleware,
      programRegulationApi.middleware,
      studentCardApi.middleware,
      hodLeaveApi.middleware,
      kioskApi.middleware,
      publicOnboardingApi.middleware,
      courseWithdrawalRegisterApi.middleware,
      disciplinaryFilesApi.middleware,
      masterTimetableApi.middleware,
      roomApi.middleware,
      alumniRecordsApi.middleware,
      complianceReportingApi.middleware,
      registrarDashboardApi.middleware,
      teacherClassesApi.middleware,
      lecturesApi.middleware,
      assignmentsApi.middleware,
      attendanceApi.middleware,
      teacherMarksApi.middleware,
      leaveApi.middleware,
      substitutionApi.middleware,
      appraisalSelfApi.middleware,
      appraisalReviewApi.middleware,
      activityLogApi.middleware,
      activeSessionsApi.middleware,
      revenueExplorerApi.middleware,
    ),
});
