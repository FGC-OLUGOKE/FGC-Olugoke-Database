import { Users, UserCheck, UserPlus, HardHat } from "lucide-react";

export default function StatsRow({ totalMembers, activeMembers, newMembersThisMonth, workersCount }) {
  const stats = [
    { label: "Total Members", value: totalMembers, icon: Users, accent: "#154d78" },
    { label: "Active Members", value: activeMembers, icon: UserCheck, accent: "#4a2969" },
    { label: "New Members", value: newMembersThisMonth, icon: UserPlus, accent: "#d6b447", sublabel: "This month" },
    { label: "Workers", value: workersCount, icon: HardHat, accent: "#9e263b" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, accent, sublabel }) => (
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