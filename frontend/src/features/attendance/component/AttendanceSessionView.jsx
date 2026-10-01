import { useRef } from "react";
import { ArrowLeft, CalendarDays, Check, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import SectionCard from "../../../components/ui/SectionCard";
import AttendanceMemberList from "./AttendanceMemberList";
import AttendanceNavigation from "./AttendanceNavigation";

export default function AttendanceSessionView({
  type,
  checkpoint,
  date,
  onDateChange,
  onBack,
  onCheckpointChange,
  totals,
  visibleMembers,
  attendance,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  categoryFilter,
  onCategoryFilterChange,
  onStatusChange,
  newAttendee,
  onNewAttendeeChange,
  onAddUnregistered,
  unregistered,
  onRemoveUnregistered,
  onSave,
  onSaveDraft,
  isSaving,
  sessionStatus = "draft",
  isEditing = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <AttendanceNavigation />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#154d78]"
          >
            <ArrowLeft className="h-4 w-4" />
            All attendance
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">{type.title}</h1>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
              {sessionStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Record members and review previous sessions.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <button
            type="button"
            onClick={() => navigate("/attendance/sessions")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#154d78]/20 bg-[#154d78]/5 px-4 text-sm font-semibold text-[#154d78] transition hover:border-[#154d78]/40 hover:bg-[#154d78]/10"
          >
            <History className="h-4 w-4" />
            View saved sessions
          </button>
          <DateField value={date} onChange={onDateChange} />
        </div>
      </div>

      {type.id === "sunday-service" && (
        <div className="flex gap-2 border-b border-gray-200">
          <TabButton
            active={checkpoint === "pre-sermon"}
            onClick={() => onCheckpointChange("pre-sermon")}
          >
            Pre-Sermon
          </TabButton>
          <TabButton
            active={checkpoint === "post-sermon"}
            onClick={() => onCheckpointChange("post-sermon")}
          >
            Post-Sermon
          </TabButton>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total members" value={totals.total} color="text-gray-900" />
        <Stat label="Present" value={totals.present} color="text-emerald-700" />
        <Stat label="Absent" value={totals.absent} color="text-[#9e263b]" />
      </div>

      <SectionCard title="Member attendance">
        <AttendanceMemberList
          members={visibleMembers}
          attendance={attendance}
          search={search}
          onSearchChange={onSearchChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          onStatusChange={onStatusChange}
          newAttendee={newAttendee}
          onNewAttendeeChange={onNewAttendeeChange}
          onAddUnregistered={onAddUnregistered}
          unregistered={unregistered}
          onRemoveUnregistered={onRemoveUnregistered}
        />
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onSaveDraft} disabled={isSaving}>
            Save draft
          </Button>
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Save changes" : "Save attendance"}
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </SectionCard>

    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-3 text-sm font-semibold ${
        active
          ? "border-[#154d78] text-[#154d78]"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function DateField({ value, onChange }) {
  const inputRef = useRef(null);
  const formattedDate = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date";

  function openPicker() {
    if (typeof inputRef.current?.showPicker === "function") {
      inputRef.current.showPicker();
    } else {
      inputRef.current?.focus();
    }
  }

  return (
    <div className="w-full sm:w-56">
      <p className="mb-1.5 text-sm font-medium text-gray-700">Attendance date</p>
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          className="flex h-11 w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 text-left transition hover:border-[#154d78] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[#154d78]" />
          <span className="text-sm font-medium text-gray-800">{formattedDate}</span>
        </button>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          aria-label="Attendance date"
        />
      </div>
    </div>
  );
}
