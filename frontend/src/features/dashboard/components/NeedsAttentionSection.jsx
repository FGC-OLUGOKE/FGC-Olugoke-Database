import { AlertTriangle } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import EmptyState from "../../../components/ui/EmptyState";

export default function NeedsAttentionSection({ alerts }) {
  return (
    <SectionCard title="Needs Attention">
      {alerts.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="All caught up"
          description="No items currently need your attention."
        />
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert, index) => (
            <li
              key={index}
              className="flex items-start gap-3 rounded-lg border border-[#9e263b]/15 bg-[#9e263b]/5 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9e263b]" strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                <p className="text-xs text-gray-500">{alert.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}