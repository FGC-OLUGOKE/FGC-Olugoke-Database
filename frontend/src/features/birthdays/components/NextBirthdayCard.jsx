import SectionCard from "../../../components/ui/SectionCard";
import Badge from "../../../components/ui/Badge";

export default function NextBirthdayCard({ entry, onSelect }) {
  if (!entry) return null;
  const { member, birthday } = entry;
  const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase();
  const relative =
    birthday.daysAway === 0 ? "Today" : birthday.daysAway === 1 ? "Tomorrow" : `In ${birthday.daysAway} days`;

  return (
    <SectionCard title="Next Birthday">
      <button
        type="button"
        onClick={() => onSelect(member)}
        className="flex w-full flex-col items-center gap-4 rounded-xl p-2 text-center transition-colors hover:bg-gray-50 sm:flex-row sm:text-left"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10 text-xl font-semibold text-[#154d78]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-gray-900">
            {member.firstName} {member.lastName}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {birthday.next.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {" · "}Turning {birthday.turningAge}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {member.category} · {member.department}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
          <Badge tone={member.status === "Active" ? "success" : "neutral"}>{member.status}</Badge>
          <span className="text-sm font-medium text-[#154d78]">{relative}</span>
        </div>
      </button>
    </SectionCard>
  );
}
