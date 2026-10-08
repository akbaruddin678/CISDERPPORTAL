import { Dashboard } from "@mui/icons-material";
import { lazy } from "react";

// The 6 Main Admin Domain Containers
const UserManagementContainer = lazy(
  () => import("../container/UserManagementContainer"),
);
const AcademicStructureContainer = lazy(
  () => import("../container/AcademicStructureContainer"),
);
const SessionManagementContainer = lazy(
  () => import("../container/SessionManagementContainer"),
);
const CourseCatalogContainer = lazy(
  () => import("../container/CourseCatalogContainer"),
);
const LmsManagementContainer = lazy(
  () => import("../container/LmsManagementContainer"),
);
const ActivityLogContainer = lazy(
  () => import("../../ActivityLog/container/ActivityLogContainer"),
);
const NotificationManagementPage = lazy(
  () => import("../../Notifications/NotificationManagementPage"),
);
const StudentTrashContainer = lazy(
  () => import("../../StudentTrash/container/StudentTrashContainer"),
);
const ActiveSessionsContainer = lazy(
  () => import("../../ActiveSessions/container/ActiveSessionsContainer"),
);
const SchoolManagementView = lazy(
  () => import("../view/SchoolManagementView"),
);

// Admission
const AdmissionOffice = lazy(
  () => import("../../Admission/container/AdmssionMainContainer"),
);
const AdmissionDashboard = lazy(() => import("../../Admission/view/Dashboard"));
const AdmissionManagement = lazy(
  () => import("../../Admission/container/StudentManagementContainer"),
);
const AdmissionListView = lazy(
  () => import("../../Admission/view/AdmissionListView"),
);
const NewAdmissionsContainer = lazy(
  () => import("../../Admission/container/NewAdmissionsContainer"),
);
const ManualAdmissionContainer = lazy(
  () => import("../../Admission/container/ManualAdmissionContainer"),
);
const AdmissionDetailContianer = lazy(
  () => import("../../Admission/container/AdmissionDetailContianer"),
);
const StudentDetailContianer = lazy(
  () => import("../../Admission/container/StudentDetailsContainer"),
);
const StudentPromotionContainer = lazy(
  () => import("../../Admission/container/StudentPromotionContainer"),
);

// Accountant
const ChallanSettingsContainer = lazy(
  () => import("../../accountant/container/ChallanSettingsContainer"),
);
const StudentChallanManagementContainer = lazy(
  () => import("../../accountant/container/StudentChallanManagementContainer"),
);



const ScholarshipPlan = lazy(
  () => import("../../accountant/container/ScholarshipPlanContainer"),
);
const ChallanGenerationContainer = lazy(
  () => import("../../accountant/container/ChallanGenerationContainer"),
);
const RevenueExplorerContainer = lazy(
  () => import("../../accountant/container/RevenueExplorerContainer"),
);
const ReportGenerationContainer = lazy(
  () => import("../../accountant/container/ReportGenerationContainer"),
);
const DepartmentChallan = lazy(
  () => import("../../accountant/container/DepartmentChallanContainer"),
);
const PaymentRecord = lazy(
  () => import("../../accountant/container/PaymentRecord"),
);
const StudentFeeManagement = lazy(
  () => import("../../accountant/container/StudentFeeManagementContainer"),
);
const InstallmentManagement = lazy(
  () => import("../../accountant/container/InstallmentmanagementContainer"),
);
const MonthlyChallanReportContainer = lazy(
  () => import("../../accountant/container/MonthlyChallanReportContainer"),
);
const StudentReportContainer = lazy(
  () => import("../../accountant/container/StudentReportContainer"),
);
const FineDueDateManagement = lazy(
  () => import("../../accountant/container/FineDueDateManagement"),
);
const LateFineSettings = lazy(
  () => import("../../accountant/container/LateFineSettingsContainer"),
);
const LeftCaseContainer = lazy(
  () => import("../../accountant/container/LeftCasesContainer"),
);

// --- Core Exam Routes ---
const ExamDashboardContainer = lazy(
  () => import("../../Exam/container/ExamDashboardContainer"),
);
const CourseAssignmentContainer = lazy(
  () => import("../../Exam/container/CourseAssignmentContainer"),
);
const StudentRegistrationContainer = lazy(
  () => import("../../Exam/container/CourseRegistrationContainer"),
);
const CreateExamContainer = lazy(
  () => import("../../Exam/container/CreateExamContainer"),
);
const MarkUploadContainer = lazy(
  () => import("../../Exam/container/MarkUploadContainer"),
);
const ExamAttendanceContainer = lazy(
  () => import("../../Exam/container/ExamAttendanceContainer"),
);
const DateSheetContainer = lazy(
  () => import("../../Exam/container/DateSheetContainer"),
);
const ExamTimetableContainer = lazy(
  () => import("../../Exam/container/ExamTimetableContainer"),
);
const ExamResultContainer = lazy(
  () => import("../../Exam/container/ExamResultContainer"),
);
const StudentAcademicHistoryContainer = lazy(
  () => import("../../Exam/container/StudentAcademicHistoryContainer"),
);
// Same Student Promotion feature the Admission office uses (bulk
// promote/demote by batch, fee-defaulter check, accountant override
// request) — reused as-is under the Exam module's own route so it behaves
// identically rather than being reimplemented and risking drift.
const ExamStudentPromotionContainer = lazy(
  () => import("../../Exam/container/ExamStudentPromotionContainer"),
);
const AdmitCardContainer = lazy(
  () => import("../../Exam/container/AdmitCardContainer"),
);
const DegreeAuditContainer = lazy(
  () => import("../../Exam/container/DegreeAuditContainer"),
);
const ReEvaluationContainer = lazy(
  () => import("../../Exam/container/ReEvaluationContainer"),
);
const UFMContainer = lazy(() => import("../../Exam/container/UFMContainer"));
const CertificationContainer = lazy(
  () => import("../../Exam/container/CertificationContainer"),
);

// HOD & Departments
const ApproveAttendance = lazy(
  () => import("../../HeadofDepartment/container/ApproveAttendance"),
);
const ApproveMarks = lazy(
  () => import("../../HeadofDepartment/container/ApproveMarks"),
);
const ApproveUFM = lazy(
  () => import("../../HeadofDepartment/container/ApproveUFM"),
);
const ApproveAppeals = lazy(
  () => import("../../HeadofDepartment/container/ApproveAppeals"),
);
const MonitorCourses = lazy(
  () => import("../../HeadofDepartment/container/MonitorCourses"),
);
const DepartmentReports = lazy(
  () => import("../../HeadofDepartment/container/DepartmentReports"),
);
const ExamCoordination = lazy(
  () => import("../../HeadofDepartment/container/ExamCoordination"),
);
const HODCourseManagementContainer = lazy(
  () => import("../../HeadofDepartment/container/CourseManagementContainer"),
);
const HodTimetableContainer = lazy(
  () => import("../../HeadofDepartment/container/HodTimetableContainer"),
);
const HODCourseAllocationContainer = lazy(
  () => import("../../HeadofDepartment/container/HodCourseAllocationContainer"),
);
const HODAssignCourseContainer = lazy(
  () => import("../../HeadofDepartment/container/HodAssignCourseContainer"),
);
const HODCourseWithdrawalsContainer = lazy(
  () => import("../../HeadofDepartment/container/CourseWithdrawalsContainer"),
);
const StudentCardContainer = lazy(
  () => import("../../Admission/container/StudentCardContainer"),
);
const HodStudents = lazy(
  () => import("../../HeadofDepartment/container/HodStudentsContainer"),
);
const HodLeaves = lazy(
  () => import("../../HeadofDepartment/container/HodLeavesContainer"),
);
const HodAppraisalReview = lazy(
  () => import("../../HeadofDepartment/container/AppraisalReviewContainer"),
);

const MyDepartment = lazy(
  () => import("../../Departsments/container/MyDepartment"),
);
const DepartmentTeachers = lazy(
  () => import("../../Departsments/container/DepartmentTeachersContainer"),
);
const DepartmentStudents = lazy(
  () => import("../../Departsments/container/DepartmentStudentsContainer"),
);
const DepartmentCourses = lazy(
  () => import("../../Departsments/container/DepartmentCoursesContainer"),
);
const DepartmentSubjects = lazy(
  () => import("../../Departsments/container/DepartmentSubjectsContainer"),
);
const DepartmentExams = lazy(
  () => import("../../Departsments/container/DepartmentExamsContainer"),
);
const DepartmentCoordinators = lazy(
  () => import("../../Departsments/container/DepartmentCoordinatorsContainer"),
);

// TEACHER MODULE CONTAINERS
const TeacherClasses = lazy(
  () => import("../../teacher/container/TeacherClassesContainer"),
);
const LectureEditor = lazy(
  () => import("../../teacher/lectures/container/LectureEditorContainer"),
);
const AssignmentEditor = lazy(
  () => import("../../teacher/assignments/container/AssignmentEditorContainer"),
);
const TeacherAssignments = lazy(
  () => import("../../teacher/assignments/container/TeacherAssignmentsContainer"),
);
const TeacherProfile = lazy(
  () => import("../../teacher/profile/container/TeacherProfileContainer"),
);
const TeacherSchedule = lazy(
  () => import("../../teacher/schedule/container/TeacherScheduleContainer"),
);
const TeacherAttendance = lazy(
  () => import("../../teacher/container/TeacherAttendanceContainer"),
);
const TeacherMarks = lazy(
  () => import("../../teacher/container/TeacherMarksContainer"),
);
const TeacherLeaves = lazy(
  () => import("../../teacher/container/TeacherLeavesContainer"),
);
const TeacherAppraisals = lazy(
  () => import("../../teacher/container/TeacherAppraisalsContainer"),
);
const TeacherSubstitutions = lazy(
  () => import("../../teacher/container/TeacherSubstitutionsContainer"),
);

// ==========================================
// ✅ HR DEPARTMENT CONTAINERS
// ==========================================
const HrEmployees = lazy(
  () => import("../../HrDepartment/container/HrEmployeesContainer"),
);
const HrEmployeeProfile = lazy(
  () => import("../../HrDepartment/container/HrEmployeeProfileContainer"),
);
const HrOnboard = lazy(
  () => import("../../HrDepartment/container/HrOnboardContainer"),
);
const HrOnboardingRequests = lazy(
  () => import("../../HrDepartment/container/OnboardingRequestsContainer"),
);
const HrAttendance = lazy(
  () => import("../../HrDepartment/container/HrAttendanceContainer"),
);
const HrLeaves = lazy(
  () => import("../../HrDepartment/container/HrLeavesContainer"),
);
const HrPayroll = lazy(
  () => import("../../HrDepartment/container/HrPayrollContainer"),
);
const HrAppraisals = lazy(
  () => import("../../HrDepartment/container/HrAppraisalsContainer"),
);
const HrRecruitment = lazy(
  () => import("../../HrDepartment/container/HrRecruitmentContainer"),
);
const HrExits = lazy(
  () => import("../../HrDepartment/container/HrExitsContainer"),
);
const HrAlumniPortal = lazy(
  () => import("../../HrDepartment/container/AlumniPortalContainer"),
);
const HrInventoryDashboard = lazy(
  () => import("../../HrDepartment/container/InventoryDashboardContainer"),
);
const HrInventoryRooms = lazy(
  () => import("../../HrDepartment/container/InventoryRoomsContainer"),
);
const HrInventoryFurniture = lazy(
  () => import("../../HrDepartment/container/InventoryFurnitureContainer"),
);
const HrInventoryStationery = lazy(
  () => import("../../HrDepartment/container/InventoryStationeryContainer"),
);
const HrInventoryEquipment = lazy(
  () => import("../../HrDepartment/container/InventoryEquipmentContainer"),
);
const HrInventoryAssignments = lazy(
  () => import("../../HrDepartment/container/InventoryAssignmentsContainer"),
);

// Transport Department
const TransportRegistratonContainer = lazy(
  () => import("../../Transport/container/TransportRegistratonContainer"),
);

// ==========================================
// ✅ HEAD OF ACADEMIA CONTAINERS (Fixed Casing)
// ==========================================
const HeadOfAcademiaMainContainer = lazy(
  () => import("../../HeadofAcademia/container/HeadOfAcademiaMainContainer"),
);
const AcademiaCourseManagementContainer = lazy(
  () =>
    import("../../HeadofAcademia/container/AcademiaCourseManagementContainer"),
);
const AcademiaApproveMarksContainer = lazy(
  () =>
    import("../../HeadofAcademia/container/AcademiaApproveMarksContainer"),
);
const ProgramRegulationContainer = lazy(
  () => import("../../HeadofAcademia/container/ProgramRegulationContainer"),
);

// ==========================================
// ✅ REGISTRAR DEPARTMENT CONTAINERS
// ==========================================
const RegistrarMainContainer = lazy(
  () => import("../../Registrar/container/RegistrarMainContainer"),
);
const AdmissionCampaignsContainer = lazy(
  () => import("../../Registrar/container/AdmissionCampaignsContainer"),
);
const MeritListsContainer = lazy(
  () => import("../../Registrar/container/MeritListsContainer"),
);
const StudentDirectoryContainer = lazy(
  () => import("../../Registrar/container/StudentDirectoryContainer"),
);
const CourseWithdrawalsContainer = lazy(
  () => import("../../Registrar/container/CourseWithdrawalsContainer"),
);
const DisciplinaryFilesContainer = lazy(
  () => import("../../Registrar/container/DisciplinaryFilesContainer"),
);
const MasterTimetableContainer = lazy(
  () => import("../../Registrar/container/MasterTimetableContainer"),
);
const ManageRoomsContainer = lazy(
  () => import("../../Registrar/container/ManageRoomsContainer"),
);
const RegistrarGraduationPage = lazy(() =>
  import("../../Registrar/container/RegistrarGraduationClearanceContainer"),
);
const HodGraduationPage = lazy(() =>
  import("../../Graduation/container/GraduationPages").then((m) => ({ default: m.HodGraduationPage })),
);
const ExamGraduationPage = lazy(() => import("../../Exam/container/ExamGraduationClearanceContainer"));
const FinanceGraduationPage = lazy(() =>
  import("../../Graduation/container/GraduationPages").then((m) => ({ default: m.FinanceGraduationPage })),
);
const ClearanceDeskPage = lazy(() =>
  import("../../Graduation/container/GraduationPages").then((m) => ({ default: m.ClearanceDeskPage })),
);
const ClearanceOfficesPage = lazy(() =>
  import("../../Graduation/container/GraduationPages").then((m) => ({ default: m.ClearanceOfficesPage })),
);
const ExamResultsRegisterContainer = lazy(
  () => import("../../Registrar/container/ExamResultsRegisterContainer"),
);
const AlumniRecordsContainer = lazy(
  () => import("../../Registrar/container/AlumniRecordsContainer"),
);
const ComplianceReportingContainer = lazy(
  () => import("../../Registrar/container/ComplianceReportingContainer"),
);

const RegisterCourseManagement = lazy(
  () => import("../../Registrar/container/CourseManagementContainer"),
);

// ==========================================
// ✅ VC ROUTES
// ==========================================
const VcMainContainer = lazy(
  () => import("../../VC/container/VcMainContainer"),
);
const VcDashboardContainer = lazy(
  () => import("../../VC/container/VcDashboardContainer"),
);
const VcCourseManagementContainer = lazy(
  () => import("../../VC/container/VcCourseManagementContainer"),
);
const VcApproveMarksContainer = lazy(
  () => import("../../VC/container/VcApproveMarksContainer"),
);
const VcAccreditationsContainer = lazy(
  () => import("../../VC/container/VcAccreditationsContainer"),
);
const VcAdmissionsContainer = lazy(
  () => import("../../VC/container/VcAdmissionsContainer"),
);
const VcAccountsContainer = lazy(
  () => import("../../VC/container/VcAccountsContainer"),
);

// Main Page Routes
const Program = lazy(() => import("../../../components/LandingPage/Programs"));
const Admission = lazy(
  () => import("../../../components/LandingPage/Admissions"),
);
const About = lazy(() => import("../../../components/LandingPage/About"));
const CampusLife = lazy(
  () => import("../../../components/LandingPage/CampusLife"),
);

const getAdminRoutes = () => {
  return [
    // --- Accountant Routes ---
    {
      path: "/challan-settings",
      element: ChallanSettingsContainer,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/student-fee-management",
      element: StudentFeeManagement,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },

    {
      path: "/student-installment-management",
      element: InstallmentManagement,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/student-challan-management",
      element: StudentChallanManagementContainer,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/scholarship-plans-management",
      element: ScholarshipPlan,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/generate-challan-list",
      element: ChallanGenerationContainer,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/revenue-explorer",
      element: RevenueExplorerContainer,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount", "admin"],
    },
    {
      path: "/challan-reports",
      element: ReportGenerationContainer,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/department-challans",
      element: DepartmentChallan,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/monthly-challan-reports",
      element: MonthlyChallanReportContainer,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/late-fine-settings",
      element: LateFineSettings,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/fine-managements",
      element: FineDueDateManagement,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/student-dossier",
      element: StudentReportContainer,
      isProtected: true,
      requiredRoles: ["accountant", "admin", "headofaccount"],
    },
    {
      path: "/payments-records",
      element: PaymentRecord,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },
    {
      path: "/left-caseses",
      element: LeftCaseContainer,
      isProtected: true,
      requiredRoles: ["accountant", "headofaccount"],
    },

    // --- Admin Domain Routes ---
    {
      path: "/admin/users",
      element: UserManagementContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/schools",
      element: SchoolManagementView,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/academics",
      element: AcademicStructureContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/sessions",
      element: SessionManagementContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/courses",
      element: CourseCatalogContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/lms",
      element: LmsManagementContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/activity-logs",
      element: ActivityLogContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/active-sessions",
      element: ActiveSessionsContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/admin/student-trash",
      element: StudentTrashContainer,
      isProtected: true,
      requiredRoles: ["admin"],
    },

    // --- Admission Routes ---
    {
      path: "/students/:studentId",
      element: StudentDetailContianer,
      isProtected: true,
      requiredRoles: ["HR", "admission"],
    },
    {
      path: "/admission-office",
      element: AdmissionOffice,
      isProtected: true,
      requiredRoles: ["admission"],
    },
    {
      path: "/admission-office/dashboard",
      element: AdmissionDashboard,
      isProtected: true,
      requiredRoles: ["admission"],
    },
    {
      path: "/admission-office/admission-management",
      element: AdmissionManagement,
      isProtected: true,
      requiredRoles: ["admission"],
    },
    {
      path: "/admission-office/admission-list",
      element: AdmissionListView,
      isProtected: true,
      requiredRoles: ["admission"],
    },
    {
      path: "/admission-office/new-admissions",
      element: NewAdmissionsContainer,
      isProtected: true,
      requiredRoles: ["admission"],
    },
    {
      path: "/admission-office/manual-admission",
      element: ManualAdmissionContainer,
      isProtected: true,
      requiredRoles: ["admission"],
    },
    {
      path: "/admission-office/student-cards",
      element: StudentCardContainer,
      isProtected: true,
      requiredRoles: ["admission", "admin"],
    },
    {
      path: "/admission-office/student-promotion",
      element: StudentPromotionContainer,
      isProtected: true,
      requiredRoles: ["admission"],
    },
    {
      path: "/admission-office/admission-detail/:admissionId",
      element: AdmissionDetailContianer,
      isProtected: true,
      requiredRoles: ["accountant", "admission"],
    },

    // --- Transport Routes ---
    {
      path: "/transport/registration",
      element: TransportRegistratonContainer,
      isProtected: true,
      requiredRoles: ["transport"],
    },

    // ==========================================
    // ✅ REGISTRAR ROUTES
    // ==========================================
    {
      path: "/registrar/dashboard",
      element: RegistrarMainContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/admissions/campaigns",
      element: AdmissionCampaignsContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/admissions/merit-lists",
      element: MeritListsContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/students/directory",
      element: StudentDirectoryContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/students/withdrawals",
      element: CourseWithdrawalsContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/students/disciplinary",
      element: DisciplinaryFilesContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/timetable/master",
      element: MasterTimetableContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/timetable/rooms",
      element: ManageRoomsContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/graduation/clearances",
      element: RegistrarGraduationPage,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/results/register",
      element: ExamResultsRegisterContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/alumni",
      element: AlumniRecordsContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/reports/compliance",
      element: ComplianceReportingContainer,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },
    {
      path: "/registrar/course/managements",
      element: RegisterCourseManagement,
      isProtected: true,
      requiredRoles: ["registrar", "admin"],
    },

    // --- Exam Routes ---
    {
      path: "/communications/notifications",
      element: NotificationManagementPage,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "registrar", "hr"],
    },
    {
      path: "/exam/dashboard",
      element: ExamDashboardContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      // "Course Assignment": assign courses to semesters + manage the
      // Course Roster (assigned/unassigned + enroll students single/bulk).
      path: "/exam/course-assignment",
      element: CourseAssignmentContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/student/registration",
      element: CourseAssignmentContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
   
      path: "/exam/course-catalog",
      element: StudentRegistrationContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/create",
      element: CreateExamContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/schedule",
      element: DateSheetContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/timetable",
      element: ExamTimetableContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/admit-cards",
      element: AdmitCardContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/marks-upload",
      element: MarkUploadContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/attendance",
      element: ExamAttendanceContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/results",
      element: ExamResultContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/appeals",
      element: ReEvaluationContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/ufm",
      element: UFMContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/certification",
      element: CertificationContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/student/history",
      element: StudentAcademicHistoryContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },
    {
      path: "/exam/student/promotion",
      element: ExamStudentPromotionContainer,
      isProtected: true,
      requiredRoles: ["manager", "admin"],
    },

    // --- Academia Routes ---
    {
      path: "/academia/dashboard",
      element: HeadOfAcademiaMainContainer,
      isProtected: true,
      requiredRoles: ["head_of_academia", "admin"],
    },
    {
      path: "/academia/course-review",
      element: AcademiaCourseManagementContainer,
      isProtected: true,
      requiredRoles: ["head_of_academia", "admin"],
    },
    {
      path: "/academia/approve-marks",
      element: AcademiaApproveMarksContainer,
      isProtected: true,
      requiredRoles: ["head_of_academia", "admin"],
    },
    {
      path: "/academia/program-regulations",
      element: ProgramRegulationContainer,
      isProtected: true,
      requiredRoles: ["head_of_academia", "admin", "registrar", "vc", "vice_vc"],
    },

    // --- HOD Routes ---
    {
      path: "/hod/approve-attendance",
      element: ApproveAttendance,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/approve-marks",
      element: ApproveMarks,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/approve-ufm",
      element: ApproveUFM,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/approve-appeals",
      element: ApproveAppeals,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/monitor-courses",
      element: MonitorCourses,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/reports",
      element: DepartmentReports,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/exam-coordination",
      element: ExamCoordination,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/course/management",
      element: HODCourseManagementContainer,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/timetable",
      element: HodTimetableContainer,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/course/allocation",
      element: HODCourseAllocationContainer,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/course/allocation/assign/:departmentId/:programId/:semesterId/:termId",
      element: HODAssignCourseContainer,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/course/withdrawals",
      element: HODCourseWithdrawalsContainer,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/students",
      element: HodStudents,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/graduation",
      element: HodGraduationPage,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/exam/degree-audit",
      element: DegreeAuditContainer,
      isProtected: true,
      requiredRoles: ["manager", "exam", "admin"],
    },
    {
      path: "/exam/graduation-clearance",
      element: ExamGraduationPage,
      isProtected: true,
      requiredRoles: ["manager", "exam", "admin"],
    },
    {
      path: "/graduation-clearance",
      element: FinanceGraduationPage,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/clearance-desk",
      element: ClearanceDeskPage,
      isProtected: true,
      requiredRoles: ["library", "transport", "hostel", "it_labs", "clearance_officer", "admin"],
    },
    {
      path: "/admin/clearance-offices",
      element: ClearanceOfficesPage,
      isProtected: true,
      requiredRoles: ["admin"],
    },
    {
      path: "/hod/leaves",
      element: HodLeaves,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },
    {
      path: "/hod/appraisals",
      element: HodAppraisalReview,
      isProtected: true,
      requiredRoles: ["hod", "admin"],
    },

    // --- Department Routes ---
    {
      path: "/departments/mydepartments",
      element: MyDepartment,
      isProtected: true,
      requiredRoles: ["department", "admin"],
    },
    {
      path: "/departments/teachers",
      element: DepartmentTeachers,
      isProtected: true,
      requiredRoles: ["department", "admin"],
    },
    {
      path: "/departments/students",
      element: DepartmentStudents,
      isProtected: true,
      requiredRoles: ["department", "admin"],
    },
    {
      path: "/departments/courses",
      element: DepartmentCourses,
      isProtected: true,
      requiredRoles: ["department", "admin"],
    },
    {
      path: "/departments/subjects",
      element: DepartmentSubjects,
      isProtected: true,
      requiredRoles: ["department", "admin"],
    },
    {
      path: "/departments/exams",
      element: DepartmentExams,
      isProtected: true,
      requiredRoles: ["department", "admin"],
    },
    {
      path: "/departments/coordinators",
      element: DepartmentCoordinators,
      isProtected: true,
      requiredRoles: ["department", "admin"],
    },

    // --- Teacher Routes ---
    {
      path: "/teacher/classes",
      element: TeacherClasses,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      // lectureId is either a real Mongo id (view/edit) or the literal
      // string "new" (create) — courseId is passed via ?courseId= when new.
      path: "/teacher/lectures/:lectureId",
      element: LectureEditor,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      // Standalone entry point (from the main dashboard link) — shows a
      // course picker, then the assignment list for the chosen course.
      path: "/teacher/assignments",
      element: TeacherAssignments,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      path: "/teacher/profile",
      element: TeacherProfile,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      path: "/teacher/schedule",
      element: TeacherSchedule,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      // assignmentId is either a real Mongo id (view/edit) or the literal
      // string "new" (create) — courseId is passed via ?courseId= when new.
      path: "/teacher/assignments/:assignmentId",
      element: AssignmentEditor,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      path: "/teacher/attendance",
      element: TeacherAttendance,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      path: "/teacher/marks",
      element: TeacherMarks,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      path: "/teacher/leaves",
      element: TeacherLeaves,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      path: "/teacher/appraisals",
      element: TeacherAppraisals,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },
    {
      path: "/teacher/substitutions",
      element: TeacherSubstitutions,
      isProtected: true,
      requiredRoles: ["teacher", "admin"],
    },

    // ==========================================
    // ✅ HR DEPARTMENT ROUTES
    // ==========================================
    {
      path: "/hr/employees",
      element: HrEmployees,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/employees/role/:moduleKey",
      element: HrEmployees,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/employee/:staffId",
      element: HrEmployeeProfile,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/onboard",
      element: HrOnboard,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/onboarding-requests",
      element: HrOnboardingRequests,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/attendance",
      element: HrAttendance,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/leaves",
      element: HrLeaves,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/payroll",
      element: HrPayroll,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/appraisals",
      element: HrAppraisals,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/recruitment",
      element: HrRecruitment,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/exits",
      element: HrExits,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/alumni",
      element: HrAlumniPortal,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/inventory",
      element: HrInventoryDashboard,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/inventory/rooms",
      element: HrInventoryRooms,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/inventory/furniture",
      element: HrInventoryFurniture,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/inventory/stationery",
      element: HrInventoryStationery,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/inventory/equipment",
      element: HrInventoryEquipment,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },
    {
      path: "/hr/inventory/assignments",
      element: HrInventoryAssignments,
      isProtected: true,
      requiredRoles: ["hr", "admin"],
    },

    // ==========================================
    // ✅ VICE CHANCELLOR (VC) ROUTES
    // ==========================================
    {
      path: "/vc/dashboard",
      element: VcDashboardContainer,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },
    {
      path: "/vc/home",
      element: VcMainContainer,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },
    {
      path: "/vc/course-review",
      element: VcCourseManagementContainer,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },
    {
      path: "/vc/approve-marks",
      element: VcApproveMarksContainer,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },
    {
      path: "/vc/accreditations",
      element: VcAccreditationsContainer,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },
    {
      path: "/vc/students",
      element: HodStudents,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },
    {
      path: "/vc/admissions",
      element: VcAdmissionsContainer,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },
    {
      path: "/vc/accounts",
      element: VcAccountsContainer,
      isProtected: true,
      requiredRoles: ["vc", "vice_vc", "admin"],
    },

    // Public / Shared
    { path: "/programs", element: Program },
    { path: "/admissions", element: Admission },
    { path: "/campus", element: CampusLife },
    { path: "/about", element: About },
  ];
};

export default getAdminRoutes;
