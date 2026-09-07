import SectionCard from "../../../components/ui/SectionCard";
import DonutChart from "../../../components/ui/DonutChart";

const STATUS_COLORS = {
  Active: "#154d78",
  Inactive: "#9e263b",
};

const STATUSES = ["Active", "Inactive"];

export default function MemberStatusSection({ members }) {
  const total = members.length;

  const data = STATUSES.map((status) => ({
    name: status,
    value: members.filter((member) => member.status === status).length,
    color: STATUS_COLORS[status],
  }));

  return (
    <SectionCard title="Member Status">
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