import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import EmptyState from "../../../components/ui/EmptyState";

/**
 * AssignMemberDrawer
 *
 * Department Admin's "Add Member" flow — per the spec, this does
 * NOT show every member immediately. Default (no search) view shows
 * only members not currently in ANY department, since those are the
 * most likely candidates. Typing a search expands to all members
 * (excluding ones already in this specific department), so an admin
 * can find someone already serving elsewhere and add this
 * department alongside their existing ones — never replacing them.
 *
 * Props:
 * - isOpen, onClose
 * - departmentName (string)  the Department Admin's scope
 * - members        (array)   the FULL member list (unscoped — this
 *                             needs to see people outside the
 *                             department to be able to add them)
 * - onAssign       (fn)      (member) => void
 */
export default function AssignMemberDrawer({ isOpen, onClose, departmentName, members, onAssign }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const alreadyInDept = (m) => m.departments.includes(departmentName);

    if (!q) {
      return members.filter((m) => m.departments.length === 0);
    }
    return members
      .filter((m) => !alreadyInDept(m))
      .filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q));
  }, [members, query, departmentName]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Member to ${departmentName}`}
      widthClass="md:max-w-md"
    >
      <div className="flex h-full flex-col">
        <div className="shrink-0 p-5 pb-0">
          <Input
            icon={Search}
            placeholder="Search all members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!query && (
            <p className="mt-2 text-xs text-gray-400">
              Showing members not currently in any department. Search to find someone already
              serving elsewhere.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {results.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No members found"
              description={
                query ? "Try a different search." : "Everyone is already assigned somewhere."
              }
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {results.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {m.departments.length > 0
                        ? `Currently in: ${m.departments.join(", ")}`
                        : "Not in any department yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAssign(m)}
                    className="shrink-0 rounded-lg border border-[#154d78]/30 bg-[#154d78]/5 px-3 py-1.5 text-xs font-medium text-[#154d78] hover:bg-[#154d78]/10"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}
