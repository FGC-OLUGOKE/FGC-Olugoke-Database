import SectionCard from "../../../components/ui/SectionCard";
import ExportButton from "../../../components/ui/ExportButton";
import { exportToExcel } from "../../../lib/exportUtils";

export default function DepartmentReport({ departments, members, period }) {
  const max = Math.max(1, ...departments.map((d) => d.count));

  function handleExport() {
    exportToExcel(
      [
        {
          name: "Department Summary",
          reportName: "Department Report",
          period,
          columns: ["Department Name", "Number of Members", "Percentage of Total Workers"],
          rows: departments.map((d) => [d.name, d.count, `${d.pctOfWorkers}%`]),
        },
        {
          name: "Worker Details",
          reportName: "Department Worker Details",
          period,
          columns: ["Full Name", "Gender", "Category", "Department", "Status", "Date Joined"],
          rows: members
            .filter((m) => m.worker)
            .map((m) => [
              `${m.firstName} ${m.lastName}`,
              m.gender,
              m.category,
              m.department || "Not Assigned",
              m.status,
              m.dateJoined,
            ]),
        },
      ],
      "department-report.xlsx"
    );
  }

  return (
    <SectionCard title="Department Report">
      <div className="mb-4 flex justify-end">
        <ExportButton onExport={handleExport} />
      </div>
      <ul className="space-y-3">
        {departments.map((dept) => (
          <li key={dept.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{dept.name}</span>
              <span className="text-gray-500">
                {dept.count} members · {dept.pctOfWorkers}% of workers
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#154d78]"
                style={{ width: `${(dept.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}