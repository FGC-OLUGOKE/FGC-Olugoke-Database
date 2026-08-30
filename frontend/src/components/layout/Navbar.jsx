import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import Logo from "../../assets/logo.svg";
import DropdownMenu, { DropdownMenuItem } from "../ui/DropdownMenu";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useAuth } from "../../features/auth/AuthContext";

/**
 * Navbar
 *
 * Global application header. Stays fixed across every page so
 * admins always have their bearings.
 */

export default function Navbar({
  adminName = "Administrator",
  adminRole = "Church Admin",
  onMenuClick,
}) {
  const navigate = useNavigate();

  const { logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function handleConfirmLogout() {
    setShowLogoutConfirm(false);

    if (logout) {
      logout();
    } else {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    }
  }

  function handleViewProfile(close) {
    close();
    navigate("/profile");
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#154d78] shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          {/* Left: menu trigger (mobile only) + identity */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
            >
              <Menu
                className="h-5 w-5"
                strokeWidth={2}
              />
            </button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <img src={Logo} alt="Logo" />
            </div>

            <div className="min-w-0 leading-tight">
              <p className="truncate text-[15px] font-semibold text-white">
                Foursquare Church
              </p>

              <p className="hidden truncate text-xs text-white/60 sm:block">
                Member Management System
              </p>
            </div>
          </div>

          {/* Right: signed-in admin Avatar with Dropdown */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="truncate text-sm font-medium text-white">
                {adminName}
              </p>

              <p className="truncate text-xs text-white/60">
                {adminRole}
              </p>
            </div>

            <DropdownMenu
              width={200}
              trigger={
                <button
                  type="button"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="User actions"
                >
                  {initials || "A"}
                </button>
              }
            >
              {(close) => (
                <div className="py-1">
                  {/* Mobile user info */}
                  <div className="border-b border-gray-100 px-3 py-2 sm:hidden">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {adminName}
                    </p>

                    <p className="truncate text-xs text-gray-500">
                      {adminRole}
                    </p>
                  </div>

                  <DropdownMenuItem
                    icon={User}
                    label="View Profile"
                    onClick={() => handleViewProfile(close)}
                  />

                  <div className="my-1 border-t border-gray-100" />

                  <DropdownMenuItem
                    icon={LogOut}
                    label="Log Out"
                    variant="danger"
                    onClick={() => {
                      close();
                      setShowLogoutConfirm(true);
                    }}
                  />
                </div>
              )}
            </DropdownMenu>
          </div>
        </div>

        {/* Signature accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#d6b447]/0 via-[#d6b447] to-[#d6b447]/0" />
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log Out"
        description="Are you sure you want to log out of your account?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}