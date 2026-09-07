import { AlertTriangle, ChevronDown } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";
import { useState } from "react";

export default function NeedsAttentionSection({ alerts }) {
  const [expandedAlertIds, setExpandedAlertIds] = useState([]);

  function toggleAlert(alertId) {
    setExpandedAlertIds((previous) =>
      previous.includes(alertId)
        ? previous.filter((id) => id !== alertId)
        : [...previous, alertId],
    );
  }

  return (
    <SectionCard title="Needs Attention">
      {alerts.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="All caught up"
          description="No items currently need your attention."
        />
      ) : (
        <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {alerts.map((alert, index) => {
            const isExpandable = alert.type === "profile";
            const isExpanded = expandedAlertIds.includes(alert.id);

            return (
            <li
              key={alert.id ?? index}
              className="flex items-start gap-3 rounded-lg border border-[#9e263b]/15 bg-[#9e263b]/5 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9e263b]" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                {isExpandable ? (
                  <button
                    type="button"
                    onClick={() => toggleAlert(alert.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between gap-2 text-left"
                  >
                    <span className="text-sm font-medium text-gray-900">{alert.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#9e263b] transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      strokeWidth={2}
                    />
                  </button>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                )}
                {isExpanded ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Missing: {alert.missingFields.join(", ")}
                  </p>
                ) : !isExpandable ? (
                  <p className="text-xs text-gray-500">{alert.description}</p>
                ) : null}
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
