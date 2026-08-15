import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";

export default function BirthdayHeader({ todayCount, weekCount, monthCount }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Upcoming Birthdays</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track members' upcoming birthdays and celebrate with them on time.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/members")} className="sm:w-auto">
          View Members
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
        <span>
          <span className="font-semibold text-gray-900">{todayCount}</span> today
        </span>
        <span className="text-gray-300">·</span>
        <span>
          <span className="font-semibold text-gray-900">{weekCount}</span> this week
        </span>
        <span className="text-gray-300">·</span>
        <span>
          <span className="font-semibold text-gray-900">{monthCount}</span> this month
        </span>
      </div>
    </div>
  );
}
