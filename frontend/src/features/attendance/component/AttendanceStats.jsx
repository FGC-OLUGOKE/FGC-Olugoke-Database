import { useMemo } from "react";
import { BarChart3, CalendarDays, Users } from "lucide-react";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-4 w-4" strokeWidth={2} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function AttendanceStats({ records, categoryKey, categoryLabel }) {
  const stats = useMemo(() => {
    if (!records.length) return { total: 0, average: 0, highest: 0, services: 0 };

    const totals = records.map((record) =>
      Number(categoryKey ? record[categoryKey] : record.total) || 0,
    );
    const total = totals.reduce((sum, value) => sum + value, 0);

    return {
      total,
      average: Math.round(total / totals.length),
      highest: Math.max(...totals),
      services: records.length,
    };
  }, [records, categoryKey]);

  const prefix = categoryLabel ? `${categoryLabel} ` : "";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={Users} label={`${prefix}Appearances`} value={stats.total} />
      <Stat icon={BarChart3} label={`${prefix}Average`} value={stats.average} />
      <Stat icon={BarChart3} label={`${prefix}Highest`} value={stats.highest} />
      <Stat icon={CalendarDays} label="Services Recorded" value={stats.services} />
    </div>
  );
}
