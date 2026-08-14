import { Activity } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";

export default function RecentActivitySection({ activity }) {
  return (
    <SectionCard title="Recent Activity">
      <ul className="space-y-4">
        {activity.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10">
              <Activity className="h-3.5 w-3.5 text-[#154d78]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700">{item.description}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(item.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {item.admin && ` · ${item.admin}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}