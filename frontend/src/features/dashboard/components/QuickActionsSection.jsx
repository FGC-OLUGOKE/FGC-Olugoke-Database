import { useNavigate } from "react-router-dom";
import { UserPlus, ClipboardCheck, CalendarPlus, Users, Cake } from "lucide-react";
import SectionCard from "../../../components/ui/SectionCard";
import { isSuperAdmin, canCreateMember, isDepartmentAdmin } from "../../../lib/permissions";

/**
 * QuickActionsSection
 *
 * Actions are now filtered by role: recording attendance and adding
 * events aren't in any role's permission list yet except Super
 * Admin's implied full access, so they're hidden for everyone else
 * rather than linking to an action the role isn't meant to perform.
 * Birthdays isn't in Department Admin's allowed nav paths, so that
 * shortcut is hidden for them too.
 */
export default function QuickActionsSection({ user, onAddMember }) {
  const navigate = useNavigate();

  const actions = [
    canCreateMember(user) && { label: "Add Member", icon: UserPlus, onClick: onAddMember },
    isSuperAdmin(user) && {
      label: "Record Attendance",
      icon: ClipboardCheck,
      onClick: () => navigate("/attendance"),
    },
    { label: "View Members", icon: Users, onClick: () => navigate("/members") },
    !isDepartmentAdmin(user) && {
      label: "View Birthdays",
      icon: Cake,
      onClick: () => navigate("/birthdays"),
    },
  ].filter(Boolean);

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