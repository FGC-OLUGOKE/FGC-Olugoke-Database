import SectionCard from "../../../components/ui/SectionCard";
import LineTrendChart from "../../../components/ui/LineTrendChart";

export default function MembershipGrowthSection({ data }) {
  const latest = data[data.length - 1]?.total ?? 0;
  const previous = data[data.length - 2]?.total ?? latest;
  const change = previous === 0 ? "0.0" : (((latest - previous) / previous) * 100).toFixed(1);
  const isPositive = Number(change) >= 0;

  return (
    <SectionCard title="Membership Growth">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-gray-900">{latest}</span>
        <span className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-[#9e263b]"}`}>
          {isPositive ? "+" : ""}
          {change}% vs last month
        </span>
      </div>
      <LineTrendChart
        data={data}
        xKey="month"
        lines={[{ dataKey: "total", color: "#154d78", label: "Members" }]}
      />
    </SectionCard>
  );
}