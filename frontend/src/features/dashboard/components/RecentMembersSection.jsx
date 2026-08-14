import { useNavigate } from "react-router-dom";
import SectionCard from "../../../components/ui/SectionCard";
import Badge from "../../../components/ui/Badge";

export default function RecentMembersSection({ members }) {
  const navigate = useNavigate();
  const recent = [...members]
    .sort((a, b) => new Date(b.dateJoined) - new Date(a.dateJoined))
    .slice(0, 5);

  return (
    <SectionCard
      title="Recently Added Members"
      actionLabel="View All Members"
      onAction={() => navigate("/members")}
    >
      <ul className="divide-y divide-gray-100">
        {recent.map((m) => {
          const initials = `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
          return (
            <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10 text-xs font-semibold text-[#154d78]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {m.title} {m.firstName} {m.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {m.category} · {m.department}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={m.status === "Active" ? "active" : "inactive"}>{m.status}</Badge>
                <span className="text-[11px] text-gray-400">
                  {new Date(m.dateJoined).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}