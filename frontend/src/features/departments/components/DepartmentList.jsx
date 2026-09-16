import { ArrowUpRight, Building2, UserCircle2 } from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import Badge from "../../../components/ui/Badge";

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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {departments.map((dept) => (
        <button
          key={dept.id}
          type="button"
          onClick={() => onSelect?.(dept)}
          className="group relative flex min-h-[210px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#154d78]/20 hover:shadow-[0_12px_30px_rgba(21,77,120,0.10)] focus:outline-none focus:ring-2 focus:ring-[#154d78]/30"
        >
          {/* Top accent */}
          <div className="h-1 w-full bg-[#154d78]" />

          <div className="flex flex-1 flex-col p-5">
            {/* Header */}
            <div className="flex items-start justify-end">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-all duration-200 group-hover:border-[#154d78]/20 group-hover:bg-[#154d78] group-hover:text-white">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </div>
            </div>

            {/* Department info */}
            <div className="mt-3">
              <h3 className="truncate text-[17px] font-semibold tracking-tight text-gray-900">
                {dept.name}
              </h3>

              {dept.description ? (
                <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-gray-500">
                  {dept.description}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-gray-400">
                  No description available
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10">
                  <UserCircle2
                    className="h-4 w-4 text-[#154d78]"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Department Leader
                  </p>
                  <p className="truncate text-sm font-medium text-gray-700">
                    {dept.leader || "Not assigned"}
                  </p>
                </div>
              </div>

              <Badge tone="info">
                {dept.memberCount}{" "}
                {dept.memberCount === 1 ? "member" : "members"}
              </Badge>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
