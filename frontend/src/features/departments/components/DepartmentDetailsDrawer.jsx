import { useEffect, useMemo, useState } from "react";

import {
  ArrowUpRight,
  Check,
  Search,
  Trash2,
  UserCircle2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  assignMemberToDepartment,
  removeMemberFromDepartment,
} from "../../members/api";

export default function DepartmentDetailsDrawer({
  isOpen,
  department,
  members = [],
  onClose,
  onMembersChanged,
  onDelete,
  onEditDetails,
  canManageAdmin = false,
  canEditDepartment = true,
  onAppointMember,
  onViewDepartment,
}) {
  const toast = useToast();

  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSavingMembers, setIsSavingMembers] = useState(false);
  const [memberPendingRemove, setMemberPendingRemove] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [selectedMemberAdminId, setSelectedMemberAdminId] = useState("");
  const [isAppointingMember, setIsAppointingMember] = useState(false);

  useEffect(() => {
    if (!isOpen || !department) return;

    setIsAddingMembers(false);
    setMemberSearch("");
    setSelectedMembers([]);
    setMemberPendingRemove(null);
    setSelectedMemberAdminId("");
  }, [isOpen, department]);

  const departmentMembers = useMemo(() => {
    if (!department) return [];

    return members.filter((member) =>
      Array.isArray(member.departments)
        ? member.departments.includes(department.name)
        : false
    );
  }, [members, department]);

  const availableMembers = useMemo(() => {
    if (!department) return [];

    const query = memberSearch.trim().toLowerCase();

    return members
      .filter((member) => {
        const departments = Array.isArray(member.departments)
          ? member.departments
          : [];

        return !departments.includes(department.name);
      })
      .filter((member) => {
        if (!query) return true;

        const fullName = `${member.firstName || ""} ${
          member.lastName || ""
        }`.toLowerCase();

        const email = (member.email || "").toLowerCase();

        return fullName.includes(query) || email.includes(query);
      });
  }, [members, department, memberSearch]);

  const departmentAdminCandidates = departmentMembers.filter(
    (member) => member.email
  );

  function getMemberName(member) {
    return `${member.title ? `${member.title} ` : ""}${
      member.firstName || ""
    } ${member.lastName || ""}`.trim();
  }

  function toggleMember(memberId) {
    setSelectedMembers((previous) =>
      previous.includes(memberId)
        ? previous.filter((id) => id !== memberId)
        : [...previous, memberId]
    );
  }

  async function handleAddMembers() {
    if (!department || selectedMembers.length === 0 || isSavingMembers) {
      return;
    }

    setIsSavingMembers(true);

    try {
      await Promise.all(
        selectedMembers.map((memberId) =>
          assignMemberToDepartment(memberId, department.name)
        )
      );

      toast.success(
        `${selectedMembers.length} member${
          selectedMembers.length === 1 ? "" : "s"
        } added to ${department.name}.`
      );

      setSelectedMembers([]);
      setMemberSearch("");
      setIsAddingMembers(false);
      onMembersChanged?.();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't add the selected members. Try again.");
    } finally {
      setIsSavingMembers(false);
    }
  }

  async function handleRemoveMember() {
    if (!department || !memberPendingRemove || isRemovingMember) {
      return;
    }

    setIsRemovingMember(true);

    try {
      await removeMemberFromDepartment(
        memberPendingRemove.id,
        department.name
      );

      toast.success(
        `${getMemberName(memberPendingRemove)} was removed from ${
          department.name
        }.`
      );

      setMemberPendingRemove(null);
      onMembersChanged?.();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't remove this member. Try again.");
    } finally {
      setIsRemovingMember(false);
    }
  }

  if (!department) return null;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={"Department Overview"}
        widthClass="md:max-w-2xl"
        desktopModal
      >
        {/* Fixed drawer layout: only the content area scrolls */}
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
          {/* Scrollable Content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <div className="space-y-4 sm:space-y-5">
              {/* Department Header */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="h-1.5 bg-[#154d78]" />

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
                          {department.name}
                        </h2>

                        <span className="inline-flex shrink-0 items-center rounded-full bg-[#154d78]/10 px-2.5 py-1 text-xs font-semibold text-[#154d78]">
                          {departmentMembers.length}{" "}
                          {departmentMembers.length === 1
                            ? "member"
                            : "members"}
                        </span>
                      </div>

                      <p className="mt-2 max-w-xl text-sm leading-5 text-gray-500">
                        {department.description ||
                          "No description has been added for this department."}
                      </p>
                    </div>

                    {canEditDepartment && (
                      <button
                        type="button"
                        onClick={() => onEditDetails?.(department)}
                        className="shrink-0 cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#154d78]/20 hover:bg-[#154d78]/5 hover:text-[#154d78]"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {onViewDepartment && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onViewDepartment(department)}
                        className="cursor-pointer"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        View Department
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Department Admin */}
              <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Department Admin
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Manage the administrator responsible for this department.
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#154d78]/10">
                    <UserCircle2 className="h-5 w-5 text-[#154d78]" />
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {canManageAdmin &&
                  departmentAdminCandidates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                      <p className="text-sm font-medium text-gray-700">
                        No eligible members
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Add a department member with an email address before
                        appointing a Department Admin.
                      </p>
                    </div>
                  ) : canManageAdmin ? (
                    <div className="space-y-3">
                      <Select
                        value={selectedMemberAdminId}
                        onChange={(event) =>
                          setSelectedMemberAdminId(event.target.value)
                        }
                        options={[
                          {
                            value: "",
                            label: "Select a department member",
                          },
                          ...departmentAdminCandidates.map((member) => ({
                            value: String(member.id),
                            label: `${getMemberName(member)} (${member.email})`,
                          })),
                        ]}
                      />

                      <Button
                        type="button"
                        disabled={
                          !selectedMemberAdminId || isAppointingMember
                        }
                        onClick={async () => {
                          setIsAppointingMember(true);

                          try {
                            await onAppointMember?.(
                              department.id,
                              Number(selectedMemberAdminId)
                            );

                            setSelectedMemberAdminId("");
                          } finally {
                            setIsAppointingMember(false);
                          }
                        }}
                        className="w-full cursor-pointer sm:w-auto"
                      >
                        <UserPlus className="h-4 w-4" />

                        {isAppointingMember
                          ? "Creating account..."
                          : department.departmentAdmin
                          ? "Replace Department Admin"
                          : "Appoint Department Admin"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#154d78]/10">
                        <UserCircle2 className="h-5 w-5 text-[#154d78]" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                          Current Admin
                        </p>

                        <p className="truncate text-sm font-semibold text-gray-900">
                          {department.departmentAdmin
                            ? department.departmentAdmin.name
                            : "No Department Admin appointed"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Members */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Department Members
                      </h3>

                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        {departmentMembers.length}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Members currently assigned to this department.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingMembers((previous) => !previous);
                      setSelectedMembers([]);
                      setMemberSearch("");
                    }}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[#154d78] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#123f63] focus:outline-none focus:ring-2 focus:ring-[#154d78]/30"
                  >
                    <UserPlus className="h-3.5 w-3.5" />

                    <span className="hidden sm:inline">
                      {isAddingMembers ? "Cancel" : "Add Members"}
                    </span>

                    <span className="sm:hidden">
                      {isAddingMembers ? "Cancel" : "Add"}
                    </span>
                  </button>
                </div>

                {/* Add Members */}
                {isAddingMembers && (
                  <div className="border-b border-gray-100 bg-[#154d78]/[0.025] p-4 sm:p-5">
                    <div className="mb-4">
                      <Input
                        icon={Search}
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(event) =>
                          setMemberSearch(event.target.value)
                        }
                      />
                    </div>

                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {availableMembers.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center">
                          <Users className="mx-auto h-6 w-6 text-gray-300" />

                          <p className="mt-2 text-sm font-medium text-gray-700">
                            No members found
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Try another search term.
                          </p>
                        </div>
                      ) : (
                        availableMembers.map((member) => {
                          const isSelected = selectedMembers.includes(
                            member.id
                          );

                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => toggleMember(member.id)}
                              className={`flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border bg-white p-3 text-left transition sm:gap-3 ${
                                isSelected
                                  ? "border-[#154d78] bg-[#154d78]/[0.025] ring-2 ring-[#154d78]/10"
                                  : "border-gray-200 hover:border-[#154d78]/20 hover:bg-gray-50"
                              }`}
                            >
                              {member.picture ? (
                                <img
                                  src={member.picture}
                                  alt={getMemberName(member)}
                                  className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 sm:h-10 sm:w-10">
                                  <UserCircle2 className="h-5 w-5 text-gray-400" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {getMemberName(member)}
                                </p>

                                <p className="truncate text-xs text-gray-500">
                                  {member.email ||
                                    member.phone ||
                                    "No contact"}
                                </p>
                              </div>

                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                  isSelected
                                    ? "border-[#154d78] bg-[#154d78] text-white"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {selectedMembers.length > 0 && (
                      <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {selectedMembers.length} selected
                          </p>

                          <p className="text-xs text-gray-500">
                            Ready to add to this department
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={handleAddMembers}
                          disabled={isSavingMembers}
                          className="w-full cursor-pointer sm:w-auto"
                        >
                          <UserPlus className="h-4 w-4" />

                          {isSavingMembers ? "Adding..." : "Add Selected"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Members */}
                <div className="p-2 sm:p-3">
                  {departmentMembers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No members assigned
                      </p>

                      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-500">
                        Add members to start building this department's
                        member list.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {departmentMembers.map((member) => {
                        const memberName = getMemberName(member);
                        const isLeader = department.leader === memberName;

                        return (
                          <div
                            key={member.id}
                            className="group flex min-w-0 items-center gap-2 rounded-xl px-2 py-3 transition hover:bg-gray-50 sm:gap-3 sm:px-3"
                          >
                            {/* Profile Picture */}
                            {member.picture ? (
                              <img
                                src={member.picture}
                                alt={memberName}
                                className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 sm:h-10 sm:w-10">
                                <UserCircle2 className="h-5 w-5 text-gray-400" />
                              </div>
                            )}

                            {/* Member Information */}
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <p className="min-w-0 truncate text-sm font-medium text-gray-900">
                                  {memberName}
                                </p>

                                {isLeader && (
                                  <span className="shrink-0 rounded-full bg-[#154d78]/10 px-2 py-0.5 text-[10px] font-semibold text-[#154d78]">
                                    Leader
                                  </span>
                                )}
                              </div>

                              <p className="mt-0.5 truncate text-xs text-gray-500">
                                {member.email ||
                                  member.phone ||
                                  "No contact information"}
                              </p>
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setMemberPendingRemove(member)
                              }
                              className="shrink-0 cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-[#9e263b] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                              title="Remove from department"
                              aria-label={`Remove ${memberName} from department`}
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="sticky bottom-0 z-20 flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] sm:px-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 cursor-pointer"
            >
              Close
            </Button>

            {canEditDepartment && (
              <Button
                type="button"
                variant="danger"
                onClick={() => onDelete?.(department)}
                className="flex-1 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />

                <span className="sm:hidden">Delete</span>
                <span className="hidden sm:inline">Delete Department</span>
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={Boolean(memberPendingRemove)}
        title="Remove this member?"
        description={
          memberPendingRemove
            ? `Remove ${getMemberName(memberPendingRemove)} from ${
                department.name
              }? The member will remain in the church database.`
            : ""
        }
        confirmLabel={isRemovingMember ? "Removing..." : "Remove Member"}
        onConfirm={handleRemoveMember}
        onCancel={() => {
          if (!isRemovingMember) {
            setMemberPendingRemove(null);
          }
        }}
      />
    </>
  );
}