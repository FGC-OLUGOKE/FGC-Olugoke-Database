import { useNavigate } from "react-router-dom";
import SectionCard from "../../../components/ui/SectionCard";
import LineTrendChart from "../../../components/ui/LineTrendChart";

export default function AttendanceOverviewSection({ attendance }) {
  const navigate = useNavigate();
  const latest = attendance[attendance.length - 1];
  const previous = attendance[attendance.length - 2];
  const change =
    previous && previous.total
      ? (((latest.total - previous.total) / previous.total) * 100).toFixed(1)
      : "0.0";
  const isPositive = Number(change) >= 0;

  const breakdown = [
    { label: "Adults", value: latest.adults },
    { label: "Youth", value: latest.youth },
    { label: "Teenagers", value: latest.teenagers },
    { label: "Children", value: latest.children },
  ];

  return (
    <SectionCard
      title="Attendance Overview"
      actionLabel="View Attendance"
      onAction={() => navigate("/attendance")}
    >
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-gray-900">{latest.total}</span>
        <span className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-[#9e263b]"}`}>
          {isPositive ? "+" : ""}
          {change}% vs last week
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {breakdown.map((b) => (
          <div key={b.label} className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{b.value}</p>
            <p className="text-xs text-gray-500">{b.label}</p>
          </div>
        ))}
      </div>
      <LineTrendChart
        data={attendance}
        xKey="week"
        lines={[{ dataKey: "total", color: "#4a2969", label: "Attendance" }]}
        height={180}
      />
    </SectionCard>
  );
}