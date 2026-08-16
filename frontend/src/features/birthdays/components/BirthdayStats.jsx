import { Cake, CalendarDays, CalendarClock, CalendarRange } from "lucide-react";

/**
 * BirthdayStats
 *
 * Note: this no longer includes a "Next Birthday" card — that's now
 * only the standalone NextBirthdayCard spotlight further down the
 * page, not duplicated here as a stat.
 */
export default function BirthdayStats({ todayCount, weekCount, nextWeekCount, monthCount }) {
  const stats = [
    { label: "Birthdays Today", value: todayCount, icon: Cake, accent: "#154d78" },
    { label: "This Week", value: weekCount, icon: CalendarDays, accent: "#4a2969" },
    { label: "Next Week", value: nextWeekCount, icon: CalendarClock, accent: "#d6b447" },
    { label: "This Month", value: monthCount, icon: CalendarRange, accent: "#9e263b" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, accent }) => (
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
        </div>
      ))}
    </div>
  );
}