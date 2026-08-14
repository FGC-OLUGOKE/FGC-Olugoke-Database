import SectionCard from "../../../components/ui/SectionCard";
import DonutChart from "../../../components/ui/DonutChart";

const GENDER_COLORS = { Male: "#154d78", Female: "#4a2969" };

export default function GenderDistributionSection({ members }) {
  const total = members.length;
  const data = ["Male", "Female"].map((name) => ({
    name,
    value: members.filter((m) => m.gender === name).length,
    color: GENDER_COLORS[name],
  }));

  return (
    <SectionCard title="Gender Distribution">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <DonutChart data={data} centerValue={total} centerLabel="Members" height={180} />
        <ul className="w-full space-y-2">
          {data.map((item) => {
            const pct = total === 0 ? 0 : Math.round((item.value / total) * 100);
            return (
              <li key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
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
    </SectionCard>
  );
}