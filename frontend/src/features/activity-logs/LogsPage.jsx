import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import SectionCard from "../../components/ui/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import DropdownMenu, {
  DropdownMenuItem,
} from "../../components/ui/DropdownMenu";
import Drawer from "../../components/ui/Drawer";
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

  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const PAGE_SIZE = 10;

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

        const description = String(
          item.description || ""
        ).toLowerCase();

        const admin = String(item.admin || "").toLowerCase();

        const matchesSearch =
          !query ||
          description.includes(query) ||
          admin.includes(query);

        if (!matchesSearch) {
          return false;
        }

        if (dateFilter === "all") {
          return true;
        }

        const timestamp = new Date(item.timestamp);

        if (Number.isNaN(timestamp.getTime())) {
          return false;
        }

        if (dateFilter === "today") {
          return (
            timestamp.getFullYear() === now.getFullYear() &&
            timestamp.getMonth() === now.getMonth() &&
            timestamp.getDate() === now.getDate()
          );
        }

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

  const totalPages = Math.max(
    1,
    Math.ceil(logs.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, dateFilter, customStartDate, customEndDate]);

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
    Boolean(searchQuery.trim()) ||
    dateFilter !== "all" ||
    Boolean(customStartDate) ||
    Boolean(customEndDate);

  const customDateIsInvalid =
    dateFilter === "custom" &&
    customStartDate &&
    customEndDate &&
    customStartDate > customEndDate;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Unknown time";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <LoadingState label="Loading activity logs..." />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#154d78]/10">
            <Activity
              className="h-5 w-5 text-[#154d78]"
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Activity Logs
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review and inspect recent actions within your permitted
              scope.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <SectionCard title="Recent Activity">
          {/* Search + Filters */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-3">
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
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search activity or admin..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 outline-none transition focus:border-[#154d78]/40 focus:ring-2 focus:ring-[#154d78]/10"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition hover:text-gray-600"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Date Filter */}
              <DropdownMenu
                width={210}
                trigger={
                  <button
                    type="button"
                    className="flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition hover:border-gray-300 lg:w-52"
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

            {/* Custom Dates */}
            {dateFilter === "custom" && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
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
                      onChange={(event) =>
                        setCustomStartDate(event.target.value)
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
                      onChange={(event) =>
                        setCustomEndDate(event.target.value)
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
                <span className="font-semibold text-gray-700">
                  {logs.length}
                </span>{" "}
                {logs.length === 1 ? "activity" : "activities"}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="cursor-pointer text-xs font-medium text-[#154d78] transition hover:underline"
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
            <div>
              {/* Activity Summary */}
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Activity history
                </p>

                <span className="text-xs text-gray-400">
                  Click an activity to view details
                </span>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute bottom-5 left-[17px] top-5 w-px bg-gray-200" />

                <ul className="space-y-1">
                  {paginatedLogs.map((item, index) => {
                    const isSelected =
                      selectedLog?.id === item.id;

                    return (
                      <li key={item.id ?? `${item.timestamp}-${index}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(item)}
                          className={`group relative flex w-full cursor-pointer gap-4 rounded-xl p-3 text-left transition ${
                            isSelected
                              ? "bg-[#154d78]/5"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {/* Timeline Marker */}
                          <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition group-hover:border-[#154d78]/30 group-hover:shadow-md">
                            <div
                              className={`h-2.5 w-2.5 rounded-full transition ${
                                isSelected
                                  ? "bg-[#154d78]"
                                  : "bg-gray-300 group-hover:bg-[#154d78]"
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1 py-0.5">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-medium leading-6 text-gray-800 transition group-hover:text-[#154d78]">
                                {item.description ||
                                  "Activity recorded"}
                              </p>

                              <span className="hidden shrink-0 text-xs font-medium text-gray-400 sm:block">
                                {formatTime(item.timestamp)}
                              </span>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                              <span>
                                {formatDate(item.timestamp)}
                              </span>

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

                          {/* Mobile Time */}
                          <span className="shrink-0 text-[11px] text-gray-400 sm:hidden">
                            {formatTime(item.timestamp)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <p className="whitespace-nowrap text-xs">
                    Page {currentPage} of {totalPages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(totalPages, current + 1)
                        )
                      }
                      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Activity Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Activity Details"
        widthClass="md:max-w-md"
        desktopModal
      >
        {selectedLog && (
          <div className="bg-gray-50">
            {/* Activity Header */}
            <div className="border-b border-gray-200 bg-white px-5 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#154d78]/10">
                <Activity
                  className="h-6 w-6 text-[#154d78]"
                  strokeWidth={1.8}
                />
              </div>

              <h3 className="mt-4 text-lg font-semibold leading-7 text-gray-900">
                {selectedLog.description ||
                  "Activity recorded"}
              </h3>

              <p className="mt-2 text-sm leading-5 text-gray-500">
                This activity was recorded in the system and is
                available for review.
              </p>
            </div>

            {/* Details */}
            <div className="space-y-4 p-5">
              {/* Date & Time */}
              <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                  </div>

                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      Date & Time
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-gray-800">
                      {formatDateTime(selectedLog.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Admin */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#154d78]/10">
                    <User className="h-4 w-4 text-[#154d78]" />
                  </div>

                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      Performed By
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-gray-800">
                      {selectedLog.admin || "System"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Log Information */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#154d78]" />

                  <h4 className="text-sm font-semibold text-gray-900">
                    Log Information
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                      Activity
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-700">
                      {selectedLog.description ||
                        "No activity description available."}
                    </p>
                  </div>

                  {selectedLog.id != null && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Log ID
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-gray-500">
                        {selectedLog.id}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Data */}
              {Object.entries(selectedLog).some(
                ([key]) =>
                  ![
                    "id",
                    "description",
                    "admin",
                    "timestamp",
                  ].includes(key)
              ) && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#154d78]" />

                    <h4 className="text-sm font-semibold text-gray-900">
                      Additional Information
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(selectedLog)
                      .filter(
                        ([key]) =>
                          ![
                            "id",
                            "description",
                            "admin",
                            "timestamp",
                          ].includes(key)
                      )
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                        >
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (letter) =>
                                letter.toUpperCase()
                              )}
                          </p>

                          <p className="mt-1 break-words text-sm text-gray-700">
                            {typeof value === "object" &&
                            value !== null
                              ? JSON.stringify(value)
                              : String(value ?? "—")}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}