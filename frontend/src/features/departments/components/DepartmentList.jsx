import { Pencil, Trash2, UserCircle2, Building2 } from "lucide-react";
import DropdownMenu, { DropdownMenuItem } from "../../../components/ui/DropdownMenu";
import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";

/**
 * DepartmentList
 *
 * Card grid rather than a table — departments are few in number and
 * each has meaningfully different content (name, leader, member
 * count), so a table would mostly be empty cells. Same design
 * language as everywhere else (rounded-xl card, Manage dropdown,
 * Badge), just a different layout suited to this data shape.
 *
 * Props:
 * - departments (array)  each expected to have name/description/
 *                        leader/memberCount
 * - onEdit      (fn)     (department) => void
 * - onDelete    (fn)     (department) => void
 */
export default function DepartmentList({ departments = [], onEdit, onDelete }) {
  if (departments.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No departments found"
        description="Try a different search, or add a new department."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => (
        <div
          key={dept.id}
          className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4a2969]/10">
              <Building2 className="h-5 w-5 text-[#4a2969]" strokeWidth={2} />
            </div>

            <DropdownMenu
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Manage
                  <span className="text-gray-400">▾</span>
                </button>
              }
            >
              {(close) => (
                <>
                  <DropdownMenuItem
                    icon={Pencil}
                    label="Edit Department"
                    onClick={() => {
                      onEdit?.(dept);
                      close();
                    }}
                  />
                  <DropdownMenuItem
                    icon={Trash2}
                    label="Delete Department"
                    variant="danger"
                    onClick={() => {
                      onDelete?.(dept);
                      close();
                    }}
                  />
                </>
              )}
            </DropdownMenu>
          </div>

          <h3 className="mt-3 text-base font-semibold text-gray-900">
            {dept.name}
          </h3>
          {dept.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {dept.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <UserCircle2 className="h-4 w-4" />
              {dept.leader || "No leader assigned"}
            </span>
            <Badge tone="info">
              {dept.memberCount} member{dept.memberCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}