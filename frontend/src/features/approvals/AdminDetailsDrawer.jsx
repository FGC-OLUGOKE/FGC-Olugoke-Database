import { Pencil, UserX, X } from "lucide-react";

import Drawer from "../../components/ui/Drawer";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";

/**
 * AdminDetailsDrawer
 *
 * Displays detailed information about an administrator.
 *
 * The Edit and Remove buttons are optional and should only be passed
 * for accounts that the current user is allowed to manage.
 *
 * Props:
 * - admin       (object|null)
 * - isOpen      (bool)
 * - onClose     (fn)
 * - onEdit      (fn, optional) (admin) => void
 * - onDelete    (fn, optional) (admin) => void
 */

export default function AdminDetailsDrawer({
  admin,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!admin) return null;

  const isSuperAdmin = admin.role === "super_admin";

  const roleLabel =
    admin.role === "category_admin"
      ? "Category Admin"
      : admin.role === "department_admin"
        ? "Departmental Admin"
        : admin.role === "managing_departments"
          ? "Managing Departments"
          : admin.role === "pastorate"
            ? "Pastorate"
            : "Super Admin";

  const status = admin.status || "Active";

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* Close button */}
          <div className="flex justify-end px-5 pt-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin details"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col items-center gap-3 border-b border-gray-100 px-5 pb-6 text-center">
            <Avatar
              firstName={admin.name?.split(" ")[0] || ""}
              lastName={admin.name?.split(" ").slice(1).join(" ") || ""}
              photoUrl={admin.photoUrl}
              className="h-20 w-20 text-2xl"
            />

            <div>
              <p className="text-lg font-semibold text-gray-900">
                {admin.name}
              </p>

              <p className="text-sm text-gray-500">{roleLabel}</p>
            </div>

            <Badge tone={status === "Active" ? "active" : "inactive"}>
              {status}
            </Badge>
          </div>

          {/* Account Information */}
          <Section title="Account Information">
            <Field label="Full Name" value={admin.name} />
            <Field label="Email" value={admin.email} />
            <Field label="Role" value={roleLabel} />
            <Field
              label="Scope"
              value={
                Array.isArray(admin.scope)
                  ? admin.scope.join(", ")
                  : admin.scope
              }
            />
            <Field label="Status" value={status} />
          </Section>

          {/* Access Information */}
          <Section title="Access Information">
            <Field
              label="Access Level"
              value={isSuperAdmin ? "Full System Access" : roleLabel}
            />

            <Field
              label="Assigned Scope"
              value={
                isSuperAdmin
                  ? "Entire Church Database"
                  : Array.isArray(admin.scope)
                    ? admin.scope.join(", ")
                    : admin.scope
              }
            />
          </Section>

          {/* Account Dates */}
          <Section title="Account Activity">
            <Field
              label="Account Created"
              value={
                admin.createdAt
                  ? new Date(admin.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null
              }
            />

            <Field
              label="Last Login"
              value={
                admin.lastLogin
                  ? new Date(admin.lastLogin).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null
              }
            />
          </Section>
        </div>

        {/* Actions */}
        {!isSuperAdmin && (onEdit || onDelete) && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-gray-100 bg-white px-5 py-4">
            {onEdit && (
              <Button
                variant="secondary"
                onClick={() => onEdit(admin)}
                className="flex-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Admin
              </Button>
            )}

            {onDelete && (
              <Button
                variant="danger"
                onClick={() => onDelete(admin)}
                className="flex-1"
              >
                <UserX className="h-3.5 w-3.5" />
                Remove Access
              </Button>
            )}
          </div>
        )}
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
