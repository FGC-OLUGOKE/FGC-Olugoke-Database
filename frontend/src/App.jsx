import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import LoginPage from "./features/auth/LoginPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import Layout from "./components/layout/Layout";
import ComingSoon from "./components/layout/ComingSoon";
import { NAV_ITEMS } from "./components/layout/navigation";
import DashboardPage from "./features/dashboard/DashboardPage";
import MembersPage from "./features/members/MembersPage";
import DepartmentsPage from "./features/departments/DepartmentsPage";
import BirthdaysPage from "./features/birthdays/BirthdaysPage";
import ReportsPage from "./features/reports/ReportsPage";
import ApprovalRequestsPage from "./features/approvals/ApprovalRequestsPage";
import AttendancePage from "./features/attendance/AttendancePage";
import ProfilePage from "./features/profile/ProfilePage";
import { ToastProvider } from "./components/ui/ToastProvider";
import { isSuperAdmin, isCategoryAdmin } from "./lib/permissions";

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    const path = window.location.pathname;
    if (path === "/forgot-password") return <ForgotPasswordPage />;
    if (path.startsWith("/reset-password/")) return <ResetPasswordPage />;
    return <LoginPage />;
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route
              index
              element={<Navigate to="/dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="admin/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="members"
              element={<MembersPage />}
            />

            <Route
              path="departments"
              element={
                isSuperAdmin(user) ? (
                  <DepartmentsPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="birthdays"
              element={<BirthdaysPage />}
            />

            <Route
              path="attendance"
              element={
                isSuperAdmin(user) || isCategoryAdmin(user) ? (
                  <AttendancePage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="reports"
              element={<ReportsPage />}
            />

            <Route
              path="approvals"
              element={
                isSuperAdmin(user) || isCategoryAdmin(user) ? (
                  <ApprovalRequestsPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="admin"
              element={
                isSuperAdmin(user) ? (
                  <ApprovalRequestsPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            {/* Profile is intentionally NOT in navigation.js */}
            <Route
              path="profile"
              element={<ProfilePage />}
            />

            {NAV_ITEMS.filter(
              (item) => !item.implemented,
            ).map((item) => (
              <Route
                key={item.path}
                path={item.path}
                element={<ComingSoon title={item.label} />}
              />
            ))}
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
