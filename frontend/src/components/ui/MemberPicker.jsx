import { useMemo, useState } from "react";
import { Search, Check, X } from "lucide-react";
import DropdownMenu from "./DropdownMenu";
import Avatar from "./Avatar";

/**
 * MemberPicker
 *
 * A searchable "pick one member" control — built on the same portal
 * DropdownMenu used for Manage menus, just with a search input and
 * scrollable member list as its content instead of menu items. Not
 * department-specific by design; reusable anywhere the app needs to
 * assign a member to a role (event organizer, cell group leader,
 * etc. later).
 *
 * Stores/returns the member's full name as a plain string (matching
 * how `leader` is already stored on a department) rather than an id,
 * to avoid touching the existing data shape.
 *
 * Props:
 * - label        (string, optional)
 * - members      (array)   candidates to choose from — pass an
 *                          already-filtered list (e.g. only members
 *                          in this department)
 * - value        (string)  currently selected member's full name
 * - onChange     (fn)      (fullName) => void — called with "" to clear
 * - placeholder  (string)
 * - emptyMessage (string)  shown when `members` is empty or search matches nothing
 */
export default function MemberPicker({
  label,
  members = [],
  value,
  onChange,
  placeholder = "Select a member",
  emptyMessage = "No members found.",
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q));
  }, [members, query]);

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      )}
      <DropdownMenu
        width={280}
        trigger={
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
          >
            <span className={value ? "text-gray-900" : "text-gray-400"}>
              {value || placeholder}
            </span>
          </button>
        }
      >
        {(close) => (
          <div className="flex max-h-72 flex-col">
            <div className="relative shrink-0 border-b border-gray-100 p-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full rounded-md bg-transparent py-1 pl-6 pr-2 text-sm text-gray-700 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    close();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear selection
                </button>
              )}

              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-gray-400">{emptyMessage}</p>
              ) : (
                filtered.map((m) => {
                  const fullName = `${m.firstName} ${m.lastName}`;
                  const isSelected = fullName === value;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onChange(fullName);
                        close();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Avatar
                        firstName={m.firstName}
                        lastName={m.lastName}
                        photoUrl={m.photoUrl}
                        className="h-6 w-6 text-[10px]"
                      />
                      <span className="flex-1 truncate">{fullName}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#154d78]" strokeWidth={2} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DropdownMenu>
    </div>
  );
}
