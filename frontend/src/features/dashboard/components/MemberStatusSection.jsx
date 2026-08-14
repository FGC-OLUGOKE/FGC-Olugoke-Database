import SectionCard from "../../../components/ui/SectionCard";

const STATUS_COLORS = { Active: "#154d78", Inactive: "#9e263b" };

// Extensible on purpose: add another status string to this array
// later (e.g. "Visiting", "Transferred") and it renders automatically —
// no other changes needed.
const STATUSES = ["Active", "Inactive"];

export default function MemberStatusSection({ members }) {
  const total = members.length;
  const data = STATUSES.map((status) => ({
    status,
    count: members.filter((m) => m.status === status).length,
  }));

  return (
    <SectionCard title="Member Status">
      <ul className="space-y-4">
        {data.map((item) => {
          const pct = total === 0 ? 0 : Math.round((item.count / total) * 100);
          return (
            <li key={item.status}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.status}</span>
                <span className="text-gray-500">
                  {item.count} · {pct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[item.status] ?? "#9ca3af" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}