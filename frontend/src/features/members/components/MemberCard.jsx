import { Phone, Calendar, MoreHorizontal, Eye, Pencil, Trash2, UserMinus } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import DropdownMenu, { DropdownMenuItem } from "../../../components/ui/DropdownMenu";

/**
 * MemberCard
 *
 * Mobile (≤768px) equivalent of a table row. Shown instead of
 * MemberList's <table> below the md breakpoint.
 */
export default function MemberCard({ member, onView, onEdit, onDelete, onRemoveFromDepartment }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            firstName={member.firstName}
            lastName={member.lastName}
            photoUrl={member.photoUrl}
            className="h-11 w-11 text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {member.title} {member.firstName} {member.lastName}
            </p>
            <p className="truncate text-xs text-gray-500">{member.email}</p>
          </div>
        </div>

        <DropdownMenu
          trigger={
            <button
              type="button"
              aria-label="Manage member"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
        >
          {(close) => (
            <>
              <DropdownMenuItem
                icon={Eye}
                label="View Profile"
                onClick={() => {
                  onView?.(member);
                  close();
                }}
              />
              {onEdit && (
                <DropdownMenuItem
                  icon={Pencil}
                  label="Edit Member"
                  onClick={() => {
                    onEdit(member);
                    close();
                  }}
                />
              )}
              {onDelete && (
                <DropdownMenuItem
                  icon={Trash2}
                  label="Delete Member"
                  variant="danger"
                  onClick={() => {
                    onDelete(member);
                    close();
                  }}
                />
              )}
              {onRemoveFromDepartment && (
                <DropdownMenuItem
                  icon={UserMinus}
                  label="Remove from Department"
                  variant="danger"
                  onClick={() => {
                    onRemoveFromDepartment(member);
                    close();
                  }}
                />
              )}
            </>
          )}
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {member.departments.map((d) => (
          <Badge key={d} tone="info">{d}</Badge>
        ))}
        <Badge tone="neutral">{member.category}</Badge>
        <Badge tone={member.status === "Active" ? "success" : "neutral"}>
          {member.status}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          {member.phone}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Joined {new Date(member.dateJoined).getFullYear()}
        </span>
      </div>
    </div>
  );
}
