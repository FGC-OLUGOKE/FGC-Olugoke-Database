import { Search } from "lucide-react";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { CATEGORIES, DEPARTMENTS, STATUSES, SORT_OPTIONS } from "../constants";

/**
 * SearchBar
 *
 * Search + category tabs + department/status/sort filters for the
 * Members page. Fully controlled — this component holds no state of
 * its own. The parent (MembersPage) owns the actual filtering logic,
 * so this stays pure UI with no assumptions about how data is fetched.
 *
 * Built entirely on the shared Input/Select primitives (not hand-
 * rolled inputs) so it can't drift from their styling over time.
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
      <Input
        icon={Search}
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name, email, phone, or title..."
      />

      {/* Category tabs — intentionally distinct from Select; these
          are primary browse controls, not a settings-style dropdown */}
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
        <Select
          aria-label="Filter by department"
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          options={DEPARTMENTS}
          className="sm:w-auto"
        />
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={STATUSES}
          className="sm:w-auto"
        />
        <Select
          aria-label="Sort members"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          options={SORT_OPTIONS}
          className="sm:w-auto"
        />
      </div>
    </div>
  );
}