/**
 * SegmentedControl
 *
 * For a small, fixed set of named options where only one applies at
 * a time (e.g. Gender: Male/Female) — a dropdown is overkill for two
 * choices, and it's not a yes/no state like `Toggle`, so it gets its
 * own control rather than being forced into either of those.
 *
 * Props:
 * - label   (string)
 * - options (string[])
 * - value   (string)
 * - onChange (fn)  (value) => void
 * - error   (string, optional)
 */
export default function SegmentedControl({ label, options, value, onChange, error }) {
  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <div
        className={`inline-flex w-full rounded-lg border bg-gray-50 p-1 ${
          error ? "border-[#9e263b]" : "border-gray-200"
        }`}
      >
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={active}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-[#154d78] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-[#9e263b]">{error}</p>}
    </div>
  );
}