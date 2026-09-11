import { Phone, Calendar } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";

/**
 * MemberCard
 *
 * Mobile (≤768px) equivalent of a table row. The whole card is
 * clickable and opens the member's profile — no separate Manage
 * menu; Edit/Delete/Remove-from-Department live at the bottom of
 * that profile drawer instead.
 */
export default function MemberCard({ member, onView }) {
  return (
    <button
      type="button"
      onClick={() => onView?.(member)}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm active:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <Avatar
          firstName={member.firstName}
          lastName={member.lastName}
          photoUrl={member.photoUrl}
          className="h-11 w-11 text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {member.title} {member.firstName} {member.lastName}
          </p>
          <p className="truncate text-xs text-gray-500">{member.email}</p>
        </div>
        <Badge tone={member.status === "Active" ? "active" : "inactive"}>{member.status}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {member.departments.map((d) => (
          <Badge key={d} tone="info">
            {d}
          </Badge>
        ))}
        <Badge tone="neutral">{member.category}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          {member.phone || "Not provided"}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Joined {new Date(member.dateJoined).getFullYear()}
        </span>
      </div>
    </button>
  );
}