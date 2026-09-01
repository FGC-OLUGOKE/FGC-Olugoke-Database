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
  promoteMemberToAdmin,
  demoteAdminToMember,
} from "./api";
import { useAuth } from "../auth/AuthContext";
import {
  getScopedMembers,
  canCreateMember,
  canEditMemberDirectly,
  canDeleteMemberDirectly,
  isDepartmentAdmin,
  isCategoryAdmin,
  getRoleLabel,
  canPromoteDemoteMembers,
} from "../../lib/permissions";
import { submitApprovalRequest } from "../approvals/api";
import { getDepartments } from "../departments/api";

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
  const [memberPendingPromote, setMemberPendingPromote] = useState(null);
  const [memberPendingDemote, setMemberPendingDemote] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [promoteForm, setPromoteForm] = useState({ role: "department_admin", department_id: "", category: "", password: "" });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([getMembers(), getDepartments()])
      .then(([membersData, departmentsData]) => {
        if (isMounted) {
          setMembers(membersData);
          setDepartments(departmentsData);
        }
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
  // const allowEditRequest = canRequestMemberEdit(user);
  // const allowDeleteRequest = canRequestMemberDelete(user);

  async function handleSaveMember(formData) {
    try {
      if (formMember) {
        if (allowEditDirectly) {
          await updateMember(formMember.id, formData);
          setMembers((prev) =>
            prev.map((m) => (m.id === formMember.id ? { ...m, ...formData } : m)),
          );
          toast.success(`${formData.firstName} ${formData.lastName} was updated`);
        } else if (allowEditRequest) {
          const changes = Object.fromEntries(
            Object.entries(formData).filter(([key, value]) => value !== formMember[key]),
          );
          if (Object.keys(changes).length === 0) {
            setIsFormOpen(false);
            return;
          }
          await submitApprovalRequest({
            type: "edit",
            memberId: formMember.id,
            memberName: `${formMember.firstName} ${formMember.lastName}`,
            changes,
          });
          toast.success("Edit request sent to Super Admin for approval");
        }
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
      if (allowDeleteDirectly) {
        await deleteMember(memberPendingDelete.id);
        setMembers((prev) => prev.filter((m) => m.id !== memberPendingDelete.id));
        toast.success(
          `${memberPendingDelete.firstName} ${memberPendingDelete.lastName} was deleted`,
        );
      } else if (allowDeleteRequest) {
        await submitApprovalRequest({
          type: "delete",
          memberId: memberPendingDelete.id,
          memberName: `${memberPendingDelete.firstName} ${memberPendingDelete.lastName}`,
          changes: {},
        });
        toast.success("Deletion request sent to Super Admin for approval");
      }
    } catch {
      toast.error("Something went wrong processing this member action.");
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

  function handlePromoteToAdmin(member) {
    setMemberPendingPromote(member);
    setPromoteForm({ role: "department_admin", department_id: "", category: "", password: "" });
    setIsDrawerOpen(false);
  }

  function handleCancelPromote() {
    setMemberPendingPromote(null);
    setPromoteForm({ role: "department_admin", department_id: "", category: "", password: "" });
  }

  async function handleConfirmPromote() {
    try {
      await promoteMemberToAdmin({
        member_id: memberPendingPromote.id,
        role: promoteForm.role,
        department_id: promoteForm.role === "department_admin" ? promoteForm.department_id : null,
        category: promoteForm.role === "category_admin" ? promoteForm.category : null,
        password: promoteForm.password,
      });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberPendingPromote.id ? { ...m, isAdmin: true } : m
        ),
      );
      toast.success(
        `${memberPendingPromote.firstName} ${memberPendingPromote.lastName} promoted to ${promoteForm.role}`,
      );
      setMemberPendingPromote(null);
      setPromoteForm({ role: "department_admin", department_id: "", category: "", password: "" });
    } catch {
      toast.error("Something went wrong promoting this member.");
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
    try {
      await demoteAdminToMember({ admin_id: memberPendingDemote.id });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberPendingDemote.id ? { ...m, isAdmin: false } : m
        ),
      );
      toast.success(
        `${memberPendingDemote.firstName} ${memberPendingDemote.lastName} demoted to regular member`,
      );
      setMemberPendingDemote(null);
    } catch {
      toast.error("Something went wrong demoting this admin.");
    }
  }

  const showAddButton = canCreateMember(user);
  const showAssignButton = isDepartmentAdmin(user);
  const showEditAction = allowEditDirectly || allowEditRequest;
  const showDeleteAction = allowDeleteDirectly || allowDeleteRequest;
  const showPromoteButton = canPromoteDemoteMembers(user);
  const showDemoteButton = canPromoteDemoteMembers(user);

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
        onPromoteToAdmin={
          showPromoteButton && !selectedMember?.isAdmin ? handlePromoteToAdmin : undefined
        }
        onDemoteToMember={
          showDemoteButton && selectedMember?.isAdmin ? handleDemoteToMember : undefined
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

      <ConfirmDialog
        isOpen={Boolean(memberPendingPromote)}
        title="Promote member to admin?"
        description={
          memberPendingPromote ? (
            <div className="space-y-4">
              <p>This will promote {memberPendingPromote.firstName} {memberPendingPromote.lastName} to an admin account.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Role</label>
                  <select
                    value={promoteForm.role}
                    onChange={(e) => setPromoteForm({ ...promoteForm, role: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="department_admin">Department Admin</option>
                    <option value="category_admin">Category Admin</option>
                  </select>
                </div>
                {promoteForm.role === "department_admin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select
                      value={promoteForm.department_id}
                      onChange={(e) => setPromoteForm({ ...promoteForm, department_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {promoteForm.role === "category_admin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={promoteForm.category}
                      onChange={(e) => setPromoteForm({ ...promoteForm, category: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Children">Children</option>
                      <option value="Teenager">Teenager</option>
                      <option value="Youth">Youth</option>
                      <option value="Adult">Adult</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={promoteForm.password}
                    onChange={(e) => setPromoteForm({ ...promoteForm, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter password for admin account"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>
          ) : ""
        }
        confirmLabel="Promote to Admin"
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
