import SectionCard from "../../../components/ui/SectionCard";
import DonutChart from "../../../components/ui/DonutChart";

const GENDER_COLORS = {
  Male: "#154d78",
  Female: "#4a2969",
};

const GENDERS = ["Male", "Female"];

export default function GenderDistributionSection({ members }) {
  const total = members.length;

  const data = GENDERS.map((gender) => ({
    name: gender,
    value: members.filter((member) => member.gender === gender).length,
    color: GENDER_COLORS[gender],
  }));

  return (
    <SectionCard title="Gender Distribution">
      <div className="flex flex-col items-center">
        <DonutChart
          data={data}
          centerValue={total}
          centerLabel="Members"
          height={220}
        />

        {/* Legend */}
        <div className="mt-4 flex w-full justify-center gap-6">
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
                  className="h-2.5 w-2.5 rounded-full"
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