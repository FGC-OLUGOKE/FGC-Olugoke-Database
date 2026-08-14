import { Loader2 } from "lucide-react";

/**
 * LoadingState
 *
 * Shown while a page's initial data fetch (getMembers, getDepartments,
 * etc.) is in flight. Same card treatment as EmptyState, so a page
 * transitions cleanly from "loading" to "empty" or "has data"
 * without a visual jump.
 */
export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
      <Loader2 className="h-5 w-5 animate-spin text-gray-400" strokeWidth={2} />
      <p className="mt-3 text-sm text-gray-500">{label}</p>
    </div>
  );
}