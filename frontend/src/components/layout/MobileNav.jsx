import { NavLink } from "react-router-dom";
import Drawer from "../ui/Drawer";
import { NAV_ITEMS } from "./navigation";

/**
 * MobileNav
 *
 * Mobile (≤768px) equivalent of Sidebar — same NAV_ITEMS, same
 * active-state styling, but shown as a left-side slide-over instead
 * of a persistent column, since there's no room for a fixed sidebar
 * on a small screen. Opened via the Navbar's hamburger button.
 */
export default function MobileNav({ isOpen, onClose }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="left" title="Menu">
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={`/${item.path}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#154d78]/10 text-[#154d78]"
                    : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </span>
              {!item.implemented && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  Soon
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </Drawer>
  );
}