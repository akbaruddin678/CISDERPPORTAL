import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./app/ProtectedRoute";
import StudentLayout from "./components/layout/StudentLayout";
import LoginView from "./features/auth/views/LoginView";
import DashboardView from "./features/dashboard/DashboardView";

import FinanceView from "./features/finance/FinanceView";
import CourseRegistrationView from "./features/academics/CourseRegistrationView";
// ✅ Import TranscriptView
import TranscriptView from "./features/academics/TranscriptView";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<StudentLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/courses" element={<CourseRegistrationView />} />

          {/* ✅ Connect the route */}
          <Route path="/transcripts" element={<TranscriptView />} />

          <Route path="/finance" element={<FinanceView />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
