import { ChevronDown } from "lucide-react";

/**
 * Select
 *
 * Styled wrapper around a native <select>, with the browser's
 * default arrow hidden and replaced by a custom chevron.
 *
 * `options` accepts either plain strings or `{ value, label }`
 * objects (for cases like sort options, where stored value and
 * displayed label differ).
 *
 * `placeholder`, if passed, renders as a disabled "Select X" option
 * with value="". It shows by default when the bound value is "",
 * but — because it's disabled — the user can't click back into it
 * once they've picked a real option. Pair this with validation that
 * treats "" as "not answered yet" (see MemberForm's `validate`).
 *
 * `error` gives the same red-border + message treatment as Input.
 */
export default function Select({
  label,
  options = [],
  placeholder,
  error,
  className = "",
  ...props
}) {
  const normalized = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <div className="relative">
        <select
          {...props}
          aria-invalid={Boolean(error)}
          className={`w-full appearance-none rounded-lg border bg-gray-50 px-3 py-2 pr-9 text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
            error
              ? "border-[#9e263b] focus:border-[#9e263b] focus:ring-[#9e263b]/20"
              : "border-gray-200 focus:border-[#154d78] focus:ring-[#154d78]/20"
          } ${
            !props.value ? "text-gray-400" : "text-gray-700"
          } ${className}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalized.map(({ value, label: optLabel }) => (
            <option key={value} value={value}>
              {optLabel}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          strokeWidth={2}
        />
      </div>
      {error && <p className="mt-1 text-xs text-[#9e263b]">{error}</p>}
    </label>
  );
}