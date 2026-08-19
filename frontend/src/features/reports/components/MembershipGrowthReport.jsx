import SectionCard from "../../../components/ui/SectionCard";
import LineTrendChart from "../../../components/ui/LineTrendChart";
import ExportButton from "../../../components/ui/ExportButton";
import { exportToExcel } from "../../../lib/exportUtils";

export default function MembershipGrowthReport({ growth, summary, period }) {
  function handleExport() {
    exportToExcel(
      [
        {
          name: "Growth Summary",
          reportName: "Membership Growth Report",
          period,
          columns: [
            "Time Period",
            "Starting Membership",
            "New Members",
            "Inactive Members",
            "Ending Membership",
            "Net Growth",
            "Growth %",
          ],
          rows: [
            [
              period,
              summary.starting,
              summary.newMembers,
              summary.inactiveMembers,
              summary.ending,
              summary.netGrowth,
              `${summary.growthPct}%`,
            ],
          ],
        },
        {
          name: "Monthly Totals",
          reportName: "Monthly Membership Totals",
          period,
          columns: ["Month", "Total Members"],
          rows: growth.map((g) => [g.month, g.total]),
        },
      ],
      "membership-growth-report.xlsx"
    );
  }

  const isPositive = Number(summary?.growthPct ?? 0) >= 0;

  return (
    <SectionCard title="Membership Growth">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-gray-900">{summary?.ending ?? 0}</span>
          <span className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-[#9e263b]"}`}>
            {isPositive ? "+" : ""}
            {summary?.growthPct ?? 0}%
          </span>
        </div>
        <ExportButton onExport={handleExport} />
      </div>

      <LineTrendChart
        data={growth}
        xKey="month"
        lines={[{ dataKey: "total", color: "#154d78", label: "Members" }]}
      />

      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryStat label="Starting" value={summary.starting} />
          <SummaryStat label="New Members" value={summary.newMembers} />
          <SummaryStat label="Made Inactive" value={summary.inactiveMembers} />
          <SummaryStat label="Ending" value={summary.ending} />
          <SummaryStat label="Net Growth" value={summary.netGrowth} />
          <SummaryStat label="Growth %" value={`${summary.growthPct}%`} />
        </div>
      )}
    </SectionCard>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}