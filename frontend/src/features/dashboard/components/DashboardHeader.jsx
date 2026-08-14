import Button from "../../../components/ui/Button";

export default function DashboardHeader({ adminFirstName = "Pastor", onAddMember }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {adminFirstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening across the church today.
        </p>
      </div>
      <Button variant="primary" onClick={onAddMember} className="sm:w-auto">
        + Add Member
      </Button>
    </div>
  );
}