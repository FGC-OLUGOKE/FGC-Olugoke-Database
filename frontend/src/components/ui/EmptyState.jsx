/**
 * EmptyState
 *
 * Shared "nothing to show" screen — used wherever a list/table has
 * no results (no members match filters, no attendance records for a
 * date, no events this month, etc.). Centralizing this keeps every
 * empty screen in the app visually identical.
 *
 * Props:
 * - icon        (component)  a lucide-react icon component, e.g. Inbox
 * - title       (string)     short headline, e.g. "No members found"
 * - description (string)     one line of supporting text
 */
export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}