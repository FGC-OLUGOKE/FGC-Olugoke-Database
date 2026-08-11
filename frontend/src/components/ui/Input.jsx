/**
 * Input
 *
 * Optionally takes a leading `icon` (a lucide-react icon component)
 * so the same primitive covers both plain fields (MemberForm) and
 * icon-prefixed fields (SearchBar's search box).
 *
 * Optionally takes an `error` string — when present, the border and
 * focus ring switch to brand red and the message renders below the
 * field, replacing the browser's native validation tooltip.
 */
export default function Input({ label, icon: Icon, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            strokeWidth={2}
          />
        )}
        <input
          {...props}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-gray-50 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 ${
            error
              ? "border-[#9e263b] focus:border-[#9e263b] focus:ring-[#9e263b]/20"
              : "border-gray-200 focus:border-[#154d78] focus:ring-[#154d78]/20"
          } ${Icon ? "pl-10 pr-3" : "px-3"} ${className}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-[#9e263b]">{error}</p>}
    </label>
  );
}