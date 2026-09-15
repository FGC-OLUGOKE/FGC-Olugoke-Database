import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import PageContainer from "./PageContainer";
import { useAuth } from "../../features/auth/AuthContext";
import { getRoleLabel } from "../../lib/permissions";

const SIDEBAR_WIDTH_PX = 240; // matches Sidebar's w-60 / content's md:ml-60
const TOGGLE_SIZE_PX = 28; // matches h-7 w-7 below

/**
 * Layout
 *
 * The app's persistent chrome — Navbar on top, Sidebar on the left
 * (desktop, collapsible, fixed to the viewport) / MobileNav drawer
 * (mobile), and whatever page is currently routed rendered via
 * <Outlet /> inside PageContainer.
 *
 * Because Sidebar is `position: fixed` (so it stays put while the
 * page scrolls), it no longer occupies space in normal document
 * flow. The content wrapper below compensates with a matching
 * `md:ml-60` / `md:ml-0` that transitions in step with Sidebar's own
 * width animation — collapsing the sidebar shifts the margin back to
 * 0 at the same time the sidebar's width animates to 0.
 */
export default function Layout() {
  const { user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        adminName={user?.name}
        adminPhotoUrl={user?.photoUrl}
        adminRole={getRoleLabel(user)}
        onMenuClick={() => setIsMobileNavOpen(true)}
      />

      <div className="relative">
        <Sidebar isOpen={isSidebarOpen} />

        {/* Floating collapse/expand handle — sits on the sidebar's
            edge, half over the sidebar and half over the content,
            and slides with it as the width transitions. Already
            viewport-relative (fixed), so Sidebar becoming fixed too
            doesn't change this positioning. */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            left: isSidebarOpen
              ? `${SIDEBAR_WIDTH_PX - TOGGLE_SIZE_PX / 2}px`
              : "8px",
          }}
          className="fixed top-20 z-30 hidden h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-[left] duration-200 ease-out hover:text-[#154d78] hover:shadow md:flex"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>

        <div
          className={`min-w-0 transition-[margin-left] duration-200 ease-out ${
            isSidebarOpen ? "md:ml-60" : "md:ml-0"
          }`}
        >
          <PageContainer>
            <Outlet />
          </PageContainer>
        </div>
      </div>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </div>
  );
}
