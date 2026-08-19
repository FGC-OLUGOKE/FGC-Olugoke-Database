import { useNavigate } from "react-router-dom";
import { CalendarX } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";

export default function EventsReport({ stats, events }) {
  const navigate = useNavigate();
  const today = new Date();

  return (
    <SectionCard title="Events Report" actionLabel="View All Events" onAction={() => navigate("/events")}>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Events</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-lg font-semibold text-gray-900">{stats.upcoming}</p>
          <p className="text-xs text-gray-500">Upcoming</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-lg font-semibold text-gray-900">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {stats.byType.map((t) => (
          <span key={t.type} className="rounded-full bg-[#4a2969]/10 px-2.5 py-1 text-xs font-medium text-[#4a2969]">
            {t.type} · {t.count}
          </span>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState icon={CalendarX} title="No upcoming events" description="No events are currently scheduled." />
      ) : (
        <ul className="divide-y divide-gray-100">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{e.name}</p>
                <p className="text-xs text-gray-500">
                  {e.type} · {e.date} · {e.time} {e.location && `· ${e.location}`}
                </p>
              </div>
              <Badge tone={new Date(e.date) >= today ? "info" : "neutral"}>
                {new Date(e.date) >= today ? "Upcoming" : "Completed"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}