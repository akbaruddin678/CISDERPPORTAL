import React from "react";
import { useAuth } from "../../auth/context/AuthContext";
import AdminHomeContainer from "../../../Admin/AdminHome/container/AdminHomeContainer";
import ProfileContainer from "../../profile/container/ProfileContainer";
import AccountantHome from "../../../Admin/AdminHome/view/AccountantHome";
import HrDashboardContainer from "../../../Admin/HrDepartment/container/HrDashboardContainer";
import AdmssionOffice from "../../../Admin/Admission/container/AdmssionMainContainer";
import ExamMainContiner from "../../../Admin/Exam/container/ExamMainContainer";
import TransportContainer from "../../../Admin/Transport/container/TransportContainer";
import FeeAnalyticsContainer from "../../../Admin/Dashboard/container/FeeAnalyticsContainer";
import HODMainContainer from "../../../Admin/HeadofDepartment/container/HODMainContainer";
import MyDepartmentContainer from "../../../Admin/Departsments/container/MyDepartmentContainer";
import TeacherMainContainer from "../../../Admin/teacher/container/TeacherMainContainer";
import RegistrarMainContainer from "../../../Admin/Registrar/container/RegistrarMainContainer";
import HeadOfAcademiaMainContainer from "../../../Admin/HeadofAcademia/container/HeadOfAcademiaMainContainer";
import VcMainContainer from "../../../Admin/VC/container/VcMainContainer";
import UniversityLanding from "../../LandingPage/LandingPage";
import { ClearanceDeskPage } from "../../../Admin/Graduation/container/GraduationPages";

const HomeMianContainer = () => {
  const { userData } = useAuth();

  const roles = userData?.roles || [];

  if (!roles.length) {
    return <UniversityLanding />;
  }

  if (roles.includes("admin")) {
    return <AdminHomeContainer />;
  }

  if (roles.includes("hr")) {
    return <HrDashboardContainer />;
  }

  if (roles.includes("vc") || roles.includes("vice_vc"))
    return <VcMainContainer />; 
  if (roles.includes("registrar")) {
    return <RegistrarMainContainer />;
  }
  if (roles.includes("head_of_academia"))
    return <HeadOfAcademiaMainContainer />;

  if (roles.includes("manager") || roles.includes("exam")) {
    return <ExamMainContiner />;
  }

  if (roles.includes("accountant") || roles.includes("headofaccount")) {
    return <AccountantHome />;
  }

  if (roles.includes("admission")) {
    return <AdmssionOffice />;
  }

  if (roles.includes("hod")) {
    return <HODMainContainer />;
  }

  if (roles.includes("department")) {
    return <MyDepartmentContainer />;
  }

  if (roles.includes("teacher")) {
    return <TeacherMainContainer />;
  }

  if (roles.includes("transport")) {
    return <TransportContainer />;
  }

  if (
    roles.includes("library") ||
    roles.includes("hostel") ||
    roles.includes("it_labs") ||
    roles.includes("clearance_officer")
  ) {
    return <ClearanceDeskPage />;
  }

  if (roles.includes("viwer")) {
    return <FeeAnalyticsContainer />;
  }

  if (roles.includes("applicant") || roles.includes("student")) {
    return <ProfileContainer />;
  }

  return <UniversityLanding />;
};

export default HomeMianContainer;
