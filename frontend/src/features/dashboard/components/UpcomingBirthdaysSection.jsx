import { useNavigate } from "react-router-dom";
import { Cake } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";
import Avatar from "../../../components/ui/Avatar";
import { getNextBirthday } from "../../../lib/birthdayUtils";

export default function UpcomingBirthdaysSection({ members }) {
  const navigate = useNavigate();

  const upcoming = members
    .map((m) => ({ member: m, birthday: getNextBirthday(m.dateOfBirth) }))
    .filter((entry) => entry.birthday)
    .sort((a, b) => a.birthday.daysAway - b.birthday.daysAway)
    .slice(0, 5);

  return (
    <SectionCard
      title="Upcoming Birthdays"
      actionLabel="View All Birthdays"
      onAction={() => navigate("/birthdays")}
    >
      {upcoming.length === 0 ? (
        <EmptyState icon={Cake} title="No upcoming birthdays" description="Check back later." />
      ) : (
        <ul className="divide-y divide-gray-100">
          {upcoming.map(({ member, birthday }) => {
            return (
              <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar
                  firstName={member.firstName}
                  lastName={member.lastName}
                  photoUrl={member.photoUrl}
                  className="h-10 w-10 text-xs"
                  toneClassName="bg-[#d6b447]/15 text-[#7a5f24]"
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
                <span className="shrink-0 text-xs font-medium text-gray-400">
                  {birthday.daysAway === 0 ? "Today" : `${birthday.daysAway}d`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
