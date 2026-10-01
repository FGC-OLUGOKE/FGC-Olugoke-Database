
import { useMemo, useState } from "react";

import {
    CalendarDays,
    Check,
    ChevronDown,
    CircleDashed,
    History,
    UserPlus,
    Users,
    X,
} from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { labelForType, memberName } from "../attendanceUtils";

export default function AttendanceHistoryPanel({
    members,
    sessions,
    filter,
    onFilterChange,
    type,
    typeFilter = "",
    onTypeFilterChange,
    checkpointFilter = "",
    onCheckpointFilterChange,
    fromDate = "",
    onFromDateChange,
    toDate = "",
    onToDateChange,
    onClearFilters,
}) {
    const [sort, setSort] = useState("newest");

    // The panel now manages its own expanded card state.
    // This prevents the parent from preventing a card from collapsing.
    const [expandedSessionId, setExpandedSessionId] = useState(null);

    const filteredSessions = useMemo(
        () => sessions.filter((session) => {
            if (typeFilter && session.type !== typeFilter) return false;
            if (checkpointFilter && session.checkpoint !== checkpointFilter) return false;
            if (filter && !session.date?.startsWith(filter)) return false;
            if (fromDate && session.date < fromDate) return false;
            if (toDate && session.date > toDate) return false;
            return true;
        }),
        [checkpointFilter, filter, fromDate, sessions, toDate, typeFilter],
    );

    const sortedSessions = useMemo(
        () =>
            [...filteredSessions].sort((a, b) => {
                if (sort === "oldest") {
                    return new Date(a.date) - new Date(b.date);
                }

                if (sort === "type") {
                    return labelForType(
                        a.type,
                        a.checkpoint,
                    ).localeCompare(
                        labelForType(
                            b.type,
                            b.checkpoint,
                        ),
                    );
                }

                return new Date(b.date) - new Date(a.date);
            }),
        [filteredSessions, sort],
    );

    const handleToggleSession = (sessionId) => {
        setExpandedSessionId((currentId) => {
            const nextId =
                currentId === sessionId
                    ? null
                    : sessionId;

            return nextId;
        });
    };

    return (
        <div>
            <div className="mb-5 border-b border-gray-200 pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#154d78]/10">
                            <History className="h-5 w-5 text-[#154d78]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900">
                                    {type?.title || "Attendance"} history
                                </h3>
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                    {filteredSessions.length} {filteredSessions.length === 1 ? "session" : "sessions"}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Review previous attendance records and session totals.
                            </p>
                        </div>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[42rem] lg:grid-cols-5">
                        <Input
                            type="month"
                            label="Month"
                            aria-label="Filter attendance history by month"
                            value={filter}
                            onChange={(event) => onFilterChange(event.target.value)}
                        />
                        <Select
                            label="Type"
                            aria-label="Filter attendance history by type"
                            value={typeFilter}
                            onChange={(event) => onTypeFilterChange?.(event.target.value)}
                            options={[
                                { value: "sunday-service", label: "Sunday Service" },
                                { value: "bible-study", label: "Bible Study" },
                                { value: "prayer-meeting", label: "Prayer Meeting" },
                            ]}
                            placeholder="All types"
                        />
                        {(!typeFilter || typeFilter === "sunday-service") && (
                            <Select
                                label="Checkpoint"
                                aria-label="Filter Sunday checkpoint"
                                value={checkpointFilter}
                                onChange={(event) => onCheckpointFilterChange?.(event.target.value)}
                                options={[
                                    { value: "pre-sermon", label: "Pre-Sermon" },
                                    { value: "post-sermon", label: "Post-Sermon" },
                                ]}
                                placeholder="All checkpoints"
                            />
                        )}
                        <Input
                            type="date"
                            label="From"
                            value={fromDate}
                            onChange={(event) => onFromDateChange?.(event.target.value)}
                        />
                        <Input
                            type="date"
                            label="To"
                            value={toDate}
                            onChange={(event) => onToDateChange?.(event.target.value)}
                        />
                        <Select
                            label="Sort"
                            aria-label="Sort attendance history"
                            value={sort}
                            onChange={(event) => setSort(event.target.value)}
                            options={[
                                { value: "newest", label: "Newest first" },
                                { value: "oldest", label: "Oldest first" },
                                { value: "type", label: "Attendance type" },
                            ]}
                        />
                        {filter || typeFilter || checkpointFilter || fromDate || toDate ? (
                            <button
                                type="button"
                                onClick={() => onClearFilters?.()}
                                className="h-10 self-end rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                            >
                                Clear
                            </button>
                        ) : (
                            <span className="hidden h-10 sm:block" aria-hidden="true" />
                        )}
                    </div>
                </div>
            </div>

            {sortedSessions.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <EmptyState
                        icon={CalendarDays}
                        title="No attendance sessions"
                        description="Saved attendance sessions will appear here."
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedSessions.map((session) => (
                        <HistorySession
                            key={session.id}
                            session={session}
                            members={members}
                            isOpen={
                                expandedSessionId === session.id
                            }
                            onToggle={() =>
                                handleToggleSession(
                                    session.id,
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function HistorySession({
    session,
    members,
    isOpen,
    onToggle,
}) {
    const attendance = session.attendance || {};

    const registeredPresent = Object.values(attendance).filter(
        (status) => status === "present",
    ).length;

    const registeredAbsent = Object.values(attendance).filter(
        (status) => status === "absent",
    ).length;

    const registeredNotRecorded = members.filter(
        (member) =>
            !attendance[member.id] ||
            attendance[member.id] === "not-recorded",
    ).length;

    const totalMembers =
        session.totals?.total ??
        members.length;

    const presentCount =
        session.totals?.present ??
        registeredPresent;

    const absentCount =
        session.totals?.absent ??
        registeredAbsent;

    const notRecordedCount =
        session.totals?.notRecorded ??
        registeredNotRecorded;

    const unregisteredCount =
        session.unregisteredAttendees?.length || 0;

    const attendanceRate =
        totalMembers > 0
            ? Math.round(
                  (presentCount / totalMembers) * 100,
              )
            : 0;

    const sessionLabel =
        session.eventName ||
        labelForType(
            session.type,
            session.checkpoint,
        );

    const dateLabel = formatDate(session.date);
    const sessionStatus = session.status || "saved";
    const isLocked = sessionStatus === "submitted" || sessionStatus === "locked";
    const statusLabel = isLocked ? "Submitted" : sessionStatus === "draft" ? "Draft" : "Saved";

    return (
        <div
            className={`overflow-hidden rounded-xl border bg-white transition-all duration-200 ${
                isOpen
                    ? "border-[#154d78]/30 shadow-md"
                    : "border-gray-200 shadow-sm"
            }`}
        >
            {/* Clickable session header */}
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="block w-full p-4 text-left transition hover:bg-gray-50 sm:p-5"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#154d78]/10">
                            <CalendarDays className="h-5 w-5 text-[#154d78]" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-medium text-gray-900 sm:text-base">
                                    {sessionLabel}
                                </p>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                    isLocked
                                        ? "bg-gray-100 text-gray-500"
                                        : "bg-emerald-50 text-emerald-700"
                                }`}>
                                    {statusLabel}
                                </span>
                            </div>

                            <p className="mt-0.5 text-xs text-gray-500">
                                {dateLabel}
                            </p>
                        </div>
                    </div>

                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                            isOpen
                                ? "bg-[#154d78]/10 text-[#154d78]"
                                : "text-gray-400"
                        }`}
                    >
                        <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </div>
                </div>

                {/* Quick summary */}
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    <QuickStat
                        value={presentCount}
                        label="Present"
                        className="bg-emerald-50 text-emerald-700"
                    />

                    <QuickStat
                        value={absentCount}
                        label="Absent"
                        className="bg-red-50 text-red-700"
                    />

                    <QuickStat
                        value={notRecordedCount}
                        label="Not recorded"
                        className="bg-gray-100 text-gray-600"
                    />

                    <div className="hidden rounded-lg bg-[#154d78]/5 px-3 py-2 sm:block">
                        <p className="text-base font-medium text-[#154d78]">
                            {attendanceRate}%
                        </p>

                        <p className="text-[11px] text-gray-500">
                            Attendance
                        </p>
                    </div>
                </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50/70 p-4 sm:p-5">
                    <SessionDetails
                        session={session}
                        members={members}
                        presentCount={presentCount}
                        absentCount={absentCount}
                        notRecordedCount={notRecordedCount}
                        totalMembers={totalMembers}
                        attendanceRate={attendanceRate}
                        unregisteredCount={unregisteredCount}
                    />
                </div>
            )}
        </div>
    );
}

function SessionDetails({
    session,
    members,
    presentCount,
    absentCount,
    notRecordedCount,
    totalMembers,
    attendanceRate,
    unregisteredCount,
}) {
    const attendance = session.attendance || {};

    const presentMembers = members.filter(
        (member) =>
            attendance[member.id] === "present",
    );

    return (
        <div className="space-y-5">
            {/* Session overview */}
            <section>
                <p className="mb-3 text-sm font-medium text-gray-900">
                    Session overview
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <DetailStat
                        icon={Users}
                        label="Total members"
                        value={totalMembers}
                        iconClass="text-[#154d78]"
                        iconBg="bg-[#154d78]/10"
                    />

                    <DetailStat
                        icon={Check}
                        label="Present"
                        value={presentCount}
                        iconClass="text-emerald-600"
                        iconBg="bg-emerald-50"
                    />

                    <DetailStat
                        icon={X}
                        label="Absent"
                        value={absentCount}
                        iconClass="text-red-600"
                        iconBg="bg-red-50"
                    />

                    <DetailStat
                        icon={CircleDashed}
                        label="Not recorded"
                        value={notRecordedCount}
                        iconClass="text-gray-500"
                        iconBg="bg-gray-100"
                    />
                </div>
            </section>

            {/* Attendance rate */}
            <section className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            Attendance rate
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                            Registered members marked present
                        </p>
                    </div>

                    <p className="text-xl font-medium text-[#154d78]">
                        {attendanceRate}%
                    </p>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full rounded-full bg-[#154d78] transition-all duration-300"
                        style={{
                            width: `${Math.min(
                                attendanceRate,
                                100,
                            )}%`,
                        }}
                    />
                </div>
            </section>

            {/* Member attendance */}
            <section>
                <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900">
                        Member attendance
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                        Registered members marked present in this session.
                    </p>
                </div>

                <div className="space-y-2">
                    <MemberStatusSection
                        title="Present"
                        count={presentMembers.length}
                        members={presentMembers}
                        status="present"
                        emptyText="No registered members marked present."
                    />

                </div>
            </section>

            {/* Unregistered attendees */}
            {unregisteredCount > 0 && (
                <section className="rounded-xl border border-dashed border-[#154d78]/30 bg-white p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#154d78]/10">
                            <UserPlus className="h-4 w-4 text-[#154d78]" />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Unregistered attendees
                            </p>

                            <p className="text-xs text-gray-500">
                                People who attended but are not registered members.
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {session.unregisteredAttendees.map(
                            (attendee) => (
                                <div
                                    key={attendee.id}
                                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-medium text-[#154d78]">
                                        {getInitials(
                                            attendee.name,
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-800">
                                            {attendee.name}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Unregistered attendee
                                        </p>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

function MemberStatusSection({
    title,
    count,
    members,
    status,
    emptyText,
}) {
    const isPresent = status === "present";
    const isAbsent = status === "absent";

    const Icon = isPresent
        ? Check
        : isAbsent
          ? X
          : CircleDashed;

    const iconClass = isPresent
        ? "text-emerald-600"
        : isAbsent
          ? "text-red-600"
          : "text-gray-500";

    const iconBg = isPresent
        ? "bg-emerald-50"
        : isAbsent
          ? "bg-red-50"
          : "bg-gray-100";

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
                <div className="flex items-center gap-2">
                    <div
                        className={`flex h-7 w-7 items-center justify-center rounded-md ${iconBg}`}
                    >
                        <Icon
                            className={`h-3.5 w-3.5 ${iconClass}`}
                            strokeWidth={2.5}
                        />
                    </div>

                    <p className="text-sm font-medium text-gray-800">
                        {title}
                    </p>
                </div>

                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {count}
                </span>
            </div>

            {members.length > 0 ? (
                <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex min-w-0 items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-medium text-[#154d78]">
                                {getInitials(
                                    memberName(member),
                                )}
                            </div>

                            <p className="truncate text-sm text-gray-700">
                                {memberName(member)}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="px-3 py-3 text-xs text-gray-500">
                    {emptyText}
                </p>
            )}
        </div>
    );
}

function DetailStat({
    icon: Icon,
    label,
    value,
    iconClass,
    iconBg,
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
            >
                <Icon
                    className={`h-4 w-4 ${iconClass}`}
                    strokeWidth={2}
                />
            </div>

            <p className="mt-2 text-lg font-medium text-gray-900">
                {Number(value || 0).toLocaleString()}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
                {label}
            </p>
        </div>
    );
}

function QuickStat({
    value,
    label,
    className,
}) {
    return (
        <div
            className={`rounded-lg px-3 py-2 ${className}`}
        >
            <p className="text-base font-medium">
                {Number(value || 0).toLocaleString()}
            </p>

            <p className="text-[11px] opacity-75">
                {label}
            </p>
        </div>
    );
}

function formatDate(date) {
    if (!date) {
        return "Date not available";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getInitials(name) {
    return String(name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}
