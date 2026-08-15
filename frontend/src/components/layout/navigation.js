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

export const NAV_ITEMS = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard, implemented: true },
  { label: "Members", path: "members", icon: Users, implemented: true },
  { label: "Departments", path: "departments", icon: Building2, implemented: true },
  { label: "Attendance", path: "attendance", icon: ClipboardCheck, implemented: false },
  { label: "Birthdays", path: "birthdays", icon: Cake, implemented: true },
  { label: "Events", path: "events", icon: CalendarDays, implemented: false },
  { label: "Workers", path: "workers", icon: HardHat, implemented: false },
  { label: "Cell Groups", path: "cell-groups", icon: UsersRound, implemented: false },
  { label: "Reports", path: "reports", icon: BarChart3, implemented: false },
  { label: "Settings", path: "settings", icon: Settings, implemented: false },
];
