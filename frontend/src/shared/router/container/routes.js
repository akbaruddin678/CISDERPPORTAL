// shared/router/container/routes.js
import { lazy } from "react";
import getAdminRoutes from "../../../Admin/SupperAdmin/routes/adminRoutes";

// ✅ 1. Convert all static imports to Lazy Imports
const LoginContainer = lazy(() => import("../../../components/user/container/LoginContainer"));
const HomeMianContainer = lazy(() => import("../../../components/Home/container/HomeMianContainer"));
const UniversityLanding = lazy(() => import("../../../components/LandingPage/LandingPage"));
const ProfileContainer = lazy(() => import("../../../components/profile/container/ProfileContainer"));
const UserAdmissionContainer = lazy(() => import("../../../components/user-admission/container/UserAdmissionContainer"));
const ChallanList = lazy(() => import("../../../components/user-admission/view/ChallanList"));
const ChallanDetail = lazy(() => import("../../../components/user-admission/view/ChallanDetail"));
const SignupContainer = lazy(() => import("../../../components/user/container/SignupContainer"));
const PageNotFoundView = lazy(() => import("../../pageNotFound/view/PageNotFoundView"));
const UnauthorizedView = lazy(() => import("../../UnauthorizedView/view/UnauthorizedView"));
const VerifyEmail = lazy(() => import("../../../components/user/view/VerifyEmail"));
const SetPassword = lazy(() => import("../../../components/user/view/SetPassword"));
const ForgotPasswordContainer = lazy(() => import("../../../components/user/container/ForgotPasswordContainer"));
const AttendanceKioskContainer = lazy(() => import("../../../Kiosk/container/AttendanceKioskContainer"));
const TeacherOnboardingContainer = lazy(() => import("../../../PublicOnboarding/container/TeacherOnboardingContainer"));
const AllRoutes = [
  {
    path: "/login",
    element: LoginContainer,
    isProtected: false,
  },
  {
    path: "/verify-email",
    element: VerifyEmail,
    isProtected: false, // It must be public
    publicRoute: true,
  },
  {
    path: "/forgot-password",
    element: ForgotPasswordContainer,
    isProtected: false,
    publicRoute: true,
  },
  {
    path: "/set-password",
    element: SetPassword,
    isProtected: false,
    publicRoute: true,
  },
  {
    path: "/attendance-kiosk",
    element: AttendanceKioskContainer,
    isProtected: false,
    publicRoute: true,
  },
  {
    path: "/teacher-onboarding",
    element: TeacherOnboardingContainer,
    isProtected: false,
    publicRoute: true,
  },
  {
    path: "/",
    element: UniversityLanding,
    isProtected: false,
  },
  {
    path: "/home", 
    element: HomeMianContainer,
    isProtected: true,
  },
  {
    path: "/voucher",
    element: ChallanList,
    isProtected: true,
  },
  {
    path: "/challan-detail/:id",
    element: ChallanDetail,
    isProtected: true,
  },
  {
    path: "/profile",
    element: ProfileContainer,
    isProtected: true,
  },
  {
    path: "/admission",
    element: UserAdmissionContainer,
    isProtected: true,
    requiredRoles: ["applicant"],
  },
  {
    path: "/signup",
    element: SignupContainer,
    isProtected: false,
  },
  {
    path: "/unauthorized",
    element: UnauthorizedView,
    publicRoute: true,
  },
  {
    path: "*",
    element: PageNotFoundView,
    publicRoute: true,
  },

  
  ...getAdminRoutes(),
];

export default AllRoutes;