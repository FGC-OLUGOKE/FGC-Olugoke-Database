import { Eye, Pencil, Phone, Mail, MoreHorizontal } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import DropdownMenu, { DropdownMenuItem } from "../../../components/ui/DropdownMenu";
import { useToast } from "../../../components/ui/ToastProvider";

/**
 * BirthdayCard
 *
 * Mobile (≤768px) equivalent of BirthdayListItem.
 */
export default function BirthdayCard({ member, birthday, onView, onEdit }) {
  const toast = useToast();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onView(member)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar
            firstName={member.firstName}
            lastName={member.lastName}
            photoUrl={member.photoUrl}
            className="h-11 w-11 text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {member.firstName} {member.lastName}
            </p>
            <p className="truncate text-xs text-gray-500">
              {birthday.next.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Turning{" "}
              {birthday.turningAge}
            </p>
          </div>
        </button>

        <DropdownMenu
          trigger={
            <button
              type="button"
              aria-label="Actions"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                  onView(member);
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
              {member.phone && (
                <DropdownMenuItem
                  icon={Phone}
                  label="Call"
                  onClick={() => {
                    toast.info(`Calling isn't available yet.`);
                    close();
                  }}
                />
              )}
              {member.email && (
                <DropdownMenuItem
                  icon={Mail}
                  label="Email"
                  onClick={() => {
                    toast.info(`Emailing isn't available yet.`);
                    close();
                  }}
                />
              )}
            </>
          )}
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {member.departments.map((d) => (
          <Badge key={d} tone="info">{d}</Badge>
        ))}
        <Badge tone="neutral">{member.category}</Badge>
        <Badge tone={member.status === "Active" ? "success" : "neutral"}>{member.status}</Badge>
      </div>
    </div>
  );
}