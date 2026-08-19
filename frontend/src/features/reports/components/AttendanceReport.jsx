import { ClipboardX } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import LineTrendChart from "../../../components/ui/LineTrendChart";
import EmptyState from "../../../components/ui/EmptyState";
import ExportButton from "../../../components/ui/ExportButton";
import { exportToExcel } from "../../../lib/exportUtils";

export default function AttendanceReport({ records, stats, period }) {
  function handleExport() {
    exportToExcel(
      [
        {
          name: "Attendance Summary",
          reportName: "Attendance Report",
          period,
          columns: ["Metric", "Value"],
          rows: [
            ["Total Attendance", stats.total],
            ["Average Attendance", stats.average],
            ["Highest Attendance", stats.highest?.total ?? "—"],
            ["Lowest Attendance", stats.lowest?.total ?? "—"],
            ["Attendance Change", `${stats.changePct}%`],
          ],
        },
        {
          name: "Attendance Records",
          reportName: "Attendance Records",
          period,
          columns: ["Date", "Adult", "Youth", "Teenager", "Children", "Total Attendance"],
          rows: records.map((r) => [r.date, r.adults, r.youth, r.teenagers, r.children, r.total]),
        },
      ],
      "attendance-report.xlsx"
    );
  }

  if (records.length === 0) {
    return (
      <SectionCard title="Attendance Report">
        <EmptyState
          icon={ClipboardX}
          title="No attendance data"
          description="No attendance data available for this period."
        />
      </SectionCard>
    );
  }

  const isPositive = Number(stats.changePct) >= 0;

  return (
    <SectionCard title="Attendance Report">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-gray-900">{stats.total}</span>
          <span className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-[#9e263b]"}`}>
            {isPositive ? "+" : ""}
            {stats.changePct}% vs previous period
          </span>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Average" value={stats.average} />
        <SummaryStat label="Highest" value={stats.highest?.total ?? "—"} />
        <SummaryStat label="Lowest" value={stats.lowest?.total ?? "—"} />
        <SummaryStat label="Services" value={records.length} />
      </div>

      <LineTrendChart
        data={records}
        xKey="week"
        lines={[{ dataKey: "total", color: "#4a2969", label: "Attendance" }]}
        height={200}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Adult" value={stats.byCategory.adults} />
        <SummaryStat label="Youth" value={stats.byCategory.youth} />
        <SummaryStat label="Teenager" value={stats.byCategory.teenagers} />
        <SummaryStat label="Children" value={stats.byCategory.children} />
      </div>
    </SectionCard>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}