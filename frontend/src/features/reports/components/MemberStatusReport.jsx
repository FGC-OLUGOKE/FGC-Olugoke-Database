import SectionCard from "../../../components/ui/SectionCard";
import ExportButton from "../../../components/ui/ExportButton";
import { exportToExcel } from "../../../lib/exportUtils";

const STATUS_COLORS = { Active: "#154d78", Inactive: "#9e263b" };

// Extensible on purpose: add another status to this list later
// (e.g. "Visiting") and both the bars and the export pick it up
// automatically — no redesign needed.
export default function MemberStatusReport({ breakdown, members, period }) {
  const statuses = [
    { status: "Active", count: breakdown.active, pct: breakdown.activePct },
    { status: "Inactive", count: breakdown.inactive, pct: breakdown.inactivePct },
  ];

  function handleExport() {
    exportToExcel(
      [
        {
          name: "Status Summary",
          reportName: "Member Status Report",
          period,
          columns: ["Status", "Number of Members", "Percentage of Total Membership"],
          rows: statuses.map((s) => [s.status, s.count, `${s.pct}%`]),
        },
        {
          name: "Member Details",
          reportName: "Member Status Details",
          period,
          columns: ["Full Name", "Status", "Category", "Department", "Date Joined"],
          rows: members.map((m) => [
            `${m.firstName} ${m.lastName}`,
            m.status,
            m.category,
            m.department || "Not Assigned",
            m.dateJoined,
          ]),
        },
      ],
      "member-status-report.xlsx"
    );
  }

  return (
    <SectionCard title="Member Status Report">
      <div className="mb-4 flex justify-end">
        <ExportButton onExport={handleExport} />
      </div>
      <ul className="space-y-4">
        {statuses.map((item) => (
          <li key={item.status}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{item.status}</span>
              <span className="text-gray-500">
                {item.count} · {item.pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.pct}%`, backgroundColor: STATUS_COLORS[item.status] ?? "#9ca3af" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}