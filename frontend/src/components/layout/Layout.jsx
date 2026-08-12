import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import PageContainer from "./PageContainer";

const SIDEBAR_WIDTH_PX = 240; // matches Sidebar's w-60
const TOGGLE_SIZE_PX = 28; // matches h-7 w-7 below

/**
 * Layout
 *
 * The app's persistent chrome — Navbar on top, Sidebar on the left
 * (desktop, collapsible) / MobileNav drawer (mobile), and whatever
 * page is currently routed rendered via <Outlet /> inside
 * PageContainer.
 *
 * The Sidebar's collapse toggle is a small floating button that
 * overlays the boundary between the sidebar and the page content
 * (Notion/Linear-style handle) rather than living in the Navbar —
 * it tracks the sidebar's edge as it animates open/closed.
 */
export default function Layout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        adminName="Pastor John Doe"
        adminRole="Church Admin"
        onMenuClick={() => setIsMobileNavOpen(true)}
      />

      <div className="relative flex">
        <Sidebar isOpen={isSidebarOpen} />

        {/* Floating collapse/expand handle — sits on the sidebar's
            edge, half over the sidebar and half over the content,
            and slides with it as the width transitions. */}
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

        <div className="min-w-0 flex-1">
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