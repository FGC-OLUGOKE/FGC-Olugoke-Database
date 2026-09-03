import { useEffect, useMemo, useState } from "react";
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
  const [formMember, setFormMember] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [memberPendingDelete, setMemberPendingDelete] = useState(null);
  const [memberPendingRemoval, setMemberPendingRemoval] = useState(null);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [memberPendingPromote, setMemberPendingPromote] = useState(null);
  const [memberPendingDemote, setMemberPendingDemote] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [promoteForm, setPromoteForm] = useState({ role: "department_admin", department_id: "", category: "", password: "" });
  const [requestReview, setRequestReview] = useState(null);
  const [requestReason, setRequestReason] = useState("");

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
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refreshMembers = async () => {
      try {
        const [membersData, departmentsData] = await Promise.all([
          getMembers(),
          getDepartments(),
        ]);
        if (isMounted) {
          setMembers(membersData);
          setDepartments(departmentsData);
        }
      } catch {
        // Keep the current data visible if a background refresh fails.
      }
    };
    const handleMembersUpdated = () => refreshMembers();
    const handleWindowFocus = () => refreshMembers();
    window.addEventListener("members-updated", handleMembersUpdated);
    window.addEventListener("focus", handleWindowFocus);
    const interval = window.setInterval(refreshMembers, 15000);
    return () => {
      isMounted = false;
      window.removeEventListener("members-updated", handleMembersUpdated);
      window.removeEventListener("focus", handleWindowFocus);
      window.clearInterval(interval);
    };
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
  const allowEditRequest = canRequestMemberEdit(user);
  const allowDeleteRequest = canRequestMemberDelete(user);

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
          setRequestReason("");
          setRequestReview({ member: formMember, changes, type: "edit" });
          setIsFormOpen(false);
          return;
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

  async function handleSendRequest() {
    if (!requestReview || !requestReason.trim()) return;
    try {
      await submitApprovalRequest({
        type: requestReview.type,
        memberId: requestReview.member.id,
        memberName: `${requestReview.member.firstName} ${requestReview.member.lastName}`,
        changes: requestReview.changes,
        reason: requestReason.trim(),
      });
      setRequestReview(null);
      setRequestReason("");
      toast.success(`${requestReview.type === "delete" ? "Deletion" : "Edit"} request sent to Super Admin for approval`);
    } catch (error) {
      toast.error(error.message || "Something went wrong sending this request.");
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
        setRequestReason("");
        setRequestReview({ member: memberPendingDelete, changes: {}, type: "delete" });
        setMemberPendingDelete(null);
        return;
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
            isSuperAdmin={user?.role === "super_admin"}
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
          lockedCategory={isCategoryAdmin(user) ? user.scope : undefined}
          departmentOptions={departments.map((department) => department.name)}
          submitLabel={isCategoryAdmin(user) && formMember ? "Send Request" : "Save Member"}
        />
      )}

      <MemberRequestReviewDrawer
        review={requestReview}
        reason={requestReason}
        isOpen={Boolean(requestReview)}
        onClose={() => setRequestReview(null)}
        onReasonChange={setRequestReason}
        onSend={handleSendRequest}
      />

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

      <PromoteAdminDrawer
        member={memberPendingPromote}
        form={promoteForm}
        departments={departments}
        isOpen={Boolean(memberPendingPromote)}
        onChange={(field, value) => setPromoteForm((current) => ({ ...current, [field]: value }))}
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

function MemberRequestReviewDrawer({ review, reason, isOpen, onClose, onReasonChange, onSend }) {
  if (!review) return null;
  const fields = Object.entries(review.changes || {});

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={review.type === "delete" ? "Review Deletion Request" : "Review Edit Request"}
      widthClass="md:max-w-lg"
      desktopModal
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Member</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              {review.member.firstName} {review.member.lastName}
            </h2>
          </div>

          {review.type === "delete" ? (
            <div className="rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 p-4 text-sm text-[#821f31]">
              This member will be submitted for deletion. The member will remain until a Super Admin approves the request.
            </div>
          ) : (
            <section>
              <h3 className="text-sm font-semibold text-gray-900">Changes you are submitting</h3>
              <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                {fields.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0">
                    <div>
                      <p className="text-xs font-medium text-gray-500">{formatRequestField(key)}</p>
                      <p className="mt-1 text-xs text-gray-400">Before</p>
                      <p className="break-words text-sm text-gray-700">{formatRequestValue(review.member[key])}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#154d78]">After</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatRequestValue(value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
              Reason <span className="text-[#9e263b]">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              rows={4}
              placeholder="Explain why this request is needed"
              className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#154d78] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#154d78]/20"
            />
          </label>
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white p-5">
          <Button variant="secondary" onClick={onClose}>Back</Button>
          <Button variant="primary" onClick={onSend} disabled={!reason.trim()}>
            Send Request
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function formatRequestField(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function formatRequestValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (Array.isArray(value)) return value.join(", ") || "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function PromoteAdminDrawer({ member, form, departments, isOpen, onChange, onConfirm, onCancel }) {
  if (!member) return null;

  const isDepartmentRole = form.role === "department_admin";
  const canSubmit = form.password.length >= 8 &&
    (isDepartmentRole ? Boolean(form.department_id) : Boolean(form.category));

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
            <p className="text-xs font-semibold uppercase tracking-wide text-[#154d78]">Selected member</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{member.firstName} {member.lastName}</h2>
                <p className="mt-1 text-sm text-gray-500">{member.email || "No email on member record"}</p>
              </div>
              <Badge tone="info">New admin</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Account permissions</h3>
            <p className="mt-1 text-sm text-gray-500">Choose the role and scope this member will manage.</p>
          </div>

          <Select
            label="Admin role"
            options={[
              { value: "department_admin", label: "Department Admin" },
              { value: "category_admin", label: "Category Admin" },
            ]}
            value={form.role}
            onChange={(event) => onChange("role", event.target.value)}
          />

          {isDepartmentRole ? (
            <Select
              label="Assigned department"
              placeholder="Select a department"
              options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              value={String(form.department_id || "")}
              onChange={(event) => onChange("department_id", event.target.value)}
              required
            />
          ) : (
            <Select
              label="Assigned category"
              placeholder="Select a category"
              options={["Children", "Teenager", "Youth", "Adult"]}
              value={form.category}
              onChange={(event) => onChange("category", event.target.value)}
              required
            />
          )}

          <div>
            <Input
              label="Temporary password"
              type="password"
              value={form.password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
            <p className="mt-2 text-xs text-gray-400">Share this password securely with the new administrator.</p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white p-5">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm} disabled={!canSubmit}>
            Create Admin Account
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
