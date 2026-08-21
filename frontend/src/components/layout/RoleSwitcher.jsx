import { ChevronDown, ShieldCheck } from "lucide-react";
import DropdownMenu, { DropdownMenuItem } from "../ui/DropdownMenu";
import { useAuth } from "../../features/auth/AuthContext";
import { getRoleLabel } from "../../lib/permissions";

/**
 * RoleSwitcher
 *
 * Dev-only — lets you preview the app as any mock account without a
 * real login system. This component (and the setCurrentUser mock it
 * relies on) has no real-world equivalent once actual authentication
 * exists — delete it then. Nothing else in the app imports from
 * here, so removing it is a clean, contained deletion.
 */
export default function RoleSwitcher() {
  const { user, allUsers, switchUser } = useAuth();
  if (!user) return null;

  return (
    <DropdownMenu
      width={260}
      trigger={
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Preview as</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      }
    >
      {(close) => (
        <>
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Dev only — preview role
          </p>
          {allUsers.map((u) => (
            <DropdownMenuItem
              key={u.id}
              label={`${u.name} — ${getRoleLabel(u)}`}
              onClick={() => {
                switchUser(u.id);
                close();
              }}
            />
          ))}
        </>
      )}
    </DropdownMenu>
  );
}