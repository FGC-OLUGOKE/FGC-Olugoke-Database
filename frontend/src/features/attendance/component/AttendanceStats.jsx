
import { useMemo } from "react";

import {
  BarChart3,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

function Stat({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  iconBgClass,
}) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* ICON */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBgClass}`}
        >
          <Icon
            className={`h-5 w-5 ${iconClass}`}
            strokeWidth={2}
          />
        </div>

        {/* VALUE */}
        <p className="text-right text-2xl font-semibold tracking-tight text-gray-900">
          {value.toLocaleString()}
        </p>
      </div>

      {/* LABEL */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700">
          {label}
        </p>

        {description && (
          <p className="mt-1 text-xs text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AttendanceStats({
  records,
  categoryKey,
  categoryLabel,
}) {
  const stats = useMemo(() => {
    if (!records.length) {
      return {
        total: 0,
        average: 0,
        highest: 0,
        services: 0,
      };
    }

    const totals = records.map(
      (record) =>
        Number(
          categoryKey
            ? record[categoryKey]
            : record.total,
        ) || 0,
    );

    const total = totals.reduce(
      (sum, value) => sum + value,
      0,
    );

    return {
      total,
      average: Math.round(
        total / totals.length,
      ),
      highest: Math.max(...totals),
      services: records.length,
    };
  }, [records, categoryKey]);

  const prefix = categoryLabel
    ? `${categoryLabel} `
    : "";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

      {/* AVERAGE */}
      <Stat
        icon={BarChart3}
        label={`${prefix}Average`}
        value={stats.average}
        description="Average attendance per service"
        iconClass="text-[#4a2969]"
        iconBgClass="bg-[#4a2969]/10"
      />

      {/* HIGHEST */}
      <Stat
        icon={TrendingUp}
        label={`${prefix}Highest`}
        value={stats.highest}
        description="Highest attendance recorded"
        iconClass="text-[#9e263b]"
        iconBgClass="bg-[#9e263b]/10"
      />

      {/* SERVICES */}
      <Stat
        icon={CalendarDays}
        label="Services Recorded"
        value={stats.services}
        description="Total services with attendance"
        iconClass="text-[#154d78]"
        iconBgClass="bg-[#154d78]/10"
      />

    </div>
  );
}

