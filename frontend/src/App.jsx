import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ComingSoon from "./components/layout/ComingSoon";
import { NAV_ITEMS } from "./components/layout/navigation";
import MembersPage from "./features/members/MembersPage";
import { ToastProvider } from "./components/ui/ToastProvider";

/**
 * Every NAV_ITEM with implemented:false automatically gets a
 * ComingSoon route generated for it below — so adding a new item to
 * navigation.js immediately gives it a real (placeholder) page,
 * instead of the Sidebar/MobileNav pointing at a dead link.
 */
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/members" replace />} />
            <Route path="members" element={<MembersPage />} />

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