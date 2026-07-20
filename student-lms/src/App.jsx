import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./app/ProtectedRoute";
import StudentLayout from "./components/layout/StudentLayout";
import LoginView from "./features/auth/views/LoginView";
import ClassroomView from "./features/academics/ClassroomView";
import TimetableView from "./features/academics/TimetableView";
import DatesheetView from "./features/academics/DatesheetView";
import DashboardView from "./features/dashboard/DashboardView";
import FinanceView from "./features/finance/FinanceView";
import CourseRegistrationView from "./features/academics/CourseRegistrationView";
import TranscriptView from "./features/academics/TranscriptView";
import ProfileView from "./features/profile/ProfileView";

// Import the Direct Registration component
import DirectRegistration from "./components/registration/DirectRegistration";

const App = () => {
  return (
    <Routes>
      {/* --- PUBLIC / UNPROTECTED ROUTES --- */}
      <Route path="/login" element={<LoginView />} />

      {/* ✅ Add the Direct Registration Route here so it can be accessed without logging in */}
      <Route path="/direct-register" element={<DirectRegistration />} />

      {/* --- PROTECTED ROUTES (Requires Login) --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StudentLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/courses" element={<CourseRegistrationView />} />
          <Route path="/datesheet" element={<DatesheetView />} />
          <Route path="/transcripts" element={<TranscriptView />} />
          <Route path="/finance" element={<FinanceView />} />
          <Route path="/classroom" element={<ClassroomView />} />
          <Route path="/timetable" element={<TimetableView />} />

          <Route path="/profile" element={<ProfileView />} />
        </Route>
      </Route>

      {/* Catch-all route for unknown URLs */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
