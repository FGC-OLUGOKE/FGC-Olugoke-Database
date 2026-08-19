import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  HardHat,
  ClipboardCheck,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

/**
 * OverallStatsSection
 *
 * Same visual language as Dashboard's StatsRow, but every card here
 * is explicitly scoped to the selected report period (via sublabel),
 * so it doesn't get confused with "right now" dashboard stats.
 */
export default function OverallStatsSection({ stats, period }) {
  const cards = [
    { label: "Total Members", value: stats.total, icon: Users, accent: "#154d78" },
    { label: "Active Members", value: stats.active, icon: UserCheck, accent: "#4a2969" },
    { label: "Inactive Members", value: stats.inactive, icon: UserX, accent: "#9e263b" },
    { label: "New Members", value: stats.newMembers, icon: UserPlus, accent: "#d6b447", sublabel: period },
    { label: "Workers", value: stats.workers, icon: HardHat, accent: "#154d78" },
    {
      label: "Total Attendance",
      value: stats.totalAttendance,
      icon: ClipboardCheck,
      accent: "#4a2969",
      sublabel: period,
    },
    {
      label: "Average Attendance",
      value: stats.avgAttendance,
      icon: TrendingUp,
      accent: "#d6b447",
      sublabel: "per service",
    },
    { label: "Profile Completion", value: `${stats.profileCompletionPct}%`, icon: ShieldCheck, accent: "#9e263b" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, accent, sublabel }) => (
        <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 md:text-sm">{label}</p>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accent}1A` }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>}
        </div>
      ))}
    </div>
  );
}