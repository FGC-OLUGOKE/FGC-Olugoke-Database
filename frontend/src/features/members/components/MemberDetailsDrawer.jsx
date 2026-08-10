import { Pencil } from "lucide-react";
import Drawer from "../../../components/ui/Drawer";
import Badge from "../../../components/ui/Badge";

/**
 * MemberDetailsDrawer
 *
 * Right-side profile drawer (full-width on mobile) shown when an
 * admin picks "View Profile" from the Manage menu. Built on the
 * generic Drawer shell — this file only supplies the member-specific
 * content (profile header + the four info sections from the spec).
 *
 * Props:
 * - member  (object|null)  the member to show; drawer stays closed if null
 * - isOpen  (bool)
 * - onClose (fn)
 * - onEdit  (fn)  (member) => void — hooks into "Edit Member"
 */
export default function MemberDetailsDrawer({ member, isOpen, onClose, onEdit }) {
  if (!member) return null;

  const initials = `${member.firstName?.[0] ?? ""}${
    member.lastName?.[0] ?? ""
  }`.toUpperCase();

  const formattedDate = member.dateJoined
    ? new Date(member.dateJoined).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 border-b border-gray-100 px-5 py-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#154d78]/10 text-2xl font-semibold text-[#154d78]">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {member.title} {member.firstName} {member.lastName}
          </p>
          <p className="text-sm text-gray-500">{member.department}</p>
        </div>
        <Badge tone={member.status === "Active" ? "active" : "inactive"}>
          {member.status}
        </Badge>
        <button
          type="button"
          onClick={() => onEdit?.(member)}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Member
        </button>
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
        <Field label="Department" value={member.department} />
        <Field label="Status" value={member.status} />
        <Field label="Date Joined" value={formattedDate} />
      </Section>

      <Section title="Spiritual Information">
        <Field label="Baptized" value={member.baptized ? "Yes" : "No"} />
        <Field label="Worker" value={member.worker ? "Yes" : "No"} />
      </Section>
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