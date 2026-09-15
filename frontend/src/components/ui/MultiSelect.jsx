import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * MultiSelect
 *
 * Searchable multi-select with a compact, scrollable option list.
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
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

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
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-2.5 my-auto h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search departments..."
            aria-label={label ? `Search ${label.toLowerCase()}` : "Search options"}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#154d78] focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
          />
        </div>

        <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-gray-500">
              No departments found.
            </p>
          ) : (
            filteredOptions.map((option) => {
              const active = values.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-[#154d78] bg-[#154d78]/5 text-[#154d78]"
                      : "border-transparent bg-white text-gray-700 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      active
                        ? "border-[#154d78] bg-[#154d78] text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 truncate">{option}</span>
                </button>
              );
            })
          )}
        </div>

        <p className="px-1 pt-2 text-xs text-gray-500">
          {values.length} selected
        </p>
      </div>
      {values.length === 0 && <p className="mt-1.5 text-xs text-gray-400">No departments selected yet.</p>}
      {error && <p className="mt-1 text-xs text-[#9e263b]">{error}</p>}
    </div>
  );
}