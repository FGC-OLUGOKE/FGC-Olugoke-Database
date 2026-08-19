import { useEffect, useMemo, useState } from "react";
import SearchBar from "./components/SearchBar";
import StatsCards from "./components/StatsCards";
import MemberList from "./components/MemberList";
import MemberDetailsDrawer from "./components/MemberDetailsDrawer";
import MemberForm from "./components/MemberForm";
import AssignMemberDrawer from "./components/AssignMemberDrawer";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingState from "../../components/ui/LoadingState";
import { useToast } from "../../components/ui/ToastProvider";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  assignMemberToDepartment,
  removeMemberFromDepartment,
} from "./api";
import { submitApprovalRequest } from "../approvals/api";
import { useAuth } from "../auth/AuthContext";
import {
  getScopedMembers,
  canCreateMember,
  canEditMemberDirectly,
  canDeleteMemberDirectly,
  canRequestMemberEdit,
  canRequestMemberDeletion,
  isDepartmentAdmin,
  getRoleLabel,
} from "../../lib/permissions";

/** Shallow diff of two flat objects — used to describe what a
 * Category Admin's edit request is actually proposing to change. */
function getChangedFields(original, updated) {
  const changes = {};
  Object.keys(updated).forEach((key) => {
    if (key === "photoUrl") return; // skip large data URLs in the diff summary
    const a = JSON.stringify(original[key]);
    const b = JSON.stringify(updated[key]);
    if (a !== b) changes[key] = updated[key];
  });
  return changes;
}

/**
 * MembersPage
 *
 * Fully role-aware:
 * - Super Admin: full CRUD, exactly as before.
 * - Category Admin: can view (scoped to their category) and create
 *   directly, but Edit/Delete submit an approval request instead of
 *   applying immediately (see features/approvals) — this IS wired
 *   up now, not just permission-gated.
 * - Department Admin: can view (scoped to their department) but
 *   can't create/edit/delete members at all — instead gets "+ Add
 *   Existing Member" (AssignMemberDrawer) and "Remove from
 *   Department" (which only removes THIS department from their
 *   `departments` array, leaving other memberships untouched).
 */
export default function MembersPage() {
  const toast = useToast();
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] = useState("All Departments");
  const [status, setStatus] = useState("All Status");
  const [sort, setSort] = useState("az");

  const [selectedMember, setSelectedMember] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [formMember, setFormMember] = useState(null); // null = "Add" mode
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [memberPendingDelete, setMemberPendingDelete] = useState(null);
  const [memberPendingRemoval, setMemberPendingRemoval] = useState(null);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getMembers()
      .then((data) => {
        if (isMounted) setMembers(data);
      })
      .catch(() => {
        if (isMounted) toast.error("Couldn't load members. Try refreshing.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scopedMembers = useMemo(() => getScopedMembers(user, members), [user, members]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = scopedMembers.filter((m) => {
      const matchesSearch =
        !query ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.phone.toLowerCase().includes(query);

      const matchesCategory = category === "All" || m.category === category;

      const matchesDepartment =
        department === "All Departments" || m.departments.includes(department);

      const matchesStatus = status === "All Status" || m.status === status;

      return matchesSearch && matchesCategory && matchesDepartment && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();

      switch (sort) {
        case "az":
          return nameA.localeCompare(nameB);
        case "za":
          return nameB.localeCompare(nameA);
        case "newest":
          return new Date(b.dateJoined) - new Date(a.dateJoined);
        case "oldest":
          return new Date(a.dateJoined) - new Date(b.dateJoined);
        default:
          return 0;
      }
    });

    return result;
  }, [scopedMembers, search, category, department, status, sort]);

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
  }

  const allowEditDirectly = canEditMemberDirectly(user);
  const allowRequestEdit = canRequestMemberEdit(user);
  const allowDeleteDirectly = canDeleteMemberDirectly(user);
  const allowRequestDelete = canRequestMemberDeletion(user);

  async function handleSaveMember(formData) {
    try {
      if (formMember && !allowEditDirectly && allowRequestEdit) {
        // Category Admin: submit an edit REQUEST instead of applying
        // it — nothing in `members` changes until Super Admin approves.
        const changes = getChangedFields(formMember, formData);
        await submitApprovalRequest({
          type: "edit",
          memberId: formMember.id,
          memberName: `${formMember.firstName} ${formMember.lastName}`,
          requestedBy: user,
          changes,
          reason: "Submitted via Members page.",
        });
        toast.success("Edit request submitted for Super Admin approval");
        setIsFormOpen(false);
        return;
      }

      if (formMember) {
        await updateMember(formMember.id, formData);
        setMembers((prev) =>
          prev.map((m) => (m.id === formMember.id ? { ...m, ...formData } : m))
        );
        toast.success(`${formData.firstName} ${formData.lastName} was updated`);
      } else {
        const created = await createMember(formData);
        setMembers((prev) => [...prev, created]);
        toast.success(`${formData.firstName} ${formData.lastName} was added`);
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Something went wrong saving this member.");
    }
  }

  function handleDelete(member) {
    setMemberPendingDelete(member);
  }

  function handleCancelDelete() {
    setMemberPendingDelete(null);
  }

  async function handleConfirmDelete() {
    try {
      if (!allowDeleteDirectly && allowRequestDelete) {
        // Category Admin: submit a deletion REQUEST instead of deleting.
        await submitApprovalRequest({
          type: "delete",
          memberId: memberPendingDelete.id,
          memberName: `${memberPendingDelete.firstName} ${memberPendingDelete.lastName}`,
          requestedBy: user,
          reason: "Submitted via Members page.",
        });
        toast.success("Deletion request submitted for Super Admin approval");
        setMemberPendingDelete(null);
        return;
      }

      await deleteMember(memberPendingDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberPendingDelete.id));
      toast.success(
        `${memberPendingDelete.firstName} ${memberPendingDelete.lastName} was deleted`
      );
    } catch {
      toast.error("Something went wrong deleting this member.");
    } finally {
      setMemberPendingDelete(null);
    }
  }

  // --- Department Admin: assign existing member / remove from department ---

  async function handleAssignMember(member) {
    try {
      await assignMemberToDepartment(member.id, user.scope);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, departments: [...m.departments, user.scope] } : m
        )
      );
      toast.success(`${member.firstName} ${member.lastName} added to ${user.scope}`);
      setIsAssignDrawerOpen(false);
    } catch {
      toast.error("Something went wrong adding this member.");
    }
  }

  function handleRequestRemoveFromDepartment(member) {
    setMemberPendingRemoval(member);
  }

  function handleCancelRemoval() {
    setMemberPendingRemoval(null);
  }

  async function handleConfirmRemoval() {
    try {
      await removeMemberFromDepartment(memberPendingRemoval.id, user.scope);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberPendingRemoval.id
            ? { ...m, departments: m.departments.filter((d) => d !== user.scope) }
            : m
        )
      );
      toast.success(
        `${memberPendingRemoval.firstName} ${memberPendingRemoval.lastName} removed from ${user.scope}`
      );
    } catch {
      toast.error("Something went wrong removing this member.");
    } finally {
      setMemberPendingRemoval(null);
    }
  }

  const showAddButton = canCreateMember(user);
  const showAssignButton = isDepartmentAdmin(user);
  const showEditAction = allowEditDirectly || allowRequestEdit;
  const showDeleteAction = allowDeleteDirectly || allowRequestDelete;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user
              ? `Viewing as ${getRoleLabel(user)} — showing members within your scope.`
              : "Manage all church members from one place."}
          </p>
        </div>
        {showAddButton && (
          <Button variant="primary" onClick={handleAddNew} className="sm:w-auto">
            + New Member
          </Button>
        )}
        {showAssignButton && (
          <Button variant="primary" onClick={() => setIsAssignDrawerOpen(true)} className="sm:w-auto">
            + Add Existing Member
          </Button>
        )}
      </div>

      {isLoading ? (
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
          />

          <MemberList
            members={filteredMembers}
            onView={handleView}
            onEdit={showEditAction ? handleEdit : undefined}
            onDelete={showDeleteAction ? handleDelete : undefined}
            onRemoveFromDepartment={
              showAssignButton ? handleRequestRemoveFromDepartment : undefined
            }
          />
        </>
      )}

      <MemberDetailsDrawer
        member={selectedMember}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onEdit={showEditAction ? handleEdit : undefined}
      />

      {(showAddButton || allowRequestEdit) && (
        <MemberForm
          member={formMember}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSaveMember}
          titleOverride={
            formMember && !allowEditDirectly && allowRequestEdit ? "Request Member Edit" : undefined
          }
          submitLabel={
            formMember && !allowEditDirectly && allowRequestEdit ? "Submit Edit Request" : "Save Member"
          }
        />
      )}

      {showAssignButton && (
        <AssignMemberDrawer
          isOpen={isAssignDrawerOpen}
          onClose={() => setIsAssignDrawerOpen(false)}
          departmentName={user.scope}
          members={members}
          onAssign={handleAssignMember}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(memberPendingDelete)}
        title={allowDeleteDirectly ? "Delete this member?" : "Request member deletion?"}
        description={
          memberPendingDelete
            ? allowDeleteDirectly
              ? `This will permanently remove ${memberPendingDelete.firstName} ${memberPendingDelete.lastName} from the church database. This action can't be undone.`
              : `This will submit a request to Super Admin to delete ${memberPendingDelete.firstName} ${memberPendingDelete.lastName}. The member won't be removed until approved.`
            : ""
        }
        confirmLabel={allowDeleteDirectly ? "Delete Member" : "Submit Request"}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ConfirmDialog
        isOpen={Boolean(memberPendingRemoval)}
        title="Remove from department?"
        description={
          memberPendingRemoval
            ? `This will remove ${memberPendingRemoval.firstName} ${memberPendingRemoval.lastName} from ${user?.scope} only — any other department memberships they have won't be affected.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
      />
    </div>
  );
}
