import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";

export default function UpcomingEventsSection({ events }) {
  const navigate = useNavigate();
  const upcoming = [...events].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

  return (
    <SectionCard
      title="Upcoming Events"
      actionLabel="View All Events"
      onAction={() => navigate("/events")}
    >
      <ul className="space-y-3">
        {upcoming.map((event) => (
          <li key={event.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4a2969]/10">
              <CalendarDays className="h-4 w-4 text-[#4a2969]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{event.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {event.time}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}