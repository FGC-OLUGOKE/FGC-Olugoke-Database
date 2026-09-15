import { useEffect, useMemo, useState } from "react";

import {
  Building2,
  Check,
  Search,
  Trash2,
  UserCircle2,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react";

import Drawer from "../../../components/ui/Drawer";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../components/ui/ToastProvider";

import {
  assignMemberToDepartment,
  removeMemberFromDepartment,
  promoteMemberToAdmin,
} from "../../members/api";

/**
 * DepartmentDetailsDrawer
 *
 * Handles department-level management:
 *
 * - View department information
 * - Edit department name/description
 * - Assign/change department leader
 * - View department members
 * - Add members to department
 * - Remove members from department
 * - Request department deletion
 *
 * No member is created here.
 * Members already exist in the church database.
 *
 * Delete confirmation is handled by DepartmentsPage.
 */
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
        : false,
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

        const fullName =
          `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();

        const email = (member.email || "").toLowerCase();

        return fullName.includes(query) || email.includes(query);
      });
  }, [members, department, memberSearch]);

  const departmentAdminCandidates = departmentMembers.filter(
    (member) => member.email,
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
        : [...previous, memberId],
    );
  }

  async function handleAddMembers() {
    if (!department || selectedMembers.length === 0 || isSavingMembers) return;

    setIsSavingMembers(true);

    try {
      await Promise.all(
        selectedMembers.map((memberId) =>
          assignMemberToDepartment(memberId, department.name),
        ),
      );

      toast.success(
        `${selectedMembers.length} member${
          selectedMembers.length === 1 ? "" : "s"
        } added to ${department.name}.`,
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
    if (!department || !memberPendingRemove || isRemovingMember) return;

    setIsRemovingMember(true);

    try {
      await removeMemberFromDepartment(
        memberPendingRemove.id,
        department.name,
      );

      toast.success(
        `${getMemberName(memberPendingRemove)} was removed from ${
          department.name
        }.`,
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
        title={department.name}
        widthClass="md:max-w-2xl"
        desktopModal
      >
        <div className="flex min-h-full flex-col">
          <div className="space-y-6 px-5 py-5">
            {/* Department overview */}
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#4a2969]/10">
                  <Building2
                    className="h-6 w-6 text-[#4a2969]"
                    strokeWidth={2}
                  />
                </div>
                {onViewDepartment && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onViewDepartment(department)}
                  >
                    View Department
                  </Button>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {department.name}
                    </h3>

                    {canEditDepartment && (
                      <button
                        type="button"
                        onClick={() => onEditDetails?.(department)}
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[#154d78] transition hover:bg-[#154d78]/10"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {department.description ||
                      "No description has been added for this department."}
                  </p>

                  <div className="mt-3">
                    <Badge tone="info">
                      {departmentMembers.length} member
                      {departmentMembers.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* Department Admin */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Department Admin
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Select a department member with an email address.
                  </p>
                </div>

                <UserCircle2 className="h-5 w-5 text-[#154d78]" />
              </div>

              {canManageAdmin && departmentAdminCandidates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-500">
                  Add a member with an email address before appointing a Department Admin.
                </div>
              ) : canManageAdmin ? (
                <div className="space-y-3">
                  <Select
                    value={selectedMemberAdminId}
                    onChange={(event) => setSelectedMemberAdminId(event.target.value)}
                    options={[
                      { value: "", label: "Select a department member" },
                      ...departmentAdminCandidates.map((member) => ({
                        value: String(member.id),
                        label: `${getMemberName(member)} (${member.email})`,
                      })),
                    ]}
                  />
                  <Button
                    type="button"
                    disabled={!selectedMemberAdminId || isAppointingMember}
                    onClick={async () => {
                      setIsAppointingMember(true);
                      try {
                        await onAppointMember?.(department.id, Number(selectedMemberAdminId));
                        setSelectedMemberAdminId("");
                      } finally {
                        setIsAppointingMember(false);
                      }
                    }}
                  >
                    {isAppointingMember
                      ? "Creating account..."
                      : department.departmentAdmin
                        ? "Replace Department Admin"
                        : "Appoint Department Admin"}
                  </Button>
                </div>
              ) : (
                <p className="rounded-xl border border-gray-200 px-4 py-4 text-sm text-gray-500">
                  {department.departmentAdmin
                    ? `${department.departmentAdmin.name} is the Department Admin.`
                    : "No Department Admin appointed."}
                </p>
              )}
            </section>

            {/* Members */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Department Members
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Members assigned to this department.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsAddingMembers((previous) => !previous);
                    setSelectedMembers([]);
                    setMemberSearch("");
                  }}
                >
                  <UserPlus className="h-4 w-4" />

                  {isAddingMembers ? "Cancel" : "Add Members"}
                </Button>
              </div>

              {/* Add members panel */}
              {isAddingMembers && (
                <div className="mb-4 rounded-2xl border border-[#154d78]/15 bg-[#154d78]/5 p-4">
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

                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {availableMembers.length === 0 ? (
                      <div className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500">
                        No members available.
                      </div>
                    ) : (
                      availableMembers.map((member) => {
                        const isSelected = selectedMembers.includes(member.id);

                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleMember(member.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition ${
                              isSelected
                                ? "border-[#154d78] ring-2 ring-[#154d78]/10"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {member.picture ? (
                              <img
                                src={member.picture}
                                alt={getMemberName(member)}
                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                                <Users className="h-5 w-5 text-gray-400" />
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
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#154d78]/10 pt-4">
                      <p className="text-xs text-gray-600">
                        {selectedMembers.length} selected
                      </p>

                      <Button
                        type="button"
                        onClick={handleAddMembers}
                        disabled={isSavingMembers}
                      >
                        <UserPlus className="h-4 w-4" />

                        {isSavingMembers ? "Adding..." : "Add Selected"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Current members */}
              {departmentMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
                  <Users className="mx-auto h-6 w-6 text-gray-300" />

                  <p className="mt-2 text-sm font-medium text-gray-700">
                    No members assigned
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Use "Add Members" to assign members to this department.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                  {departmentMembers.map((member) => {
                    const memberName = getMemberName(member);
                    const isLeader = department.leader === memberName;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {member.picture ? (
                          <img
                            src={member.picture}
                            alt={memberName}
                            className="h-10 w-10 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                            <UserCircle2 className="h-5 w-5 text-gray-400" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {memberName}
                            </p>

                            {isLeader && (
                              <Badge tone="info">Leader</Badge>
                            )}
                          </div>

                          <p className="truncate text-xs text-gray-500">
                            {member.email || member.phone || "No contact"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setMemberPendingRemove(member)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-[#9e263b]"
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
            </section>
          </div>

          {/* Bottom actions */}
          <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>

            {canEditDepartment && (
              <Button
                type="button"
                variant="danger"
                onClick={() => onDelete?.(department)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Department
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      {/* Remove member confirmation */}
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