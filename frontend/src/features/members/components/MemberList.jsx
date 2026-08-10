import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Inbox } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import DropdownMenu, { DropdownMenuItem } from "../../../components/ui/DropdownMenu";
import MemberCard from "./MemberCard";

const PAGE_SIZE = 5;

/**
 * MemberList
 *
 * Renders the member table on desktop (md: and above) and member
 * cards on mobile. Purely presentational + client-side pagination —
 * `members` is expected to already be filtered/sorted by the parent
 * (MembersPage). View/Edit/Delete are UI hooks only; wiring them to
 * real drawer/form/API behavior happens where these are used.
 *
 * Props:
 * - members  (array)   already-filtered list to display
 * - onView   (fn)      (member) => void
 * - onEdit   (fn)      (member) => void
 * - onDelete (fn)      (member) => void
 */
export default function MemberList({ members = [], onView, onEdit, onDelete }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return members.slice(start, start + PAGE_SIZE);
  }, [members, currentPage]);

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Inbox className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">No members found</p>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Member</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageMembers.map((member) => {
              const initials = `${member.firstName[0] ?? ""}${
                member.lastName[0] ?? ""
              }`.toUpperCase();

              return (
                <tr key={member.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10 text-xs font-semibold text-[#154d78]">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {member.title} {member.firstName} {member.lastName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{member.department}</td>
                  <td className="px-5 py-3 text-gray-700">{member.category}</td>
                  <td className="px-5 py-3">
                    <Badge tone={member.status === "Active" ? "active" : "inactive"}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {new Date(member.dateJoined).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
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
                            icon={Eye}
                            label="View Profile"
                            onClick={() => {
                              onView?.(member);
                              close();
                            }}
                          />
                          <DropdownMenuItem
                            icon={Pencil}
                            label="Edit Member"
                            onClick={() => {
                              onEdit?.(member);
                              close();
                            }}
                          />
                          <DropdownMenuItem
                            icon={Trash2}
                            label="Delete Member"
                            variant="danger"
                            onClick={() => {
                              onDelete?.(member);
                              close();
                            }}
                          />
                        </>
                      )}
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {pageMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}