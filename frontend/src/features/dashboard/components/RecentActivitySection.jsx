import { Activity } from "lucide-react";

import SectionCard from "../../../components/ui/SectionCard";

export default function RecentActivitySection({ activity }) {
  const recentActivity = [...activity]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )
    .slice(0, 10);

  return (
    <SectionCard title="Recent Activity">
      {recentActivity.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          No recent activity.
        </p>
      ) : (
        <ul className="space-y-4">
          {recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10">
                <Activity
                  className="h-3.5 w-3.5 text-[#154d78]"
                  strokeWidth={2}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">
                  {item.description}
                </p>

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
      )}
    </SectionCard>
  );
}