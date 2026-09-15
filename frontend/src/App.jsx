import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import LoginPage from "./features/auth/LoginPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import ChangePasswordPage from "./features/auth/ChangePasswordPage";
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
import LogsPage from "./features/activity-logs/LogsPage.jsx";
import ProfilePage from "./features/profile/ProfilePage";
import MyDepartmentPage from "./features/departments/MyDepartmentPage";
import { ToastProvider } from "./components/ui/ToastProvider";
import { isSuperAdmin, isCategoryAdmin, isPastorate, isDepartmentAdmin } from "./lib/permissions";

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    const path = window.location.pathname;
    if (path === "/forgot-password") return <ForgotPasswordPage />;
    if (path.startsWith("/reset-password/")) {
      const token = decodeURIComponent(path.slice("/reset-password/".length));
      return <ResetPasswordPage token={token} />;
    }
    return <LoginPage />;
  }
  if (user.mustSetPassword && window.location.pathname !== "/set-password") {
    return <ResetPasswordPage firstLogin />;
  }
  if (user.mustSetPassword) {
    return <ResetPasswordPage firstLogin />;
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
                isSuperAdmin(user) || isPastorate(user) || isDepartmentAdmin(user) ? (
                  <DepartmentsPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="my-department/:departmentId?"
              element={
                isSuperAdmin(user) || isPastorate(user) || isDepartmentAdmin(user) ? (
                  <MyDepartmentPage />
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
                isSuperAdmin(user) || isCategoryAdmin(user) || isPastorate(user) ? (
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
              path="logs"
              element={
                isSuperAdmin(user) ? <LogsPage /> : <Navigate to="/dashboard" replace />
              }
            />

            <Route
              path="approvals"
              element={
                isSuperAdmin(user) || isCategoryAdmin(user) || isPastorate(user) ? (
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

            <Route
              path="change-password"
              element={<ChangePasswordPage />}
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
