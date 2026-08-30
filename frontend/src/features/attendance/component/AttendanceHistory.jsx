
import { useMemo, useState } from "react";

import {
  CalendarDays,
  ChevronDown,
  Search,
  X,
  ClipboardList,
} from "lucide-react";

import Badge from "../../../components/ui/Badge";
import Input from "../../../components/ui/Input";
import DropdownMenu, {
  DropdownMenuItem,
} from "../../../components/ui/DropdownMenu";
import EmptyState from "../../../components/ui/EmptyState";

const columns = [
  ["adults", "Adult"],
  ["youth", "Youth"],
  ["teenagers", "Teenager"],
  ["children", "Children"],
];

const QUICK_FILTERS = [
  { value: "", label: "All records" },

  { value: "month-0", label: "This month" },
  { value: "month-1", label: "Last month" },
  { value: "month-2", label: "2 months ago" },
  { value: "month-3", label: "3 months ago" },
  { value: "month-6", label: "6 months ago" },
  { value: "month-12", label: "12 months ago" },

  { value: "year-0", label: "This year" },
  { value: "year-1", label: "Last year" },
  { value: "year-2", label: "2 years ago" },
  { value: "year-3", label: "3 years ago" },
  { value: "year-6", label: "6 years ago" },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDateMonthsAgo(months) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() - months);

  return date;
}

function getDateYearsAgo(years) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - years);

  return date;
}

export default function AttendanceHistory({
  records,
  categoryKey,
}) {
  const [quickFilter, setQuickFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");

  const [showCustomDate, setShowCustomDate] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const visibleColumns = categoryKey
    ? columns.filter(([key]) => key === categoryKey)
    : columns;

  const selectedQuickFilter =
    QUICK_FILTERS.find(
      (filter) => filter.value === quickFilter,
    ) || QUICK_FILTERS[0];

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (!record.date) return false;

      const recordDate = new Date(record.date);

      if (Number.isNaN(recordDate.getTime())) {
        return false;
      }

      recordDate.setHours(0, 0, 0, 0);

      /*
       * EVENT NAME FILTER
       */
      if (eventFilter.trim()) {
        const eventName = (
          record.eventName || ""
        ).toLowerCase();

        const searchTerm = eventFilter
          .trim()
          .toLowerCase();

        if (!eventName.includes(searchTerm)) {
          return false;
        }
      }

      /*
       * CUSTOM DATE FILTER
       */
      if (fromDate) {
        const startDate = new Date(
          `${fromDate}T00:00:00`,
        );

        if (recordDate < startDate) {
          return false;
        }
      }

      if (toDate) {
        const endDate = new Date(
          `${toDate}T23:59:59`,
        );

        if (recordDate > endDate) {
          return false;
        }
      }

      /*
       * QUICK MONTH FILTER
       */
      if (quickFilter.startsWith("month-")) {
        const monthsAgo = Number(
          quickFilter.replace("month-", ""),
        );

        const targetDate = getDateMonthsAgo(
          monthsAgo,
        );

        if (
          recordDate.getMonth() !==
            targetDate.getMonth() ||
          recordDate.getFullYear() !==
            targetDate.getFullYear()
        ) {
          return false;
        }
      }

      /*
       * QUICK YEAR FILTER
       */
      if (quickFilter.startsWith("year-")) {
        const yearsAgo = Number(
          quickFilter.replace("year-", ""),
        );

        const targetDate = getDateYearsAgo(
          yearsAgo,
        );

        if (
          recordDate.getFullYear() !==
          targetDate.getFullYear()
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    records,
    quickFilter,
    eventFilter,
    fromDate,
    toDate,
  ]);

  function selectQuickFilter(value) {
    setQuickFilter(value);

    if (value) {
      setFromDate("");
      setToDate("");
      setShowCustomDate(false);
    }
  }

  function clearFilters() {
    setQuickFilter("");
    setEventFilter("");
    setFromDate("");
    setToDate("");
    setShowCustomDate(false);
  }

  const hasFilters =
    Boolean(quickFilter) ||
    Boolean(eventFilter) ||
    Boolean(fromDate) ||
    Boolean(toDate);

  return (
    <div className="space-y-4">

      {/* FILTER BAR */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">

          {/* QUICK DATE FILTER */}
          <DropdownMenu
            width={220}
            trigger={
              <button
                type="button"
                className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none md:w-[220px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CalendarDays
                    className="h-4 w-4 shrink-0 text-gray-400"
                    strokeWidth={2}
                  />

                  <span className="truncate">
                    {selectedQuickFilter.label}
                  </span>
                </span>

                <ChevronDown
                  className="h-4 w-4 shrink-0 text-gray-400"
                  strokeWidth={2}
                />
              </button>
            }
          >
            {(close) => (
              <>
                <DropdownMenuItem
                  label="All records"
                  onClick={() => {
                    selectQuickFilter("");
                    close();
                  }}
                />

                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Months
                </div>

                {QUICK_FILTERS
                  .filter((filter) =>
                    filter.value.startsWith(
                      "month-",
                    ),
                  )
                  .map((filter) => (
                    <DropdownMenuItem
                      key={filter.value}
                      label={filter.label}
                      onClick={() => {
                        selectQuickFilter(
                          filter.value,
                        );
                        close();
                      }}
                    />
                  ))}

                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Years
                </div>

                {QUICK_FILTERS
                  .filter((filter) =>
                    filter.value.startsWith(
                      "year-",
                    ),
                  )
                  .map((filter) => (
                    <DropdownMenuItem
                      key={filter.value}
                      label={filter.label}
                      onClick={() => {
                        selectQuickFilter(
                          filter.value,
                        );
                        close();
                      }}
                    />
                  ))}
              </>
            )}
          </DropdownMenu>

          {/* EVENT SEARCH */}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />

            <Input
              type="text"
              placeholder="Search event name..."
              value={eventFilter}
              onChange={(event) =>
                setEventFilter(
                  event.target.value,
                )
              }
              className="pl-9"
            />
          </div>

          {/* CUSTOM DATE */}
          <button
            type="button"
            onClick={() => {
              setShowCustomDate(
                (previous) => !previous,
              );
              setQuickFilter("");
            }}
            className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm transition ${
              showCustomDate ||
              fromDate ||
              toDate
                ? "border-[#154d78] bg-[#154d78]/5 text-[#154d78]"
                : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <CalendarDays
              className="h-4 w-4"
              strokeWidth={2}
            />

            <span className="whitespace-nowrap">
              Custom date
            </span>
          </button>

          {/* CLEAR FILTERS */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X
                className="h-4 w-4"
                strokeWidth={2}
              />

              <span>Clear</span>
            </button>
          )}
        </div>

        {/* CUSTOM DATE RANGE */}
        {showCustomDate && (
          <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-end">

            <div className="w-full sm:max-w-[180px]">
              <Input
                label="From"
                type="date"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="w-full sm:max-w-[180px]">
              <Input
                label="To"
                type="date"
                value={toDate}
                onChange={(event) =>
                  setToDate(
                    event.target.value,
                  )
                }
              />
            </div>

          </div>
        )}

        {/* RESULT COUNT */}
        {hasFilters && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-600">
                {filteredRecords.length}
              </span>{" "}
              of {records.length} records
            </p>
          </div>
        )}
      </div>

      {/* RESULTS */}
      {filteredRecords.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-[520px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-4 py-3">
                  Event
                </th>

                {visibleColumns.map(
                  ([, label]) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-center"
                    >
                      {label}
                    </th>
                  ),
                )}

                {!categoryKey && (
                  <th className="px-4 py-3 text-center">
                    Total
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRecords.map(
                (record) => (
                  <tr
                    key={`${record.date}-${record.id ?? "attendance"}`}
                    className="hover:bg-gray-50/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {formatDate(
                        record.date,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {record.eventName ||
                        "—"}
                    </td>

                    {visibleColumns.map(
                      ([key, label]) => (
                        <td
                          key={label}
                          className="px-4 py-3 text-center text-gray-700"
                        >
                          {Number(
                            record[key],
                          ) || 0}
                        </td>
                      ),
                    )}

                    {!categoryKey && (
                      <td className="px-4 py-3 text-center">
                        <Badge tone="info">
                          {Number(
                            record.total,
                          ) || 0}
                        </Badge>
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={
            hasFilters
              ? "No attendance records found"
              : "No attendance history"
          }
          description={
            hasFilters
              ? "No attendance records match the selected filters."
              : "Attendance records will appear here once they are recorded."
          }
        />
      )}
    </div>
  );
}
