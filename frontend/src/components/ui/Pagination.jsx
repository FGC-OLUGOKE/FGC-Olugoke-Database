/**
 * Pagination
 *
 * Generic "Showing X–Y of Z" + Previous/Next control. Introduced for
 * the Birthdays page; MemberList has its own near-identical inline
 * version that still works fine and wasn't touched to avoid
 * unnecessary risk — worth pointing future pages at this shared one
 * instead of copy-pasting the pattern again.
 *
 * Props:
 * - page       (number) current page (1-indexed)
 * - pageSize   (number)
 * - totalItems (number)
 * - onPrev     (fn)
 * - onNext     (fn)
 * - itemLabel  (string) e.g. "birthdays", "members"
 */
export default function Pagination({ page, pageSize, totalItems, onPrev, onNext, itemLabel = "results" }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <p>
        Showing {start}–{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={onPrev}
          className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={onNext}
          className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
