import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navigation";

/**
 * Sidebar
 *
 * Fixed to the viewport (stays in place while the page scrolls),
 * spanning from just below the Navbar down to the bottom of the
 * screen. Visible on desktop (md: and above) only — mobile uses
 * MobileNav instead.
 *
 * Collapses/expands via the `isOpen` prop, animating its width shut
 * with the nav content clipped by `overflow-hidden`. The inner <nav>
 * keeps a fixed width (w-60) regardless of collapsed state, so its
 * content never squishes or wraps mid-animation — it's just revealed
 * or hidden as the outer width transitions.
 *
 * Because this is `fixed`, it no longer takes up space in normal
 * document flow — Layout.jsx compensates by applying a matching
 * `margin-left` to the main content area (see Layout.jsx).
 */
export default function Sidebar({ isOpen }) {
  return (
    <aside
      className={`fixed bottom-0 left-0 top-16 z-30 hidden overflow-hidden bg-white transition-all duration-200 ease-out md:block ${
        isOpen ? "w-60 border-r border-gray-200" : "w-0 border-r-0"
      }`}
    >
      <nav className="flex h-full w-60 flex-col gap-1 overflow-y-auto p-3">
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