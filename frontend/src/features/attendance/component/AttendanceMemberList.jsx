import { Check, Search, UserPlus, Users, X } from "lucide-react";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { memberName } from "../attendanceUtils";

export default function AttendanceMemberList({
    members,
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
}) {
    return (
        <div>
            <div className="grid grid-cols-1 gap-3 border-b border-gray-100 pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_13rem] lg:items-end">
                <Input
                    icon={Search}
                    label="Find a member"
                    placeholder="Search members by name"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />

                <Select
                    label="Category"
                    value={categoryFilter}
                    onChange={(event) =>
                        onCategoryFilterChange(event.target.value)
                    }
                    options={[
                        { value: "Adult", label: "Adults" },
                        { value: "Youth", label: "Youth" },
                        { value: "Teenager", label: "Teenagers" },
                        { value: "Children", label: "Children" },
                    ]}
                    placeholder="All categories"
                />

                <Select
                    label="Sort by"
                    value={sortBy}
                    onChange={(event) =>
                        onSortChange(event.target.value)
                    }
                    options={[
                        { value: "name", label: "Member name" },
                        { value: "status", label: "Attendance status" },
                    ]}
                />
            </div>

            {/* Desktop */}
            <div className="mt-5 hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)] border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <span>Member</span>
                    <span>Attendance</span>
                </div>

                {members.map((member) => (
                    <div
                        key={member.id}
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)] items-center gap-4 border-b border-gray-100 px-5 py-3 last:border-b-0"
                    >
                        <MemberIdentity member={member} />

                        <AttendanceControls
                            status={attendance[member.id]}
                            onChange={(nextStatus) =>
                                onStatusChange(member.id, nextStatus)
                            }
                        />
                    </div>
                ))}

                {!members.length && (
                    <div className="p-6">
                        <EmptyState
                            icon={Users}
                            title="No members found"
                            description="Try a different name search."
                        />
                    </div>
                )}
            </div>

            {/* Mobile */}
            <div className="mt-5 grid gap-3 md:hidden">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                        <div className="space-y-3">
                            <MemberIdentity member={member} />

                            <MobileAttendanceControls
                                status={attendance[member.id]}
                                onChange={(nextStatus) =>
                                    onStatusChange(member.id, nextStatus)
                                }
                            />
                        </div>
                    </div>
                ))}

                {!members.length && (
                    <EmptyState
                        icon={Users}
                        title="No members found"
                        description="Try a different name search."
                    />
                )}
            </div>

            {/* Unregistered attendee */}
            <div className="mt-6 rounded-xl border border-dashed border-[#154d78]/30 bg-[#154d78]/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <UserPlus className="h-4 w-4 text-[#154d78]" />
                    Record Unregistered Attendee
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                        placeholder="Attendee name"
                        value={newAttendee}
                        onChange={(event) =>
                            onNewAttendeeChange(event.target.value)
                        }
                        onKeyDown={(event) =>
                            event.key === "Enter" &&
                            onAddUnregistered()
                        }
                    />

                    <Button
                        type="button"
                        onClick={onAddUnregistered}
                    >
                        <UserPlus className="h-4 w-4" />
                        Add present
                    </Button>
                </div>

                {unregistered.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {unregistered.map((attendee) => (
                            <span
                                key={attendee.id}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm"
                            >
                                {attendee.name}

                                <button
                                    type="button"
                                    aria-label={`Remove ${attendee.name}`}
                                    onClick={() =>
                                        onRemoveUnregistered(
                                            attendee.id
                                        )
                                    }
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MemberIdentity({ member }) {
    const initials = getInitials(memberName(member));

    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10 text-sm font-medium text-[#154d78]">
                {initials}
            </div>

            <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                    {memberName(member)}
                </p>

                <p className="mt-0.5 text-xs font-normal text-gray-500">
                    {member.category || "Member"}
                </p>
            </div>
        </div>
    );
}

function AttendanceControls({ status, onChange }) {
    const currentStatus = status || "not-recorded";

    const toggleStatus = (nextStatus) => {
        if (currentStatus === nextStatus) {
            onChange("not-recorded");
        } else {
            onChange(nextStatus);
        }
    };

    return (
        <div className="flex w-full gap-2">
            <AttendanceButton
                label="Present"
                active={currentStatus === "present"}
                type="present"
                onClick={() => toggleStatus("present")}
            />

            <AttendanceButton
                label="Absent"
                active={currentStatus === "absent"}
                type="absent"
                onClick={() => toggleStatus("absent")}
            />
        </div>
    );
}

function AttendanceButton({
    label,
    active,
    type,
    onClick,
}) {
    const isPresent = type === "present";

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#154d78]/20 ${
                active
                    ? isPresent
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"
            }`}
        >
            {label}
        </button>
    );
}

function MobileAttendanceControls({ status, onChange }) {
    const currentStatus = status || "not-recorded";

    const toggleStatus = (nextStatus) => {
        if (currentStatus === nextStatus) {
            onChange("not-recorded");
        } else {
            onChange(nextStatus);
        }
    };

    return (
        <div className="grid w-full grid-cols-2 gap-2">
            <button
                type="button"
                aria-label={
                    currentStatus === "present"
                        ? "Present. Click to clear"
                        : "Mark present"
                }
                aria-pressed={currentStatus === "present"}
                onClick={() => toggleStatus("present")}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#154d78]/20 ${
                    currentStatus === "present"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
            >
                <Check
                    className="h-4 w-4"
                    strokeWidth={2.5}
                />
                <span>Present</span>
            </button>

            <button
                type="button"
                aria-label={
                    currentStatus === "absent"
                        ? "Absent. Click to clear"
                        : "Mark absent"
                }
                aria-pressed={currentStatus === "absent"}
                onClick={() => toggleStatus("absent")}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#154d78]/20 ${
                    currentStatus === "absent"
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                }`}
            >
                <X
                    className="h-4 w-4"
                    strokeWidth={2.5}
                />
                <span>Absent</span>
            </button>
        </div>
    );
}

function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}
