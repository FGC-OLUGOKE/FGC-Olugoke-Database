import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Cake, Building2, ClipboardCheck, CalendarDays, ShieldAlert } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";

export default function QuickReportActions({ onAddMember }) {
  const navigate = useNavigate();
  const actions = [
    { label: "View All Members", icon: Users, onClick: () => navigate("/members") },
    { label: "Add Member", icon: UserPlus, onClick: onAddMember },
    { label: "View Birthdays", icon: Cake, onClick: () => navigate("/birthdays") },
    { label: "View Departments", icon: Building2, onClick: () => navigate("/departments") },
    { label: "View Attendance", icon: ClipboardCheck, onClick: () => navigate("/attendance") },
    { label: "View Events", icon: CalendarDays, onClick: () => navigate("/events") },
    { label: "View Incomplete Profiles", icon: ShieldAlert, onClick: () => navigate("/members") },
  ];

  return (
    <SectionCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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