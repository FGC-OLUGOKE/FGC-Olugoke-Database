/**
 * MultiSelect
 *
 * Toggle-chip multi-select — built for Department assignment (a
 * member can belong to more than one department), but generic
 * enough to reuse anywhere else a "pick any number of these" field
 * is needed. Same pill styling as SearchBar's category tabs, just
 * multi-select instead of single-select.
 *
 * Props:
 * - label    (string)
 * - options  (string[])
 * - values   (string[])  currently selected options
 * - onChange (fn)  (nextValues: string[]) => void
 * - required (bool, optional)
 * - error    (string, optional)
 */
export default function MultiSelect({ label, options, values = [], onChange, required, error }) {
  function toggle(option) {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  }

  return (
    <div>
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
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-[#154d78] bg-[#154d78] text-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {values.length === 0 && (
        <p className="mt-1.5 text-xs text-gray-400">No departments selected yet.</p>
      )}
      {error && <p className="mt-1 text-xs text-[#9e263b]">{error}</p>}
    </div>
  );
}