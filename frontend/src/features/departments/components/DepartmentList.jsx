import { Pencil, Trash2, Users } from "lucide-react";

const DepartmentList = ({
  departments,
  onEdit,
  onDelete,
}) => {
  if (!departments.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Users size={25} />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-900">
          No departments found
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Try changing your search or create a new department.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop / Tablet */}

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Department
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Leader
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Members
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {departments.map((department) => (
              <tr
                key={department.id}
                className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50"
              >
                {/* Department */}

                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#154d78]/10 font-bold text-[#154d78]">
                      {department.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {department.name}
                      </p>

                      {department.description && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                          {department.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Leader */}

                <td className="px-6 py-5">
                  <span className="text-sm text-slate-600">
                    {department.leader || "Not assigned"}
                  </span>
                </td>

                {/* Members */}

                <td className="px-6 py-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                    <Users size={14} className="text-slate-500" />

                    <span className="text-sm font-semibold text-slate-700">
                      {department.memberCount ?? 0}
                    </span>
                  </div>
                </td>

                {/* Actions */}

                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(department)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-[#154d78]"
                      title="Edit department"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(department)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete department"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}

      <div className="divide-y divide-slate-100 md:hidden">
        {departments.map((department) => (
          <div
            key={department.id}
            className="p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#154d78]/10 font-bold text-[#154d78]">
                {department.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                      {department.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {department.leader || "No leader assigned"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(department)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-[#154d78]"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(department)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {department.description && (
                  <p className="mt-3 text-sm leading-5 text-slate-500">
                    {department.description}
                  </p>
                )}

                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    <Users size={13} />

                    {department.memberCount ?? 0} Members
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentList;