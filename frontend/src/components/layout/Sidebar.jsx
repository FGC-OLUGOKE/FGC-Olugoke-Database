import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navigation";

/**
 * Sidebar
 *
 * Persistent left navigation, visible on desktop (md: and above).
 * Collapses/expands via the `isOpen` prop, animating its width shut
 * with the nav content clipped by `overflow-hidden` — reads as a
 * smooth slide rather than an abrupt cut. The inner <nav> keeps a
 * fixed width (w-60) regardless of the collapsed state, so its
 * content never squishes or wraps mid-animation.
 *
 * On mobile, this is hidden entirely in favor of MobileNav (a
 * drawer triggered from the Navbar's hamburger button).
 */
export default function Sidebar({ isOpen }) {
  return (
    <aside
      className={`hidden shrink-0 overflow-hidden bg-white transition-all duration-200 ease-out md:block ${
        isOpen ? "w-60 border-r border-gray-200" : "w-0 border-r-0"
      }`}
    >
      <nav className="flex w-60 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>
    </aside>
  );
}

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={`/${item.path}`}
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
}