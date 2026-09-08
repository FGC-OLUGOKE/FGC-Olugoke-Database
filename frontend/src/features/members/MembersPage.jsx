import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Inbox,
} from "lucide-react";

import SearchBar from "./components/SearchBar";
import StatsCards from "./components/StatsCards";
import MemberList from "./components/MemberList";
import MemberDetailsDrawer from "./components/MemberDetailsDrawer";
import MemberForm from "./components/MemberForm";
import AssignMemberDrawer from "./components/AssignMemberDrawer";

import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Drawer from "../../components/ui/Drawer";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import FloatingActionButton from "../../components/ui/FloatingActionButton";
import LoadingState from "../../components/ui/LoadingState";

import { useToast } from "../../components/ui/ToastProvider";

import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  assignMemberToDepartment,
  removeMemberFromDepartment,
  promoteMemberToAdmin,
  demoteAdminToMember,
} from "./api";

import { useAuth } from "../auth/AuthContext";

import {
  getScopedMembers,
  canCreateMember,
  canEditMemberDirectly,
  canDeleteMemberDirectly,
  canRequestMemberEdit,
  canRequestMemberDelete,
  isDepartmentAdmin,
  isCategoryAdmin,
  getRoleLabel,
  canPromoteDemoteMembers,
} from "../../lib/permissions";

import { submitApprovalRequest } from "../approvals/api";
import { getDepartments } from "../departments/api";

export default function MembersPage() {
  const toast = useToast();
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] =
    useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("az");

  const [selectedMember, setSelectedMember] =
    useState(null);
  const [isDrawerOpen, setIsDrawerOpen] =
    useState(false);

  const [formMember, setFormMember] = useState(null);
  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [memberPendingDelete, setMemberPendingDelete] =
    useState(null);

  const [memberPendingRemoval, setMemberPendingRemoval] =
    useState(null);

  const [isAssignDrawerOpen, setIsAssignDrawerOpen] =
    useState(false);

  const [memberPendingPromote, setMemberPendingPromote] =
    useState(null);

  const [memberPendingDemote, setMemberPendingDemote] =
    useState(null);

  const [departments, setDepartments] = useState([]);

  const [promoteForm, setPromoteForm] = useState({
    role: "department_admin",
    department_id: "",
    category: "",
    password: "",
  });

  const [requestReview, setRequestReview] = useState(null);
  const [requestReason, setRequestReason] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const [membersData, departmentsData] =
          await Promise.all([
            getMembers(),
            getDepartments(),
          ]);

        if (!isMounted) return;

        setMembers(membersData || []);
        setDepartments(departmentsData || []);
      } catch (error) {
        if (isMounted) {
          toast.error(
            error?.message ||
              "Couldn't load members. Try refreshing.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function refreshMembers() {
      try {
        const [membersData, departmentsData] =
          await Promise.all([
            getMembers(),
            getDepartments(),
          ]);

        if (!isMounted) return;

        setMembers(membersData || []);
        setDepartments(departmentsData || []);
      } catch {
        // Keep existing data when background refresh fails.
      }
    }

    const handleMembersUpdated = () => {
      refreshMembers();
    };

    const handleWindowFocus = () => {
      refreshMembers();
    };

    window.addEventListener(
      "members-updated",
      handleMembersUpdated,
    );

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    const interval = window.setInterval(
      refreshMembers,
      15000,
    );

    return () => {
      isMounted = false;

      window.removeEventListener(
        "members-updated",
        handleMembersUpdated,
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );

      window.clearInterval(interval);
    };
  }, []);

  const scopedMembers = useMemo(() => {
    return getScopedMembers(user, members);
  }, [user, members]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = scopedMembers.filter((member) => {
      const fullName =
        `${member.firstName || ""} ${
          member.lastName || ""
        }`.toLowerCase();

      const email = (
        member.email || ""
      ).toLowerCase();

      const phone = (
        member.phone || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query);

      const matchesCategory =
        category === "All" ||
        member.category === category;

      const memberDepartments =
        Array.isArray(member.departments)
          ? member.departments
          : [];

      const matchesDepartment =
        department === "All Departments" ||
        memberDepartments.includes(department);

      const matchesStatus =
        status === "All Status" ||
        member.status === status;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDepartment &&
        matchesStatus
      );
    });

    result = [...result].sort((a, b) => {
      const nameA =
        `${a.firstName || ""} ${
          a.lastName || ""
        }`.toLowerCase();

      const nameB =
        `${b.firstName || ""} ${
          b.lastName || ""
        }`.toLowerCase();

      switch (sort) {
        case "az":
          return nameA.localeCompare(nameB);

        case "za":
          return nameB.localeCompare(nameA);

        case "newest":
          return (
            new Date(b.dateJoined || 0) -
            new Date(a.dateJoined || 0)
          );

        case "oldest":
          return (
            new Date(a.dateJoined || 0) -
            new Date(b.dateJoined || 0)
          );

        default:
          return 0;
      }
    });

    return result;
  }, [
    scopedMembers,
    search,
    category,
    department,
    status,
    sort,
  ]);

  function handleView(member) {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  function handleAddNew() {
    setFormMember(null);
    setIsFormOpen(true);
  }

  function handleEdit(member) {
    setFormMember(member);
    setIsFormOpen(true);
    setIsDrawerOpen(false);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setFormMember(null);
  }

  const allowEditDirectly =
    canEditMemberDirectly(user);

  const allowDeleteDirectly =
    canDeleteMemberDirectly(user);

  const allowEditRequest =
    canRequestMemberEdit(user);

  const allowDeleteRequest =
    canRequestMemberDelete(user);

  async function handleSaveMember(formData) {
    try {
      if (formMember) {
        if (allowEditDirectly) {
          const updatedMember = await updateMember(
            formMember.id,
            formData,
          );

          setMembers((previous) =>
            previous.map((member) =>
              member.id === formMember.id
                ? {
                    ...member,
                    ...formData,
                    ...(updatedMember || {}),
                  }
                : member,
            ),
          );

          toast.success(
            `${formData.firstName} ${formData.lastName} was updated`,
          );

          setIsFormOpen(false);
          setFormMember(null);

          return;
        }

        if (allowEditRequest) {
          const changes = Object.fromEntries(
            Object.entries(formData).filter(
              ([key, value]) =>
                value !== formMember[key],
            ),
          );

          if (Object.keys(changes).length === 0) {
            setIsFormOpen(false);
            return;
          }

          setRequestReview({
            member: formMember,
            changes,
            type: "edit",
          });

          setRequestReason("");
          setIsFormOpen(false);

          return;
        }
      } else {
        const createdMember =
          await createMember(formData);

        setMembers((previous) => [
          ...previous,
          createdMember,
        ]);

        toast.success(
          `${formData.firstName} ${formData.lastName} was added`,
        );

        setIsFormOpen(false);
        setFormMember(null);
      }
    } catch (error) {
      toast.error(
        error?.message ||
          "Something went wrong saving this member.",
      );
    }
  }

  function handleDelete(member) {
    setMemberPendingDelete(member);
    setIsDrawerOpen(false);
  }

  function handleCancelDelete() {
    setMemberPendingDelete(null);
  }

  async function handleConfirmDelete() {
    if (!memberPendingDelete) return;

    try {
      if (allowDeleteDirectly) {
        await deleteMember(
          memberPendingDelete.id,
        );

        setMembers((previous) =>
          previous.filter(
            (member) =>
              member.id !==
              memberPendingDelete.id,
          ),
        );

        toast.success(
          `${memberPendingDelete.firstName} ${memberPendingDelete.lastName} was deleted`,
        );

        setMemberPendingDelete(null);
        return;
      }

      if (allowDeleteRequest) {
        setRequestReview({
          member: memberPendingDelete,
          changes: {},
          type: "delete",
        });

        setRequestReason("");
        setMemberPendingDelete(null);
      }
    } catch (error) {
      toast.error(
        error?.message ||
          "Something went wrong processing this request.",
      );

      setMemberPendingDelete(null);
    }
  }

  async function handleSendRequest() {
    if (!requestReview || !requestReason.trim()) {
      return;
    }

    try {
      await submitApprovalRequest({
        type: requestReview.type,
        memberId: requestReview.member.id,
        memberName: `${requestReview.member.firstName} ${requestReview.member.lastName}`,
        changes: requestReview.changes,
        reason: requestReason.trim(),
      });

      const requestType =
        requestReview.type === "delete"
          ? "Deletion"
          : "Edit";

      setRequestReview(null);
      setRequestReason("");

      toast.success(
        `${requestType} request sent to Super Admin for approval.`,
      );
    } catch (error) {
      toast.error(
        error?.message ||
          "Something went wrong sending this request.",
      );
    }
  }

  async function handleAssignMember(member) {
    try {
      await assignMemberToDepartment(
        member.id,
        user.scope,
      );

      setMembers((previous) =>
        previous.map((item) => {
          if (item.id !== member.id) {
            return item;
          }

          const currentDepartments =
            Array.isArray(item.departments)
              ? item.departments
              : [];

          if (
            currentDepartments.includes(
              user.scope,
            )
          ) {
            return item;
          }

          return {
            ...item,
            departments: [
              ...currentDepartments,
              user.scope,
            ],
          };
        }),
      );

      toast.success(
        `${member.firstName} ${member.lastName} added to ${user.scope}`,
      );

      setIsAssignDrawerOpen(false);
    } catch (error) {
      toast.error(
        error?.message ||
          "Something went wrong adding this member.",
      );
    }
  }

  function handleRequestRemoveFromDepartment(
    member,
  ) {
    setMemberPendingRemoval(member);
    setIsDrawerOpen(false);
  }

  function handleCancelRemoval() {
    setMemberPendingRemoval(null);
  }

  async function handleConfirmRemoval() {
    if (!memberPendingRemoval) return;

    try {
      await removeMemberFromDepartment(
        memberPendingRemoval.id,
        user.scope,
      );

      setMembers((previous) =>
        previous.map((member) => {
          if (
            member.id !==
            memberPendingRemoval.id
          ) {
            return member;
          }

          const currentDepartments =
            Array.isArray(member.departments)
              ? member.departments
              : [];

          return {
            ...member,
            departments:
              currentDepartments.filter(
                (item) => item !== user.scope,
              ),
          };
        }),
      );

      toast.success(
        `${memberPendingRemoval.firstName} ${memberPendingRemoval.lastName} removed from ${user.scope}`,
      );
    } catch (error) {
      toast.error(
        error?.message ||
          "Something went wrong removing this member.",
      );
    } finally {
      setMemberPendingRemoval(null);
    }
  }

  function handlePromoteToAdmin(member) {
    setMemberPendingPromote(member);

    setPromoteForm({
      role: "department_admin",
      department_id: "",
      category: "",
      password: "",
    });

    setIsDrawerOpen(false);
  }

  function handleCancelPromote() {
    setMemberPendingPromote(null);

    setPromoteForm({
      role: "department_admin",
      department_id: "",
      category: "",
      password: "",
    });
  }

  async function handleConfirmPromote() {
    if (!memberPendingPromote) return;

    try {
      await promoteMemberToAdmin({
        member_id: memberPendingPromote.id,
        role: promoteForm.role,
        department_id:
          promoteForm.role === "department_admin"
            ? promoteForm.department_id
            : null,
        category:
          promoteForm.role === "category_admin"
            ? promoteForm.category
            : null,
        password: promoteForm.password,
      });

      setMembers((previous) =>
        previous.map((member) =>
          member.id ===
          memberPendingPromote.id
            ? {
                ...member,
                isAdmin: true,
              }
            : member,
        ),
      );

      toast.success(
        `${memberPendingPromote.firstName} ${memberPendingPromote.lastName} promoted successfully.`,
      );

      handleCancelPromote();
    } catch (error) {
      toast.error(
        error?.message ||
          "Something went wrong promoting this member.",
      );
    }
  }

  function handleDemoteToMember(member) {
    setMemberPendingDemote(member);
    setIsDrawerOpen(false);
  }

  function handleCancelDemote() {
    setMemberPendingDemote(null);
  }

  async function handleConfirmDemote() {
    if (!memberPendingDemote) return;

    try {
      await demoteAdminToMember({
        admin_id: memberPendingDemote.id,
      });

      setMembers((previous) =>
        previous.map((member) =>
          member.id ===
          memberPendingDemote.id
            ? {
                ...member,
                isAdmin: false,
              }
            : member,
        ),
      );

      toast.success(
        `${memberPendingDemote.firstName} ${memberPendingDemote.lastName} demoted to regular member.`,
      );

      setMemberPendingDemote(null);
    } catch (error) {
      toast.error(
        error?.message ||
          "Something went wrong demoting this admin.",
      );
    }
  }

  const showAddButton =
    canCreateMember(user);

  const showAssignButton =
    isDepartmentAdmin(user);

  const showEditAction =
    allowEditDirectly || allowEditRequest;

  const showDeleteAction =
    allowDeleteDirectly ||
    allowDeleteRequest;

  const showPromoteButton =
    canPromoteDemoteMembers(user);

  const showDemoteButton =
    canPromoteDemoteMembers(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Members
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {user
              ? `Viewing as ${getRoleLabel(
                  user,
                )} — showing members within your scope.`
              : "Manage all church members from one place."}
          </p>
        </div>

        {showAddButton && (
          <Button
            variant="primary"
            onClick={handleAddNew}
            className="hidden md:inline-flex sm:w-auto"
          >
            + New Member
          </Button>
        )}

        {showAssignButton && (
          <Button
            variant="primary"
            onClick={() =>
              setIsAssignDrawerOpen(true)
            }
            className="sm:w-auto"
          >
            + Add Existing Member
          </Button>
        )}
      </div>

      {showAddButton && (
        <FloatingActionButton
          label="New Member"
          storageKey="members-create"
          onClick={handleAddNew}
        />
      )}

      {loading ? (
        <LoadingState label="Loading members..." />
      ) : (
        <>
          <StatsCards members={scopedMembers} />

          <SearchBar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            department={department}
            onDepartmentChange={setDepartment}
            status={status}
            onStatusChange={setStatus}
            sort={sort}
            onSortChange={setSort}
            isSuperAdmin={
              user?.role === "super_admin"
            }
          />

          <MemberList
            members={filteredMembers}
            onView={handleView}
          />
        </>
      )}

      <MemberDetailsDrawer
        member={selectedMember}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onEdit={
          showEditAction
            ? handleEdit
            : undefined
        }
        onDelete={
          showDeleteAction
            ? handleDelete
            : undefined
        }
        onRemoveFromDepartment={
          showAssignButton
            ? handleRequestRemoveFromDepartment
            : undefined
        }
        onPromoteToAdmin={
          showPromoteButton &&
          !selectedMember?.isAdmin
            ? handlePromoteToAdmin
            : undefined
        }
        onDemoteToMember={
          showDemoteButton &&
          selectedMember?.isAdmin
            ? handleDemoteToMember
            : undefined
        }
      />

      {showAddButton && (
        <MemberForm
          member={formMember}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSaveMember}
          lockedCategory={
            isCategoryAdmin(user)
              ? user.scope
              : undefined
          }
          departmentOptions={departments.map(
            (item) => item.name,
          )}
          submitLabel={
            isCategoryAdmin(user) && formMember
              ? "Send Request"
              : "Save Member"
          }
        />
      )}

      <MemberRequestReviewDrawer
        review={requestReview}
        reason={requestReason}
        isOpen={Boolean(requestReview)}
        onClose={() => {
          setRequestReview(null);
          setRequestReason("");
        }}
        onReasonChange={setRequestReason}
        onSend={handleSendRequest}
      />

      {showAssignButton && (
        <AssignMemberDrawer
          isOpen={isAssignDrawerOpen}
          onClose={() =>
            setIsAssignDrawerOpen(false)
          }
          departmentName={user.scope}
          members={members}
          onAssign={handleAssignMember}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(memberPendingDelete)}
        title={
          allowDeleteDirectly
            ? "Delete this member?"
            : "Request member deletion?"
        }
        description={
          memberPendingDelete
            ? allowDeleteDirectly
              ? `This will permanently remove ${memberPendingDelete.firstName} ${memberPendingDelete.lastName} from the church database. This action can't be undone.`
              : `This will submit a request to Super Admin to delete ${memberPendingDelete.firstName} ${memberPendingDelete.lastName}. The member won't be removed until approved.`
            : ""
        }
        confirmLabel={
          allowDeleteDirectly
            ? "Delete Member"
            : "Continue"
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ConfirmDialog
        isOpen={Boolean(memberPendingRemoval)}
        title="Remove from department?"
        description={
          memberPendingRemoval
            ? `This will remove ${memberPendingRemoval.firstName} ${memberPendingRemoval.lastName} from ${user?.scope} only.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
      />

      <PromoteAdminDrawer
        member={memberPendingPromote}
        form={promoteForm}
        departments={departments}
        isOpen={Boolean(
          memberPendingPromote,
        )}
        onChange={(field, value) =>
          setPromoteForm((current) => ({
            ...current,
            [field]: value,
          }))
        }
        onConfirm={handleConfirmPromote}
        onCancel={handleCancelPromote}
      />

      <ConfirmDialog
        isOpen={Boolean(memberPendingDemote)}
        title="Remove admin status?"
        description={
          memberPendingDemote
            ? `This will remove admin status from ${memberPendingDemote.firstName} ${memberPendingDemote.lastName}. They will become a regular member and will no longer have admin privileges.`
            : ""
        }
        confirmLabel="Remove Admin Status"
        onConfirm={handleConfirmDemote}
        onCancel={handleCancelDemote}
      />
    </div>
  );
}

function MemberRequestReviewDrawer({
  review,
  reason,
  isOpen,
  onClose,
  onReasonChange,
  onSend,
}) {
  if (!review) return null;

  const fields = Object.entries(
    review.changes || {},
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        review.type === "delete"
          ? "Review Deletion Request"
          : "Review Edit Request"
      }
      widthClass="md:max-w-lg"
      desktopModal
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Member
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              {review.member.firstName}{" "}
              {review.member.lastName}
            </h2>
          </div>

          {review.type === "delete" ? (
            <div className="rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 p-4 text-sm text-[#821f31]">
              This member will be submitted for
              deletion. The member will remain until a
              Super Admin approves the request.
            </div>
          ) : (
            <section>
              <h3 className="text-sm font-semibold text-gray-900">
                Changes you are submitting
              </h3>

              <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                {fields.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-2 gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
                  >
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        {formatRequestField(key)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Before
                      </p>

                      <p className="break-words text-sm text-gray-700">
                        {formatRequestValue(
                          review.member[key],
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#154d78]">
                        After
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-gray-900">
                        {formatRequestValue(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
              Reason
              <span className="text-[#9e263b]">
                *
              </span>
            </span>

            <textarea
              value={reason}
              onChange={(event) =>
                onReasonChange(
                  event.target.value,
                )
              }
              rows={4}
              placeholder="Explain why this request is needed"
              className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#154d78] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
            />
          </label>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white p-5">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={onSend}
            disabled={!reason.trim()}
          >
            Send Request
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function formatRequestField(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) =>
      value.toUpperCase(),
    );
}

function formatRequestValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not provided";
  }

  if (Array.isArray(value)) {
    return value.length
      ? value.join(", ")
      : "None";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function PromoteAdminDrawer({
  member,
  form,
  departments,
  isOpen,
  onChange,
  onConfirm,
  onCancel,
}) {
  const [showPassword, setShowPassword] =
    useState(false);

  if (!member) return null;

  const isDepartmentRole =
    form.role === "department_admin";

  const canSubmit =
    form.password.length >= 8 &&
    (isDepartmentRole
      ? Boolean(form.department_id)
      : Boolean(form.category));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onCancel}
      title="Create Admin Account"
      widthClass="md:max-w-lg"
      desktopModal
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-6">
          <div className="rounded-xl border border-[#154d78]/15 bg-[#154d78]/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#154d78]">
              Selected member
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {member.firstName}{" "}
                  {member.lastName}
                </h2>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {member.email ||
                    "No email on member record"}
                </p>
              </div>

              <Badge tone="info">
                New admin
              </Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Account permissions
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Choose the role and scope this member
              will manage.
            </p>
          </div>

          <Select
            label="Admin role"
            options={[
              {
                value: "department_admin",
                label: "Department Admin",
              },
              {
                value: "category_admin",
                label: "Category Admin",
              },
            ]}
            value={form.role}
            onChange={(event) =>
              onChange(
                "role",
                event.target.value,
              )
            }
          />

          {isDepartmentRole ? (
            <Select
              label="Assigned department"
              placeholder="Select a department"
              options={departments.map(
                (department) => ({
                  value: String(department.id),
                  label: department.name,
                }),
              )}
              value={String(
                form.department_id || "",
              )}
              onChange={(event) =>
                onChange(
                  "department_id",
                  event.target.value,
                )
              }
              required
            />
          ) : (
            <Select
              label="Assigned category"
              placeholder="Select a category"
              options={[
                {
                  value: "children",
                  label: "Children",
                },
                {
                  value: "teenager",
                  label: "Teenager",
                },
                {
                  value: "youth",
                  label: "Youth",
                },
                {
                  value: "adult",
                  label: "Adult",
                },
              ]}
              value={form.category}
              onChange={(event) =>
                onChange(
                  "category",
                  event.target.value,
                )
              }
              required
            />
          )}
          <div>
          <div className="relative">
            <Input
              label="Temporary password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) =>
                onChange("password", event.target.value)
              }
              placeholder="At least 8 characters"
              minLength={8}
              required
              className="pr-12"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              title={
                showPassword ? "Hide password" : "Show password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-3 flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent p-0 text-gray-400 outline-none transition-colors hover:bg-gray-100 hover:text-gray-600 focus:border-0 focus:outline-none focus:ring-0 active:border-0 active:outline-none active:ring-0"
            >
              {showPassword ? (
                <EyeOff
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              ) : (
                <Eye
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              )}
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Share this password securely with the new administrator.
          </p>
        </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white p-5">
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={!canSubmit}
          >
            Create Admin Account
          </Button>
        </div>
      </div>
    </Drawer>
  );
}