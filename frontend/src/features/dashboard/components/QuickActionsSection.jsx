import { useNavigate } from "react-router-dom";
import { UserPlus, ClipboardCheck, CalendarPlus, Users, Cake } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";

export default function QuickActionsSection({ onAddMember }) {
  const navigate = useNavigate();
  const actions = [
    { label: "Add Member", icon: UserPlus, onClick: onAddMember },
    { label: "Record Attendance", icon: ClipboardCheck, onClick: () => navigate("/attendance") },
    { label: "Add Event", icon: CalendarPlus, onClick: () => navigate("/events") },
    { label: "View Members", icon: Users, onClick: () => navigate("/members") },
    { label: "View Birthdays", icon: Cake, onClick: () => navigate("/birthdays") },
  ];

  return (
    <SectionCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-[#154d78]/30 hover:bg-[#154d78]/5"
          >
            <Icon className="h-5 w-5 text-[#154d78]" strokeWidth={2} />
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}