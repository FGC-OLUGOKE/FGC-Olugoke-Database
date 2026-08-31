import { Building2, UserCircle2 } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";

/**
 * DepartmentList
 *
 * Department cards are clickable.
 * Clicking a department opens the department management drawer.
 *
 * Props:
 * - departments (array)
 * - onSelect (fn) => void
 */
export default function DepartmentList({
  departments = [],
  onSelect,
}) {
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
        <button
          key={dept.id}
          type="button"
          onClick={() => onSelect?.(dept)}
          className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#154d78]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#154d78]/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4a2969]/10">
              <Building2
                className="h-5 w-5 text-[#4a2969]"
                strokeWidth={2}
              />
            </div>

            <span className="text-xs font-medium text-gray-400 transition group-hover:text-[#154d78]">
              View details
            </span>
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
            <span className="flex min-w-0 items-center gap-1.5 text-gray-500">
              <UserCircle2 className="h-4 w-4 shrink-0" />

              <span className="truncate">
                {dept.leader || "No leader assigned"}
              </span>
            </span>

            <Badge tone="info">
              {dept.memberCount} member
              {dept.memberCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </button>
      ))}
    </div>
  );
}