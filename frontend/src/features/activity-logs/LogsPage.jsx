import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CalendarDays,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

import SectionCard from "../../components/ui/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import DropdownMenu, {
  DropdownMenuItem,
} from "../../components/ui/DropdownMenu";
import { useToast } from "../../components/ui/ToastProvider";
import { getRecentActivity } from "../dashboard/api";

const DATE_FILTERS = {
  all: "All time",
  today: "Today",
  "7days": "Last 7 days",
  "30days": "Last 30 days",
  "3months": "Last 3 months",
  "6months": "Last 6 months",
  "1year": "Last 1 year",
  custom: "Custom date",
};

export default function LogsPage() {
  const toast = useToast();

  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    let isMounted = true;

    getRecentActivity()
      .then((data) => {
        if (isMounted) {
          setActivity(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          toast.error("Couldn't load activity logs. Try refreshing.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logs = useMemo(() => {
    const now = new Date();

    return [...activity]
      .filter((item) => {
        const query = searchQuery.trim().toLowerCase();

        const description = String(item.description || "").toLowerCase();
        const admin = String(item.admin || "").toLowerCase();

        // Search by activity description or admin name
        const matchesSearch =
          !query ||
          description.includes(query) ||
          admin.includes(query);

        if (!matchesSearch) {
          return false;
        }

        // All activity
        if (dateFilter === "all") {
          return true;
        }

        const timestamp = new Date(item.timestamp);

        if (Number.isNaN(timestamp.getTime())) {
          return false;
        }

        // Today
        if (dateFilter === "today") {
          return (
            timestamp.getFullYear() === now.getFullYear() &&
            timestamp.getMonth() === now.getMonth() &&
            timestamp.getDate() === now.getDate()
          );
        }

        // Relative date filters
        if (
          ["7days", "30days", "3months", "6months", "1year"].includes(
            dateFilter
          )
        ) {
          const startDate = new Date(now);

          switch (dateFilter) {
            case "7days":
              startDate.setDate(now.getDate() - 7);
              break;

            case "30days":
              startDate.setDate(now.getDate() - 30);
              break;

            case "3months":
              startDate.setMonth(now.getMonth() - 3);
              break;

            case "6months":
              startDate.setMonth(now.getMonth() - 6);
              break;

            case "1year":
              startDate.setFullYear(now.getFullYear() - 1);
              break;

            default:
              break;
          }

          return timestamp >= startDate;
        }

        // Custom date range
        if (dateFilter === "custom") {
          if (customStartDate) {
            const startDate = new Date(
              `${customStartDate}T00:00:00`
            );

            if (timestamp < startDate) {
              return false;
            }
          }

          if (customEndDate) {
            const endDate = new Date(
              `${customEndDate}T23:59:59.999`
            );

            if (timestamp > endDate) {
              return false;
            }
          }

          return true;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [
    activity,
    searchQuery,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const selectDateFilter = (filter) => {
    setDateFilter(filter);

    if (filter !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const hasFilters =
    searchQuery.trim() ||
    dateFilter !== "all" ||
    customStartDate ||
    customEndDate;

  const customDateIsInvalid =
    dateFilter === "custom" &&
    customStartDate &&
    customEndDate &&
    customStartDate > customEndDate;

  if (isLoading) {
    return <LoadingState label="Loading activity logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#154d78]/10">
          <Activity
            className="h-5 w-5 text-[#154d78]"
            strokeWidth={2}
          />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Activity Logs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review recent actions within your permitted scope.
          </p>
        </div>
      </div>

      <SectionCard title="Recent Activity">
        {/* Search and Filter */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activity or admin..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 outline-none transition focus:border-[#154d78]/40 focus:ring-2 focus:ring-[#154d78]/10"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Date Filter Dropdown */}
            <DropdownMenu
              width={210}
              trigger={
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition hover:border-gray-300 lg:w-52"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CalendarDays
                      className="h-4 w-4 shrink-0 text-gray-400"
                      strokeWidth={2}
                    />

                    <span className="truncate">
                      {DATE_FILTERS[dateFilter]}
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
                  {Object.entries(DATE_FILTERS)
                    .filter(([value]) => value !== "custom")
                    .map(([value, label]) => (
                      <DropdownMenuItem
                        key={value}
                        label={label}
                        onClick={() => {
                          selectDateFilter(value);
                          close();
                        }}
                      />
                    ))}

                  <div className="my-1 border-t border-gray-100" />

                  <DropdownMenuItem
                    label="Custom date"
                    onClick={() => {
                      selectDateFilter("custom");
                      close();
                    }}
                  />
                </>
              )}
            </DropdownMenu>
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="start-date"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    From
                  </label>

                  <input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) =>
                      setCustomStartDate(e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 outline-none transition focus:border-[#154d78]/40 focus:ring-2 focus:ring-[#154d78]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="end-date"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    To
                  </label>

                  <input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) =>
                      setCustomEndDate(e.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700 outline-none transition focus:border-[#154d78]/40 focus:ring-2 focus:ring-[#154d78]/10"
                  />
                </div>
              </div>

              {customDateIsInvalid && (
                <p className="mt-2 text-xs text-[#9e263b]">
                  The start date cannot be later than the end date.
                </p>
              )}
            </div>
          )}

          {/* Filter Summary */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {logs.length}
              </span>{" "}
              {logs.length === 1 ? "activity" : "activities"}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-[#154d78] transition hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Activity List */}
        {logs.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="No matching activity"
              description="No activity logs match your current search or date filter."
            />
          ) : (
            <EmptyState
              icon={Activity}
              title="No activity logs"
              description="Recent actions will appear here."
            />
          )
        ) : (
          <div className="relative">
            {/* Timeline */}
            <div className="absolute bottom-3 left-[15px] top-3 w-px bg-gray-200" />

            <ul className="space-y-1">
              {logs.map((item, index) => {
                const timestamp = new Date(item.timestamp);

                const formattedDate = timestamp.toLocaleString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );

                const formattedTime = timestamp.toLocaleString(
                  "en-US",
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                );

                return (
                  <li
                    key={
                      item.id ??
                      `${item.timestamp}-${index}`
                    }
                    className="group relative flex gap-4 rounded-xl p-3 transition hover:bg-gray-50"
                  >
                    {/* Timeline Icon */}
                    <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#154d78]/15 bg-white shadow-sm">
                      <div className="h-2 w-2 rounded-full bg-[#154d78]" />
                    </div>

                    {/* Activity Content */}
                    <div className="min-w-0 flex-1 pb-2">
                      <p className="text-sm leading-6 text-gray-700">
                        {item.description}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                        <span>{formattedDate}</span>

                        <span className="text-gray-300">
                          •
                        </span>

                        <span>{formattedTime}</span>

                        {item.admin && (
                          <>
                            <span className="text-gray-300">
                              •
                            </span>

                            <span className="font-medium text-gray-500">
                              {item.admin}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SectionCard>
    </div>
  );
}