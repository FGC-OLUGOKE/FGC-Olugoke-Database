import { useMemo } from "react";
import { Cake } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";
import BirthdayListItem from "./BirthdayListItem";
import BirthdayCard from "./BirthdayCard";

const GROUP_ORDER = [
  "Later This Week",
  "Next Week",
  "Later This Month",
];

function isSameMonth(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

function getGroup(nextDate, today) {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const birthdayDate = new Date(nextDate);
  birthdayDate.setHours(0, 0, 0, 0);

  // Don't include birthdays that have already happened today.
  if (birthdayDate <= startOfToday) {
    return null;
  }

  const dayOfWeek = startOfToday.getDay();

  // Sunday = 0, Monday = 1 ... Saturday = 6
  const endOfThisWeek = new Date(startOfToday);
  endOfThisWeek.setDate(
    startOfToday.getDate() + (6 - dayOfWeek)
  );
  endOfThisWeek.setHours(23, 59, 59, 999);

  // Start of next week
  const startOfNextWeek = new Date(endOfThisWeek);
  startOfNextWeek.setDate(
    endOfThisWeek.getDate() + 1
  );
  startOfNextWeek.setHours(0, 0, 0, 0);

  // End of next week
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(
    startOfNextWeek.getDate() + 6
  );
  endOfNextWeek.setHours(23, 59, 59, 999);

  // -------------------------------
  // LATER THIS WEEK
  // -------------------------------

  if (birthdayDate <= endOfThisWeek) {
    return "Later This Week";
  }

  // -------------------------------
  // NEXT WEEK
  // -------------------------------

  if (birthdayDate <= endOfNextWeek) {
    return "Next Week";
  }

  // -------------------------------
  // LATER THIS MONTH
  // -------------------------------

  if (isSameMonth(birthdayDate, startOfToday)) {
    return "Later This Month";
  }

  // Birthdays belonging to another month
  // don't belong in these three sections.
  return null;
}

export default function BirthdayList({
  entries,
  groupByTime,
  onView,
  onEdit,
}) {
  const groups = useMemo(() => {
    if (!groupByTime) return null;

    const today = new Date();
    const map = new Map();

    entries.forEach((entry) => {
      const group = getGroup(entry.birthday.next, today);

      // Ignore birthdays outside the three requested groups.
      if (!group) return;

      if (!map.has(group)) {
        map.set(group, []);
      }

      map.get(group).push(entry);
    });

    return GROUP_ORDER
      .filter((group) => map.has(group))
      .map((group) => ({
        label: group,
        items: map.get(group),
      }));
  }, [entries, groupByTime]);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Cake}
        title="No upcoming birthdays"
        description="There are no upcoming birthdays matching your current filters."
      />
    );
  }

  const sections =
    groups ?? [{ label: null, items: entries }];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label ?? "flat"}>
          {section.label && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {section.label}
            </h3>
          )}

          {/* Desktop */}
          <div className="hidden flex-col gap-2 md:flex">
            {section.items.map(({ member, birthday }) => (
              <BirthdayListItem
                key={member.id}
                member={member}
                birthday={birthday}
                onView={onView}
                onEdit={onEdit}
              />
            ))}
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {section.items.map(({ member, birthday }) => (
              <BirthdayCard
                key={member.id}
                member={member}
                birthday={birthday}
                onView={onView}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}