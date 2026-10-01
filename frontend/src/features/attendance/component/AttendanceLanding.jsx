import { ChevronDown, ClipboardCheck } from "lucide-react";
import AttendanceNavigation from "./AttendanceNavigation";

export default function AttendanceLanding({
  attendanceTypes,
  onSelectType,
}) {
  return (
    <div className="space-y-6">
      <div>
        <AttendanceNavigation />
        <div className="mt-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-[#154d78]" />
          <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Choose a gathering to record attendance.
        </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {attendanceTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelectType(type.id)}
            className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: type.color }}
            >
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{type.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">{type.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#154d78]">
              Open attendance
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}
