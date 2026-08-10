import { Church } from "lucide-react";
import Logo from "../../assets/logo.svg";

/**
 * Navbar
 *
 * Global application header. Stays fixed across every page so
 * admins always have their bearings.
 *
 * Props:
 * - adminName  (string) - name of the signed-in admin, e.g. "Pastor John Doe"
 * - adminRole  (string) - role label shown under the name, e.g. "Church Admin"
 */
export default function Navbar({
  adminName = "Administrator",
  adminRole = "Church Admin",
}) {
  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 w-full bg-[#154d78] shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Left: identity */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <img src={Logo} alt="FGC Olugoke Logo" className="h-8 w-8" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-semibold text-white">
              FGC Olugoke
            </p>
            <p className="hidden truncate text-xs text-white/60 sm:block">
              Member Management System
            </p>
          </div>
        </div>

        {/* Right: signed-in admin */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="truncate text-sm font-medium text-white">
              {adminName}
            </p>
            <p className="truncate text-xs text-white/60">{adminRole}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-white/15">
            {initials || "A"}
          </div>
        </div>
      </div>

      {/* Signature accent — reserved gold, used sparingly per brand rules */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#d6b447]/0 via-[#d6b447] to-[#d6b447]/0" />
    </header>
  );
}