import { Pencil, Trash2, UserMinus } from "lucide-react";
import Drawer from "../../../components/ui/Drawer";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Avatar from "../../../components/ui/Avatar";

/**
 * MemberDetailsDrawer
 *
 * Right-side profile drawer (full-width on mobile), opened by
 * clicking a member anywhere in the app. Edit/Delete/Remove-from-
 * Department all live in a sticky footer at the bottom now — there's
 * no separate Manage menu anymore; this drawer is the single place
 * those actions happen from, reached by clicking the member first.
 *
 * Each action is independently optional — pass only the ones the
 * current user's role is allowed to perform (see MembersPage.jsx),
 * and the corresponding button simply doesn't render.
 *
 * Props:
 * - member                 (object|null)
 * - isOpen                 (bool)
 * - onClose                (fn)
 * - onEdit                 (fn, optional)  (member) => void
 * - onDelete               (fn, optional)  (member) => void
 * - onRemoveFromDepartment (fn, optional)  (member) => void
 */
export default function MemberDetailsDrawer({
  member,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onRemoveFromDepartment,
}) {
  if (!member) return null;

  const formattedDate = member.dateJoined
    ? new Date(member.dateJoined).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // const hasActions = Boolean(onEdit || onDelete || onRemoveFromDepartment);

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* Profile header */}
          <div className="flex flex-col items-center gap-3 border-b border-gray-100 px-5 py-6 text-center">
            <Avatar
              firstName={member.firstName}
              lastName={member.lastName}
              photoUrl={member.photoUrl}
              className="h-20 w-20 text-2xl"
            />
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {member.title} {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {member.departments.join(", ") || "Not Assigned"}
              </p>
            </div>
            <Badge tone={member.status === "Active" ? "success" : "neutral"}>
              {member.status}
            </Badge>
          </div>

          <Section title="Personal Information">
            <Field label="Gender" value={member.gender} />
            <Field label="Category" value={member.category} />
            <Field label="Marital Status" value={member.maritalStatus} />
            <Field label="Occupation" value={member.occupation} />
          </Section>

          <Section title="Contact Information">
            <Field label="Email" value={member.email} />
            <Field label="Phone" value={member.phone} />
            <Field label="Address" value={member.address} />
          </Section>

          <Section title="Church Information">
            <Field label="Department" value={member.departments.join(", ")} />
            <Field label="Status" value={member.status} />
            <Field label="Date Joined" value={formattedDate} />
            <Field
              label="Membership ID"
              value={member.membershipId ?? `FSC-${String(member.id).padStart(4, "0")}`}
            />
          </Section>

          <Section title="Spiritual Information">
            <Field label="Baptized" value={member.baptized ? "Yes" : "No"} />
          </Section>
        </div>

        {/* {hasActions && ( */}
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-gray-100 bg-white px-5 py-4">
            {onEdit && (
              <Button variant="secondary" onClick={() => onEdit(member)} className="flex-1">
                <Pencil className="h-3.5 w-3.5" />
                Edit Member
              </Button>
            )}
            {/* {onDelete && ( */}
              <Button variant="danger" onClick={() => onDelete(member)} className="flex-1">
                <Trash2 className="h-3.5 w-3.5" />
                Delete Member
              </Button>
            {/* )} */}
            {/* {onRemoveFromDepartment && (
              <Button
                variant="danger"
                onClick={() => onRemoveFromDepartment(member)}
                className="flex-1"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Remove from Department
              </Button>
             )} */}
          </div>
        {/* )} */}
      </div>
    </Drawer>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4 last:border-b-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h3>
      <dl className="space-y-2.5">{children}</dl>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value || "—"}</dd>
    </div>
  );
}