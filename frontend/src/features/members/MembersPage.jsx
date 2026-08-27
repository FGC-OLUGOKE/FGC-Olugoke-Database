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
import { useAuth } from "../auth/AuthContext";
import {
  getScopedMembers,
  canCreateMember,
  canEditMemberDirectly,
  canDeleteMemberDirectly,
  isCategoryAdmin,
  isDepartmentAdmin,
  getRoleLabel,
} from "../../lib/permissions";

/**
 * MembersPage
 *
 * Fully role-aware:
 * - Super Admin: full CRUD, exactly as before.
 * - Staff Admin: can manage members assigned to their department.
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

  const scopedMembers = useMemo(
    () => getScopedMembers(user, members),
    [user, members],
  );

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

      return (
        matchesSearch && matchesCategory && matchesDepartment && matchesStatus
      );
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
  const allowDeleteDirectly = canDeleteMemberDirectly(user);

  async function handleSaveMember(formData) {
    try {
      if (formMember) {
        await updateMember(formMember.id, formData);
        setMembers((prev) =>
          prev.map((m) => (m.id === formMember.id ? { ...m, ...formData } : m)),
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
    setIsDrawerOpen(false);
  }

  function handleCancelDelete() {
    setMemberPendingDelete(null);
  }

  async function handleConfirmDelete() {
    try {
      await deleteMember(memberPendingDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberPendingDelete.id));
      toast.success(
        `${memberPendingDelete.firstName} ${memberPendingDelete.lastName} was deleted`,
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
          m.id === member.id
            ? { ...m, departments: [...m.departments, user.scope] }
            : m,
        ),
      );
      toast.success(
        `${member.firstName} ${member.lastName} added to ${user.scope}`,
      );
      setIsAssignDrawerOpen(false);
    } catch {
      toast.error("Something went wrong adding this member.");
    }
  }

  function handleRequestRemoveFromDepartment(member) {
    setMemberPendingRemoval(member);
    setIsDrawerOpen(false);
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
            ? {
                ...m,
                departments: m.departments.filter((d) => d !== user.scope),
              }
            : m,
        ),
      );
      toast.success(
        `${memberPendingRemoval.firstName} ${memberPendingRemoval.lastName} removed from ${user.scope}`,
      );
    } catch {
      toast.error("Something went wrong removing this member.");
    } finally {
      setMemberPendingRemoval(null);
    }
  }

  const showAddButton = canCreateMember(user);
  const showAssignButton = isDepartmentAdmin(user);
  const showEditAction = allowEditDirectly;
  const showDeleteAction = allowDeleteDirectly;

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
          <Button
            variant="primary"
            onClick={handleAddNew}
            className="sm:w-auto"
          >
            + New Member
          </Button>
        )}
        {showAssignButton && (
          <Button
            variant="primary"
            onClick={() => setIsAssignDrawerOpen(true)}
            className="sm:w-auto"
          >
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

          <MemberList members={filteredMembers} onView={handleView} />
        </>
      )}

      <MemberDetailsDrawer
        member={selectedMember}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onEdit={showEditAction ? handleEdit : undefined}
        onDelete={showDeleteAction ? handleDelete : undefined}
        onRemoveFromDepartment={
          showAssignButton ? handleRequestRemoveFromDepartment : undefined
        }
      />

      {showAddButton && (
        <MemberForm
          member={formMember}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSaveMember}
          titleOverride={undefined}
          submitLabel={"Save Member"}
          lockedCategory={isCategoryAdmin(user) ? user.scope : undefined}
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
        confirmLabel="Delete Member"
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
