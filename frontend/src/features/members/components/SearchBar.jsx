import { Search } from "lucide-react";
import { CATEGORIES, DEPARTMENTS, STATUSES, SORT_OPTIONS } from "../constants";

/**
 * SearchBar
 *
 * Search + category tabs + department/status/sort filters for the
 * Members page. Fully controlled — this component holds no state of
 * its own. The parent (MembersPage) owns the actual filtering logic,
 * so this stays pure UI with no assumptions about how data is fetched.
 *
 * Props:
 * - search           (string)   current search text
 * - onSearchChange   (fn)       (value) => void
 * - category         (string)   currently selected category
 * - onCategoryChange (fn)       (value) => void
 * - department       (string)   currently selected department
 * - onDepartmentChange (fn)     (value) => void
 * - status           (string)   currently selected status
 * - onStatusChange   (fn)       (value) => void
 * - sort             (string)   currently selected sort value
 * - onSortChange     (fn)       (value) => void
 */
export default function SearchBar({
  search = "",
  onSearchChange = () => {},
  category = "All",
  onCategoryChange = () => {},
  department = "All Departments",
  onDepartmentChange = () => {},
  status = "All Status",
  onStatusChange = () => {},
  sort = "az",
  onSortChange = () => {},
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Search input */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          strokeWidth={2}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, phone, or title..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#154d78] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
        />
      </div>

      {/* Category tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#154d78] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filter + sort row */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <FilterSelect
          value={department}
          onChange={onDepartmentChange}
          options={DEPARTMENTS}
        />
        <FilterSelect value={status} onChange={onStatusChange} options={STATUSES} />
        <FilterSelect
          value={sort}
          onChange={onSortChange}
          options={SORT_OPTIONS.map((o) => o.value)}
          labels={Object.fromEntries(SORT_OPTIONS.map((o) => [o.value, o.label]))}
        />
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options, labels }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-[#154d78] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#154d78]/20 sm:w-auto"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels ? labels[opt] : opt}
        </option>
      ))}
    </select>
  );
}