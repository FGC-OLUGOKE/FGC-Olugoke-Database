import { ChevronDown } from "lucide-react";

/**
 * Select
 *
 * Styled wrapper around a native <select>, with the browser's
 * default arrow hidden and replaced by a custom chevron.
 *
 * `options` accepts either plain strings or `{ value, label }`
 * objects. `placeholder` renders as a disabled default option.
 * `required` shows a red asterisk beside the label (visual only).
 * `error` gives the same red-border + message treatment as Input.
 */
export default function Select({
  label,
  options = [],
  placeholder,
  required,
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
        <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="text-[#9e263b]" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}
      <div className="relative">
        <select
          {...props}
          aria-invalid={Boolean(error)}
          aria-required={required || undefined}
          className={`w-full appearance-none rounded-lg border bg-gray-50 px-3 py-2 pr-9 text-sm transition-colors focus:bg-white focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
            error
              ? "border-[#9e263b] focus:border-[#9e263b] focus:ring-[#9e263b]/20"
              : "border-gray-200 focus:border-[#154d78] focus:ring-[#154d78]/20"
          } ${!props.value ? "text-gray-400" : "text-gray-700"} ${className}`}
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