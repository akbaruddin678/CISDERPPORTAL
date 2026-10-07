import "./App.css";
import "./index.css";
import React, { Suspense, lazy } from "react"; 
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import AllRoutes from "./shared/router/container/routes";
import RoutesContainer from "./shared/router/container/RoutesContainer";
import { AuthProvider } from "./components/auth/context/AuthContext";
import { AlertProvider } from "./shared/Alert/context/AlertContext";
import NavbarContainer from "./components/navbar/container/NavbarContainer";


const SurveyLogin = lazy(() => import("./components/survey/container/surveyContainer"));
const SurveyAdminDashboard = lazy(() => import("./components/survey/view/surveyAdmin/AdminDashboard"));
const SurveyStudentDashboard = lazy(() => import("./components/survey/view/studentSurvey/studentSurvey"));
const SurveyForm = lazy(() => import("./components/survey/view/surveyAdmin/SurveyForm"));
const SurveyResponses = lazy(() => import("./components/survey/view/surveyAdmin/SurveyResponses"));
const SurveyTeacherDashboard = lazy(() => import("./components/survey/view/teacherDashboard/TeacherDashboard"));

// Loading Component (Spinner)
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50 fixed inset-0 z-50">
    <svg
      className="animate-spin h-16 w-16 text-blue-600 mb-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    {/* <div className="text-xl font-semibold text-gray-700 animate-pulse">
      Loading ERP Module...
    </div> */}
    <p className="text-sm text-gray-500 mt-2">Please wait...</p>
  </div>
);

function AppContent() {
  const location = useLocation();


  const hideNavbarPatterns = [
    "/landing/cms",
  ];

  // Public marketing pages render their own header/footer (SiteLayout).
  const publicSitePaths = ["/", "/about", "/admissions", "/contact", "/programs", "/campuses"];

  const shouldHideNavbar =
    publicSitePaths.includes(location.pathname) ||
    hideNavbarPatterns.some(pattern => 
      location.pathname.startsWith(pattern)
    );

  return (
    <>
      {!shouldHideNavbar && <NavbarContainer />}

      {/* 4. Wrap Routes in Suspense */}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Survey / CMS Routes */}
          <Route path="/landing/cms" element={<SurveyLogin />} />
          <Route path="/landing/cms/survey-admin" element={<SurveyAdminDashboard />} />
          <Route path="/landing/cms/survey-responses" element={<SurveyResponses />} />
          <Route path="/landing/cms/student" element={<SurveyStudentDashboard />} />
          <Route path="/landing/cms/student/survey/:id" element={<SurveyForm />} />
          <Route path="/landing/cms/teacher" element={<SurveyTeacherDashboard />} />

          {/* Standard Routes */}
          {AllRoutes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={
                <RoutesContainer
                  element={route.element}
                  isProtected={route.isProtected}
                  requiredRole={route.requiredRole}
                  path={route.path}
                  {...route}
                />
              }
            />
          ))}
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AlertProvider>
          <AppContent />
        </AlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
