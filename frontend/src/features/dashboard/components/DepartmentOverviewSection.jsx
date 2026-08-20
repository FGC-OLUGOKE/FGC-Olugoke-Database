import { useNavigate } from "react-router-dom";
import SectionCard from "../../../components/ui/SectionCard";

export default function DepartmentOverviewSection({ departments, members }) {
  const navigate = useNavigate();
  const counts = departments.map((dept) => ({
    name: dept.name,
    count: members.filter((m) => m.departments.includes(dept.name)).length,
  }));
  const max = Math.max(1, ...counts.map((d) => d.count));

  return (
    <SectionCard
      title="Department Overview"
      actionLabel="View Departments"
      onAction={() => navigate("/departments")}
    >
      <ul className="space-y-3">
        {counts.map((dept) => (
          <li key={dept.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{dept.name}</span>
              <span className="text-gray-500">{dept.count}</span>
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