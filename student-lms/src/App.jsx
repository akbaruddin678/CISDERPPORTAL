import { Routes, Route, Navigate } from "react-router-dom"; // ✅ Import Navigate
import ProtectedRoute from "./app/ProtectedRoute";
import StudentLayout from "./components/layout/StudentLayout";
import LoginView from "./features/auth/views/LoginView";
import DashboardView from "./features/dashboard/DashboardView";


import FinanceView from "./features/finance/FinanceView";
import CourseRegistrationView from "./features/academics/CourseRegistrationView";
const App = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginView />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StudentLayout />}>
          {/* ✅ Redirect root (/) to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* ✅ Define the /dashboard route */}
          <Route path="/dashboard" element={<DashboardView />} />

          <Route path="/courses" element={<CourseRegistrationView />} />
          <Route
            path="/transcripts"
            element={<div className="p-6">Transcripts Component Here</div>}
          />
          <Route path="/finance" element={<FinanceView />} />
        </Route>
      </Route>

      {/* Optional: Catch-all route to redirect unknown URLs to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
