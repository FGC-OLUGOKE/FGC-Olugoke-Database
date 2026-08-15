import { Search } from "lucide-react";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { CATEGORIES, DEPARTMENTS, STATUSES } from "../../members/constants";

const TIME_PERIODS = ["Today", "This Week", "Next Week", "This Month", "Next Month", "All Upcoming"];

const SORT_OPTIONS = [
  { value: "nearest", label: "Nearest Birthday" },
  { value: "furthest", label: "Furthest Birthday" },
  { value: "az", label: "Name A-Z" },
  { value: "za", label: "Name Z-A" },
  { value: "youngest", label: "Youngest First" },
  { value: "oldest", label: "Oldest First" },
];

/**
 * Reuses the exact CATEGORIES/DEPARTMENTS/STATUSES already
 * established in the Members feature, rather than a separate
 * hardcoded list — keeps filters matching real data instead of
 * introducing department/category names that don't correspond to
 * any actual member.
 */
export default function BirthdaySearchAndFilters({
  search,
  onSearchChange,
  timePeriod,
  onTimePeriodChange,
  category,
  onCategoryChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <Input
        icon={Search}
        placeholder="Search birthdays by name, department or category..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Select
          aria-label="Time period"
          value={timePeriod}
          onChange={(e) => onTimePeriodChange(e.target.value)}
          options={TIME_PERIODS}
        />
        <Select
          aria-label="Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          options={CATEGORIES}
        />
        <Select
          aria-label="Department"
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          options={DEPARTMENTS}
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={STATUSES}
        />
        <Select
          aria-label="Sort by"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          options={SORT_OPTIONS}
        />
      </div>
    </div>
  );
}
