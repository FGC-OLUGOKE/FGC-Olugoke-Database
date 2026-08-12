import { Construction } from "lucide-react";
import EmptyState from "../ui/EmptyState";

/**
 * ComingSoon
 *
 * Placeholder rendered for every nav item that isn't built yet
 * (Dashboard, Departments, Attendance, ...). Keeps every Sidebar/
 * MobileNav link pointing at a real page instead of a dead link or
 * a 404, without pretending the module exists.
 */
export default function ComingSoon({ title }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">
        This part of the app hasn't been built yet.
      </p>

      <div className="mt-6">
        <EmptyState
          icon={Construction}
          title={`${title} is coming soon`}
          description="Check back once this module has been built out."
        />
      </div>
    </div>
  );
}