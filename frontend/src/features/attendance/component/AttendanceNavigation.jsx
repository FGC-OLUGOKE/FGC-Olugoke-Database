import { CalendarPlus, ClipboardList, History } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/attendance", label: "Record attendance", icon: CalendarPlus, end: true },
  { to: "/attendance/sessions", label: "Saved sessions", icon: ClipboardList },
  { to: "/attendance/history", label: "History", icon: History },
];

export default function AttendanceNavigation() {
  return (
    <nav aria-label="Attendance navigation" className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-[#154d78] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
