import { Navigate, Route, Routes } from "react-router-dom";

import { Shell } from "./components/Shell.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import Analytics from "./pages/Analytics.jsx";
import ChildDashboard from "./pages/ChildDashboard.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FocusMode from "./pages/FocusMode.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import ParentPanel from "./pages/ParentPanel.jsx";
import Reports from "./pages/Reports.jsx";
import SettingsPage from "./pages/Settings.jsx";

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-ink p-8 text-slate-100">Loading Habit Breaker AI...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <Shell />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/parent"
          element={
            <Protected roles={["parent", "admin"]}>
              <ParentPanel />
            </Protected>
          }
        />
        <Route
          path="/child"
          element={
            <Protected roles={["child", "parent", "admin"]}>
              <ChildDashboard />
            </Protected>
          }
        />
        <Route path="/reports" element={<Reports />} />
        <Route
          path="/admin"
          element={
            <Protected roles={["admin"]}>
              <AdminPanel />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
