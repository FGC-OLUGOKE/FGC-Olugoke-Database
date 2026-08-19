import { useNavigate } from "react-router-dom";
import { Cake } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import Avatar from "../../../components/ui/Avatar";
import EmptyState from "../../../components/ui/EmptyState";

/**
 * BirthdayReport
 *
 * Deliberately compact — this reports on birthdays, it doesn't
 * duplicate the full Upcoming Birthdays page (calendar, filters,
 * detail modal). "View All Birthdays" is where the full experience
 * lives.
 */
export default function BirthdayReport({ stats }) {
  const navigate = useNavigate();

  return (
    <SectionCard title="Birthday Report" actionLabel="View All Birthdays" onAction={() => navigate("/birthdays")}>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-lg font-semibold text-gray-900">{stats.thisMonthCount}</p>
          <p className="text-xs text-gray-500">This Month</p>
        </div>
        {stats.byCategory.map((c) => (
          <div key={c.category} className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-semibold text-gray-900">{c.count}</p>
            <p className="text-xs text-gray-500">{c.category}</p>
          </div>
        ))}
      </div>

      {stats.upcoming.length === 0 ? (
        <EmptyState icon={Cake} title="No birthday records available" description="There are no upcoming birthdays to show." />
      ) : (
        <ul className="divide-y divide-gray-100">
          {stats.upcoming.map(({ member, birthday }) => (
            <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar
                firstName={member.firstName}
                lastName={member.lastName}
                photoUrl={member.photoUrl}
                className="h-9 w-9 text-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {member.firstName} {member.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {birthday.next.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Turning{" "}
                  {birthday.turningAge}
                </p>
              </div>
              <span className="text-xs text-gray-400">{member.category}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}