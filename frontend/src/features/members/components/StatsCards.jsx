import { useMemo } from "react";
import { Users, UserCheck, Building2, UserX } from "lucide-react";

/**
 * StatsCards
 *
 * Summary row shown at the top of the Members page.
 * Purely derived from the `members` array passed in — no API calls,
 * no fake persistence. Wire `members` up to real data once the
 * backend is connected.
 *
 * Props:
 * - members (array) - list of member objects, each expected to have
 *   at least `status` and `department` fields.
 */
export default function StatsCards({ members = [] }) {
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "Active").length;
    const inactive = total - active;
    const departments = new Set(
      members.flatMap((m) => m.departments)
    ).size;

    return [
      {
        label: "Total Members",
        value: total,
        icon: Users,
        accent: "#154d78", // primary blue
      },
      {
        label: "Active Members",
        value: active,
        icon: UserCheck,
        accent: "#4a2969", // purple
      },
      {
        label: "Departments",
        value: departments,
        icon: Building2,
        accent: "#d6b447", // gold — sparing use, ok here as a distinct 3rd stat
      },
      {
        label: "Inactive Members",
        value: inactive,
        icon: UserX,
        accent: "#9e263b", // red — draws attention, appropriate for inactive
      },
    ];
  }, [members]);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, accent }) => (
        <div
          key={label}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 md:text-sm">
              {label}
            </p>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accent}1A` }} // ~10% tint
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
