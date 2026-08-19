import SectionCard from "../../../components/ui/SectionCard";
import DonutChart from "../../../components/ui/DonutChart";

/**
 * Categories here are exactly "Children"/"Teenager"/"Youth"/"Adult"
 * (singular), matching the app-wide terminology rename — this
 * consumes categoryBreakdown computed in ReportsPage.jsx, so it
 * doesn't hardcode category names itself.
 */
export default function MembershipDemographicsSection({ categoryBreakdown, genderBreakdown, total }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SectionCard title="Membership by Category">
        <Legend data={categoryBreakdown} total={total} />
      </SectionCard>
      <SectionCard title="Gender Distribution">
        <Legend data={genderBreakdown} total={total} />
      </SectionCard>
    </div>
  );
}

function Legend({ data, total }) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <DonutChart data={data} centerValue={total} centerLabel="Members" height={180} />
      <ul className="w-full space-y-2">
        {data.map((item) => {
          const pct = total === 0 ? 0 : Math.round((item.value / total) * 100);
          return (
            <li key={item.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="text-gray-500">
                {item.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}