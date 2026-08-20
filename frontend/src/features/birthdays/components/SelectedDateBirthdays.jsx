import { CalendarDays } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";

export default function SelectedDateBirthdays({ date, members, onSelect, onClear }) {
  if (!date) return null;
  const label = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <SectionCard title={`Birthdays on ${label}`} actionLabel="Clear" onAction={onClear}>
      {members.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No birthdays on this date"
          description="Select another date on the calendar."
        />
      ) : (
        <ul className="divide-y divide-gray-100">
          {members.map((m) => {
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSelect(m)}
                  className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0 hover:bg-gray-50"
                >
                  <Avatar
                    firstName={m.firstName}
                    lastName={m.lastName}
                    photoUrl={m.photoUrl}
                    className="h-9 w-9 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {m.category} · {m.departments.join(", ")}
                    </p>
                  </div>
                  <Badge tone={m.status === "Active" ? "success" : "neutral"}>{m.status}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}