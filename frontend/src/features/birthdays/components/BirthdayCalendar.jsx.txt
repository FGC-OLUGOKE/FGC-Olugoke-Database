import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * BirthdayCalendar
 *
 * Month-grid calendar built with plain divs (no calendar library).
 * Birthday indicator matches on (month, day) only — recurring
 * yearly — so it works regardless of which year is being viewed.
 */
export default function BirthdayCalendar({ members, selectedDate, onSelectDate }) {
  const [viewedMonth, setViewedMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const birthdaysByDay = useMemo(() => {
    const map = new Map(); // key: "month-day" -> true
    members.forEach((m) => {
      if (!m.dateOfBirth) return;
      const dob = new Date(m.dateOfBirth);
      map.set(`${dob.getMonth()}-${dob.getDate()}`, true);
    });
    return map;
  }, [members]);

  const year = viewedMonth.getFullYear();
  const month = viewedMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <SectionCard title="Birthday Calendar">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewedMonth(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-gray-900">
          {viewedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setViewedMonth(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-400">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <div key={`blank-${index}`} />;

          const hasBirthday = birthdaysByDay.has(`${month}-${day}`);
          const isToday = isCurrentMonth && today.getDate() === day;
          const isSelected =
            selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(new Date(year, month, day))}
              className={`relative aspect-square rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-[#154d78] text-white"
                  : isToday
                  ? "bg-[#154d78]/10 font-semibold text-[#154d78]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {day}
              {hasBirthday && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                    isSelected ? "bg-white" : "bg-[#d6b447]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
