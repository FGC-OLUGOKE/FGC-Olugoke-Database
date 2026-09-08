
import { AlertTriangle, ChevronDown, Search, X } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";
import { useMemo, useState } from "react";

export default function NeedsAttentionSection({ alerts }) {
  const [expandedAlertIds, setExpandedAlertIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  function toggleAlert(alertId) {
    setExpandedAlertIds((previous) =>
      previous.includes(alertId)
        ? previous.filter((id) => id !== alertId)
        : [...previous, alertId],
    );
  }

  // Filter alerts by name/title
  const filteredAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return alerts;
    }

    return alerts.filter((alert) =>
      alert.title?.toLowerCase().includes(query),
    );
  }, [alerts, searchTerm]);

  return (
    <SectionCard title="Needs Attention">
      {alerts.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="All caught up"
          description="No items currently need your attention."
        />
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name..."
              aria-label="Search needs attention by name"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#9e263b] focus:ring-2 focus:ring-[#9e263b]/10"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Alerts */}
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">
              <Search className="mb-2 h-5 w-5 text-gray-400" />

              <p className="text-sm font-medium text-gray-700">
                No matching names
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Try searching with a different name.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {filteredAlerts.map((alert, index) => {
                const isExpandable = alert.type === "profile";
                const isExpanded = expandedAlertIds.includes(alert.id);

                return (
                  <li
                    key={alert.id ?? index}
                    className="flex items-start gap-3 rounded-lg border border-[#9e263b]/15 bg-[#9e263b]/5 p-3"
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#9e263b]"
                      strokeWidth={2}
                    />

                    <div className="min-w-0 flex-1">
                      {isExpandable ? (
                        <button
                          type="button"
                          onClick={() => toggleAlert(alert.id)}
                          aria-expanded={isExpanded}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <span className="truncate text-sm font-medium text-gray-900">
                            {alert.title}
                          </span>

                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-[#9e263b] transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            strokeWidth={2}
                          />
                        </button>
                      ) : (
                        <p className="truncate text-sm font-medium text-gray-900">
                          {alert.title}
                        </p>
                      )}

                      {isExpanded ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Missing:{" "}
                          {alert.missingFields?.join(", ") || "No details"}
                        </p>
                      ) : !isExpandable ? (
                        <p className="text-xs text-gray-500">
                          {alert.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </SectionCard>
  );
}
