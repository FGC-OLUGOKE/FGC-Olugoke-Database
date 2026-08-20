import Button from "../../../components/ui/Button";

/**
 * DashboardHeader
 *
 * `scopeLabel`, when provided (e.g. "Youth Category" or "Media
 * Department"), adjusts the greeting to make it obvious this is a
 * scoped view rather than the full church dashboard — the doc's
 * core principle is that each role's "main view should always focus
 * on their assigned [category/department]," not just have its data
 * quietly filtered with no visual signal that it's filtered at all.
 */
export default function DashboardHeader({ adminFirstName = "Pastor", scopeLabel, showAddMember = true, onAddMember }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {scopeLabel ? `${scopeLabel} Dashboard` : `Welcome back, ${adminFirstName}`}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {scopeLabel
            ? `Here's what's happening in ${scopeLabel} today.`
            : "Here's what's happening across the church today."}
        </p>
      </div>
      {showAddMember && (
        <Button variant="primary" onClick={onAddMember} className="sm:w-auto">
          + Add Member
        </Button>
      )}
    </div>
  );
}