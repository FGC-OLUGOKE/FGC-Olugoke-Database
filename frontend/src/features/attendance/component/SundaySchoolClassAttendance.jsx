import { useMemo, useState } from "react";

import {
  Check,
  ClipboardList,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import SectionCard from "../../../components/ui/SectionCard";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/ToastProvider";

/*
 * TEMPORARY FRONTEND DATA
 *
 * Eventually this comes from:
 *
 * GET /members?classId=cdc-1
 *
 * The important thing is that class membership is explicit.
 */
const DEFAULT_CLASS_MEMBERS = {
  "cdc-1": [
    {
      id: "member-001",
      firstName: "Daniel",
      lastName: "Adeyemi",
    },
    {
      id: "member-002",
      firstName: "David",
      lastName: "Johnson",
    },
    {
      id: "member-003",
      firstName: "Michael",
      lastName: "Smith",
    },
    {
      id: "member-004",
      firstName: "Samuel",
      lastName: "Williams",
    },
  ],

  "cdc-2": [
    {
      id: "member-005",
      firstName: "Joshua",
      lastName: "Brown",
    },
    {
      id: "member-006",
      firstName: "John",
      lastName: "Okafor",
    },
    {
      id: "member-007",
      firstName: "Peter",
      lastName: "James",
    },
  ],

  "cdc-3": [
    {
      id: "member-008",
      firstName: "Emmanuel",
      lastName: "Ade",
    },
    {
      id: "member-009",
      firstName: "Samuel",
      lastName: "Cole",
    },
    {
      id: "member-010",
      firstName: "David",
      lastName: "Paul",
    },
  ],

  "next-gen": [
    {
      id: "member-011",
      firstName: "Grace",
      lastName: "Joseph",
    },
    {
      id: "member-012",
      firstName: "Esther",
      lastName: "Daniel",
    },
  ],

  "youth-class": [
    {
      id: "member-013",
      firstName: "Mary",
      lastName: "Johnson",
    },
    {
      id: "member-014",
      firstName: "Blessing",
      lastName: "Okoro",
    },
  ],

  "adult-class": [
    {
      id: "member-015",
      firstName: "James",
      lastName: "Adekunle",
    },
    {
      id: "member-016",
      firstName: "Sarah",
      lastName: "Williams",
    },
    {
      id: "member-017",
      firstName: "Paul",
      lastName: "Eze",
    },
  ],

  "yoruba-class": [
    {
      id: "member-018",
      firstName: "Adebayo",
      lastName: "Ogunleye",
    },
    {
      id: "member-019",
      firstName: "Funmi",
      lastName: "Adeola",
    },
  ],
};

function getMemberName(member) {
  return `${member.firstName} ${member.lastName}`.trim();
}

export default function SundaySchoolClassAttendance({
  session,
  classItem,
  members = DEFAULT_CLASS_MEMBERS[classItem?.classId] || [],
  existingAttendance = {},
  onSave,
  isSaving = false,
}) {
  const toast = useToast();

  const [search, setSearch] = useState("");

  /*
   * Attendance state:
   *
   * {
   *   "member-001": "present",
   *   "member-002": "absent"
   * }
   *
   * Members that haven't been selected yet are undefined.
   */
  const [attendance, setAttendance] =
    useState(existingAttendance);

  const filteredMembers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return members;
    }

    return members.filter((member) =>
      getMemberName(member)
        .toLowerCase()
        .includes(searchTerm),
    );
  }, [members, search]);

  const presentCount = useMemo(() => {
    return members.filter(
      (member) => attendance[member.id] === "present",
    ).length;
  }, [members, attendance]);

  const absentCount = useMemo(() => {
    return members.filter(
      (member) => attendance[member.id] === "absent",
    ).length;
  }, [members, attendance]);

  const unrecordedCount =
    members.length - presentCount - absentCount;

  function setMemberAttendance(memberId, status) {
    setAttendance((previous) => ({
      ...previous,
      [memberId]: status,
    }));
  }

  function markAllPresent() {
    const nextAttendance = {};

    members.forEach((member) => {
      nextAttendance[member.id] = "present";
    });

    setAttendance(nextAttendance);
  }

  function clearAttendance() {
    setAttendance({});
  }

  async function handleSave() {
    if (isSaving) return;
    /*
     * Don't allow saving while some members haven't
     * been given an attendance status.
     */
    if (unrecordedCount > 0) {
      toast.error(
        `${unrecordedCount} member${
          unrecordedCount === 1 ? "" : "s"
        } still need${
          unrecordedCount === 1 ? "s" : ""
        } an attendance status.`,
      );

      return;
    }

    const payload = {
      sessionId: session?.id,
      classId: classItem?.classId,

      attendance: members.map((member) => ({
        memberId: member.id,
        status: attendance[member.id],
      })),
    };

    try {
      await onSave?.(payload);

      toast.success("Attendance saved successfully.");
    } catch (error) {
      console.error(error);
    }
  }

  if (!classItem) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No class selected"
        description="Select a Sunday School class to record attendance."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <SectionCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#4a2969]/10">
              <Users
                className="h-5 w-5 text-[#4a2969]"
                strokeWidth={2}
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {classItem.className}
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                {session?.date || "Attendance session"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-2xl font-semibold text-gray-900">
              {presentCount}
              <span className="text-sm font-normal text-gray-400">
                {" "}
                / {members.length}
              </span>
            </p>

            <p className="text-xs text-gray-400">
              Present
            </p>
          </div>
        </div>
      </SectionCard>

      {/* SUMMARY */}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-400">
            Present
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {presentCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-400">
            Absent
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {absentCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-400">
            Unrecorded
          </p>

          <p className="mt-1 text-lg font-semibold text-gray-900">
            {unrecordedCount}
          </p>
        </div>
      </div>

      {/* MEMBER LIST */}

      <SectionCard title="Members">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />

            <Input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={markAllPresent}
              disabled={!members.length}
            >
              <Check
                className="h-4 w-4"
                strokeWidth={2}
              />

              Mark all present
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={clearAttendance}
              disabled={!Object.keys(attendance).length}
            >
              <X
                className="h-4 w-4"
                strokeWidth={2}
              />

              Clear
            </Button>
          </div>
        </div>

        {filteredMembers.length > 0 ? (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
            {filteredMembers.map((member) => {
              const status = attendance[member.id];

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* MEMBER */}

                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {member.firstName?.[0]}
                      {member.lastName?.[0]}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {getMemberName(member)}
                      </p>

                      <p className="text-xs text-gray-400">
                        Member
                      </p>
                    </div>
                  </div>

                  {/* STATUS */}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMemberAttendance(
                          member.id,
                          "present",
                        )
                      }
                      className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition ${
                        status === "present"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <Check
                        className="h-4 w-4"
                        strokeWidth={2}
                      />

                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setMemberAttendance(
                          member.id,
                          "absent",
                        )
                      }
                      className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition ${
                        status === "absent"
                          ? "border-[#9e263b]/20 bg-[#9e263b]/5 text-[#9e263b]"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <X
                        className="h-4 w-4"
                        strokeWidth={2}
                      />

                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No members found"
            description="No members match your search."
          />
        )}
      </SectionCard>

      {/* FOOTER */}

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserCheck
            className="h-4 w-4 text-[#4a2969]"
            strokeWidth={2}
          />

          {unrecordedCount > 0 ? (
            <span>
              {unrecordedCount} member
              {unrecordedCount === 1 ? "" : "s"} remaining
            </span>
          ) : (
            <span className="text-green-600">
              All members recorded
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !members.length}
          isLoading={isSaving}
          loadingLabel="Saving..."
        >
          <Check
            className="h-4 w-4"
            strokeWidth={2}
          />

          {isSaving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
}
