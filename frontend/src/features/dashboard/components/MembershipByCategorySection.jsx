import SectionCard from "../../../components/ui/SectionCard";
import DonutChart from "../../../components/ui/DonutChart";

const CATEGORY_COLORS = {
  Children: "#d6b447",
  Teenager: "#4a2969",
  Youth: "#154d78",
  Adult: "#9e263b",
};

const CATEGORIES = ["Children", "Teenager", "Youth", "Adult"];

export default function MembershipByCategorySection({ members }) {
  const total = members.length;

  const data = CATEGORIES.map((category) => ({
    name: category,
    value: members.filter((member) => member.category === category).length,
    color: CATEGORY_COLORS[category],
  }));

  return (
    <SectionCard title="Membership by Category">
      <div className="flex flex-col items-center">
        <DonutChart
          data={data}
          centerValue={total}
          centerLabel="Members"
          height={220}
        />

        {/* Legend */}
        <div className="mt-4 flex w-full flex-wrap justify-center gap-x-6 gap-y-2">
          {data.map((item) => {
            const percentage =
              total === 0
                ? 0
                : Math.round((item.value / total) * 100);

            return (
              <div
                key={item.name}
                className="flex items-center gap-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                <div className="text-xs">
                  <span className="font-medium text-gray-700">
                    {item.name}
                  </span>

                  <span className="ml-1 text-gray-500">
                    {item.value} · {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}