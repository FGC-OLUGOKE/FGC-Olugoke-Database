import { useMemo, useState } from "react";

import { Inbox } from "lucide-react";

import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import EmptyState from "../../../components/ui/EmptyState";
import MemberCard from "./MemberCard";

const PAGE_SIZE = 5;

/**
 * MemberList
 *
 * Renders the member table on desktop (md: and above) and member
 * cards on mobile. Purely presentational + client-side pagination.
 *
 * The table has a minimum width and horizontal scrolling so that
 * columns don't become squashed on smaller laptop/tablet screens.
 *
 * Props:
 * - members (array)  already-filtered list to display
 * - onView (fn)      (member) => void
 */

export default function MemberList({ members = [], onView }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(members.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const pageMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return members.slice(start, start + PAGE_SIZE);
  }, [members, currentPage]);

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No members found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[850px] table-auto text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="w-[32%] whitespace-nowrap px-5 py-3">
                Member
              </th>

              <th className="w-[20%] whitespace-nowrap px-5 py-3">
                Department
              </th>

              <th className="w-[15%] whitespace-nowrap px-5 py-3">
                Category
              </th>

              <th className="w-[13%] whitespace-nowrap px-5 py-3">
                Status
              </th>

              <th className="w-[20%] whitespace-nowrap px-5 py-3">
                Joined
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {pageMembers.map((member) => (
              <tr
                key={member.id}
                onClick={() => onView?.(member)}
                className="cursor-pointer hover:bg-gray-50/60"
              >
                {/* Member */}
                <td className="px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      firstName={member.firstName}
                      lastName={member.lastName}
                      photoUrl={member.photoUrl}
                      className="h-9 w-9 shrink-0 text-xs"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {member.title} {member.firstName}{" "}
                        {member.lastName}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        {member.email || "No email"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="px-5 py-3">
                  <div className="max-w-[220px] text-gray-700">
                    <span className="block truncate">
                      {member.departments?.join(", ") || "Not Assigned"}
                    </span>
                  </div>
                </td>

                {/* Category */}
                <td className="whitespace-nowrap px-5 py-3 text-gray-700">
                  {member.category}
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-5 py-3">
                  <Badge
                    tone={
                      member.status === "Active"
                        ? "active"
                        : "inactive"
                    }
                  >
                    {member.status}
                  </Badge>
                </td>

                {/* Joined */}
                <td className="whitespace-nowrap px-5 py-3 text-gray-700">
                  {new Date(member.dateJoined).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </td>
              </tr>
            ))}
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
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-600">
          <p className="whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
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
