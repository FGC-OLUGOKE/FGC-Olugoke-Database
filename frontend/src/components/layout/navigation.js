import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  Cake,
  CalendarDays,
  HardHat,
  UsersRound,
  BarChart3,
  Settings,
} from "lucide-react";

/**
 * Single source of truth for app navigation — used by both the
 * desktop Sidebar and the mobile nav drawer, and by App.jsx to
 * generate a placeholder route for every module that isn't built
 * yet. Flip `implemented` to true once a module actually exists.
 */
export const NAV_ITEMS = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard, implemented: false },
  { label: "Members", path: "members", icon: Users, implemented: true },
  { label: "Departments", path: "departments", icon: Building2, implemented: false },
  { label: "Attendance", path: "attendance", icon: ClipboardCheck, implemented: false },
  { label: "Birthdays", path: "birthdays", icon: Cake, implemented: false },
  { label: "Events", path: "events", icon: CalendarDays, implemented: false },
  { label: "Workers", path: "workers", icon: HardHat, implemented: false },
  { label: "Cell Groups", path: "cell-groups", icon: UsersRound, implemented: false },
  { label: "Reports", path: "reports", icon: BarChart3, implemented: false },
  { label: "Settings", path: "settings", icon: Settings, implemented: false },
];