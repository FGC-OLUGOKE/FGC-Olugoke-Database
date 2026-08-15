import { Cake, CalendarDays, CalendarRange, PartyPopper } from "lucide-react";

export default function BirthdayStats({ todayCount, weekCount, monthCount, nextEntry }) {
  const stats = [
    { label: "Birthdays Today", value: todayCount, icon: Cake, accent: "#154d78" },
    { label: "This Week", value: weekCount, icon: CalendarDays, accent: "#4a2969" },
    { label: "This Month", value: monthCount, icon: CalendarRange, accent: "#d6b447" },
    {
      label: "Next Birthday",
      value: nextEntry ? `${nextEntry.member.firstName} ${nextEntry.member.lastName}` : "—",
      sublabel: nextEntry
        ? nextEntry.birthday.next.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : undefined,
      icon: PartyPopper,
      accent: "#9e263b",
      isName: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, accent, sublabel, isName }) => (
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
          <p className={`mt-2 font-semibold text-gray-900 ${isName ? "truncate text-lg md:text-xl" : "text-2xl md:text-3xl"}`}>
            {value}
          </p>
          {sublabel && <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>}
        </div>
      ))}
    </div>
  );
}
