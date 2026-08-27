import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import LoginPage from "./features/auth/LoginPage";
import Layout from "./components/layout/Layout";
import ComingSoon from "./components/layout/ComingSoon";
import { NAV_ITEMS } from "./components/layout/navigation";
import DashboardPage from "./features/dashboard/DashboardPage";
import MembersPage from "./features/members/MembersPage";
import DepartmentsPage from "./features/departments/DepartmentsPage";
import BirthdaysPage from "./features/birthdays/BirthdaysPage";
import ReportsPage from "./features/reports/ReportsPage";
import ApprovalRequestsPage from "./features/approvals/ApprovalRequestsPage";
import { ToastProvider } from "./components/ui/ToastProvider";
import { getAllowedNavPaths } from "./lib/permissions";

function RequireAccess({ path, children }) {
  const { user } = useAuth();
  const allowedPaths = getAllowedNavPaths(user);
  return allowedPaths && !allowedPaths.includes(path) ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
}
export default function App() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <LoginPage />;
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="admin/dashboard" element={<DashboardPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route
              path="departments"
              element={
                <RequireAccess path="departments">
                  <DepartmentsPage />
                </RequireAccess>
              }
            />
            <Route path="birthdays" element={<BirthdaysPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route
              path="approvals"
              element={
                <RequireAccess path="admin">
                  <ApprovalRequestsPage />
                </RequireAccess>
              }
            />
            <Route
              path="admin"
              element={
                <RequireAccess path="admin">
                  <ApprovalRequestsPage />
                </RequireAccess>
              }
            />
            {NAV_ITEMS.filter((item) => !item.implemented).map((item) => (
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
