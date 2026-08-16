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
      </div>
    </div>
  );
}
