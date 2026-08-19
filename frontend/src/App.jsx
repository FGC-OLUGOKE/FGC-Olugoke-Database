import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ComingSoon from "./components/layout/ComingSoon";
import { NAV_ITEMS } from "./components/layout/navigation";
import DashboardPage from "./features/dashboard/DashboardPage";
import MembersPage from "./features/members/MembersPage";
import DepartmentsPage from "./features/departments/DepartmentsPage";
import BirthdaysPage from "./features/birthdays/BirthdaysPage";
import ReportsPage from "./features/reports/ReportsPage";
import { ToastProvider } from "./components/ui/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="birthdays" element={<BirthdaysPage />} />
            <Route path="reports" element={<ReportsPage />} />

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