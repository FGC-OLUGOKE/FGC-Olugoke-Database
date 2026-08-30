import { Cake } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";

export default function TodaysBirthdays({ entries, onSelect }) {
  return (
    <SectionCard title="Today's Birthdays">
      {entries.length === 0 ? (
        <EmptyState
          icon={Cake}
          title="No birthdays today"
          description="There are no members celebrating their birthday today."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ member, birthday }) => {
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelect(member)}
                className="flex items-center gap-3 rounded-lg border border-[#d6b447]/30 bg-[#d6b447]/5 p-3 text-left transition-colors hover:bg-[#d6b447]/10"
              >
                <Avatar
                  firstName={member.firstName}
                  lastName={member.lastName}
                  photoUrl={member.photoUrl}
                  className="h-11 w-11 text-sm"
                  toneClassName="bg-[#d6b447]/20 text-[#7a5f24]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    Turning {birthday.turningAge} · {member.category}
                  </p>
                </div>
                <Badge tone={member.status === "Active" ? "active" : "inactive"}>{member.status}</Badge>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
