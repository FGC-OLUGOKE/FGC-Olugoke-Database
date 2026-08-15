import { useMemo } from "react";
import { Cake } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState";
import BirthdayListItem from "./BirthdayListItem";
import BirthdayCard from "./BirthdayCard";

const GROUP_ORDER = ["Today", "Tomorrow", "This Week", "Next Week", "Later This Month", "Upcoming"];

function getGroup(nextDate, today) {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const daysAway = Math.round((nextDate - startOfToday) / 86400000);

  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";

  const dow = startOfToday.getDay();
  const endOfThisWeek = new Date(startOfToday);
  endOfThisWeek.setDate(startOfToday.getDate() + (6 - dow));

  const startOfNextWeek = new Date(endOfThisWeek);
  startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

  const endOfThisMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0);

  if (nextDate <= endOfThisWeek) return "This Week";
  if (nextDate <= endOfNextWeek) return "Next Week";
  if (nextDate <= endOfThisMonth) return "Later This Month";
  return "Upcoming";
}

/**
 * BirthdayList
 *
 * Main chronological list. Grouping (Today/Tomorrow/This Week/...)
 * only makes sense when sorted chronologically, so it's only applied
 * when `groupByTime` is true (i.e. sort === "nearest" or "furthest"
 * in BirthdaysPage) — other sorts (Name A-Z, Youngest First, etc.)
 * render as a flat list instead, since group headers wouldn't be
 * meaningful there.
 */
export default function BirthdayList({ entries, groupByTime, onView, onEdit }) {
  const groups = useMemo(() => {
    if (!groupByTime) return null;
    const today = new Date();
    const map = new Map();
    entries.forEach((entry) => {
      const group = getGroup(entry.birthday.next, today);
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(entry);
    });
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g) }));
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

  const sections = groups ?? [{ label: null, items: entries }];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.label ?? "flat"}>
          {section.label && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {section.label}
            </h3>
          )}
          <div className="hidden flex-col gap-2 md:flex">
            {section.items.map(({ member, birthday }) => (
              <BirthdayListItem key={member.id} member={member} birthday={birthday} onView={onView} onEdit={onEdit} />
            ))}
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {section.items.map(({ member, birthday }) => (
              <BirthdayCard key={member.id} member={member} birthday={birthday} onView={onView} onEdit={onEdit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
