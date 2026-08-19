import { Eye, Pencil, Phone, Mail, MoreHorizontal } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import DropdownMenu, { DropdownMenuItem } from "../../../components/ui/DropdownMenu";
import { useToast } from "../../../components/ui/ToastProvider";

/**
 * BirthdayListItem
 *
 * Desktop (md: and up) row. Call/Email actions only render when the
 * member actually has that contact info — and since real
 * communication isn't implemented yet, they show a toast placeholder
 * instead of silently doing nothing.
 */
export default function BirthdayListItem({ member, birthday, onView, onEdit }) {
  const toast = useToast();

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-3 hover:bg-gray-50/60">
      <Avatar
        firstName={member.firstName}
        lastName={member.lastName}
        photoUrl={member.photoUrl}
        className="h-11 w-11 text-sm"
      />

      <button type="button" onClick={() => onView(member)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-gray-900">
          {member.title} {member.firstName} {member.lastName}
        </p>
        <p className="truncate text-xs text-gray-500">
          {member.category} · {member.departments.join(", ")}
        </p>
      </button>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-medium text-gray-900">
          {birthday.next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </p>
        <p className="text-xs text-gray-500">Turning {birthday.turningAge}</p>
      </div>

      <Badge tone={member.status === "Active" ? "success" : "neutral"}>{member.status}</Badge>

      <DropdownMenu
        trigger={
          <button
            type="button"
            aria-label="Actions"
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
                onView(member);
                close();
              }}
            />
            <DropdownMenuItem
              icon={Pencil}
              label="Edit Member"
              onClick={() => {
                onEdit(member);
                close();
              }}
            />
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
  );
}
