import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Inbox,
  Users,
  UserPlus,
  Pencil,
  UserX,
} from "lucide-react";
import SectionCard from "../../components/ui/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";
import { getApprovalRequests, reviewApprovalRequest } from "./api";
import {
  getUsers,
  createAdminAccount,
  updateAdminAccount,
  removeAdminAccount,
} from "../auth/api";
import { updateMember, deleteMember } from "../members/api";
import { getRoleLabel } from "../../lib/permissions";
import { isSuperAdmin } from "../../lib/permissions";
import CreateAdminAccountForm from "./CreateAdminAccountForm";
import { useAuth } from "../auth/AuthContext";

/**
 * ApprovalRequestsPage
 *
 * Super Admin only (enforced by RequireAccess + hidden from other
 * roles' nav via lib/permissions.js). Two responsibilities live here,
 * matching the two things the spec lists as Super-Admin-exclusive:
 *
 * 1. Reviewing existing edit/delete requests.
 *    Approving one actually APPLIES the change (calls
 *    updateMember/deleteMember) — not just a status flag.
 *
 * 2. Managing Staff Admin accounts — create,
 *    edit (role/scope), and remove admin access. Edit/Remove never
 *    render for a super_admin row — there's no UI path to edit or
 *    remove the highest authority in the system from within the app
 *    itself.
 *
 * Known limitation, unchanged from before: since each page fetches
 * its own copy of data independently (no shared global store yet),
 * changes made here won't be visible elsewhere (Members page,
 * Navbar's "Preview as" switcher) until that page/the app reloads.
 */
export default function ApprovalRequestsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingAccount, setEditingAccount] = useState(null); // null = "create" mode
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [accountPendingRemoval, setAccountPendingRemoval] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin(user)) {
      setIsLoading(false);
      return undefined;
    }
    let isMounted = true;
    Promise.all([getApprovalRequests(), getUsers()])
      .then(([requestsData, usersData]) => {
        if (!isMounted) return;
        setRequests(requestsData);
        setAdmins(usersData);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  async function handleReview(request, decision) {
    try {
      await reviewApprovalRequest(request.id, decision);

      if (decision === "approved") {
        if (request.type === "edit") {
          await updateMember(request.memberId, request.changes);
        } else if (request.type === "delete") {
          await deleteMember(request.memberId);
        }
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: decision } : r)),
      );
      toast.success(
        decision === "approved"
          ? "Request approved and applied"
          : "Request rejected",
      );
    } catch {
      toast.error("Something went wrong reviewing this request.");
    }
  }

  function handleAddAccount() {
    setEditingAccount(null);
    setIsAccountFormOpen(true);
  }

  function handleEditAccount(admin) {
    setEditingAccount(admin);
    setIsAccountFormOpen(true);
  }

  function handleCloseAccountForm() {
    setIsAccountFormOpen(false);
  }

  async function handleSaveAccount(accountData) {
    try {
      if (editingAccount) {
        await updateAdminAccount(editingAccount.id, accountData);
        setAdmins((prev) =>
          prev.map((a) =>
            a.id === editingAccount.id ? { ...a, ...accountData } : a,
          ),
        );
        toast.success(`${accountData.name}'s account was updated`);
      } else {
        const created = await createAdminAccount(accountData);
        setAdmins((prev) => [...prev, created]);
        toast.success(`${created.name} was added as ${getRoleLabel(created)}`);
      }
      setIsAccountFormOpen(false);
    } catch {
      toast.error("Something went wrong saving this account.");
    }
  }

  function handleRequestRemoveAccount(admin) {
    setAccountPendingRemoval(admin);
  }

  function handleCancelRemoveAccount() {
    setAccountPendingRemoval(null);
  }

  async function handleConfirmRemoveAccount() {
    try {
      await removeAdminAccount(accountPendingRemoval.id);
      setAdmins((prev) =>
        prev.filter((a) => a.id !== accountPendingRemoval.id),
      );
      toast.success(`${accountPendingRemoval.name}'s admin access was removed`);
    } catch {
      toast.error("Something went wrong removing this account.");
    } finally {
      setAccountPendingRemoval(null);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");

  if (!isSuperAdmin(user)) {
    return (
      <EmptyState
        icon={Users}
        title="Super Admin access required"
        description="This administration console is restricted to the Super Admin."
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading approval requests..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Approvals &amp; Admin Accounts
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review member change requests and manage Category Admin and Department Admin accounts.
        </p>
      </div>

      <SectionCard title={`Pending Requests (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No pending requests"
            description="All caught up — nothing needs your review."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {pending.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={request.type === "delete" ? "neutral" : "info"}
                    >
                      {request.type === "delete"
                        ? "Deletion Request"
                        : "Edit Request"}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {request.memberName} — requested by{" "}
                    {request.requestedBy.name} ({request.requestedBy.scope}{" "}
                    {request.requestedBy.role === "category_admin"
                      ? "Category Admin"
                      : "Departmental Admin"}
                    )
                  </p>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                  {request.changes &&
                    Object.keys(request.changes).length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        Proposed change:{" "}
                        {Object.entries(request.changes)
                          .map(([key, value]) => `${key} → ${value}`)
                          .join(", ")}
                      </p>
                    )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleReview(request, "rejected")}
                    className="text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleReview(request, "approved")}
                    className="text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Admin Accounts">
        <div className="mb-4 flex justify-end">
          <Button
            variant="primary"
            onClick={handleAddAccount}
            className="text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            New Admin Account
          </Button>
        </div>

        {admins.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No admin accounts"
            description="Create the first one to get started."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {admins.map((admin) => {
              const isSuperAdminRow = admin.role === "super_admin";
              return (
                <li
                  key={admin.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {admin.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {admin.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={isSuperAdminRow ? "info" : "neutral"}>
                      {getRoleLabel(admin)}
                    </Badge>
                    {!isSuperAdminRow && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditAccount(admin)}
                          aria-label={`Edit ${admin.name}'s account`}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestRemoveAccount(admin)}
                          aria-label={`Remove ${admin.name}'s admin access`}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#9e263b]"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <CreateAdminAccountForm
        isOpen={isAccountFormOpen}
        account={editingAccount}
        onClose={handleCloseAccountForm}
        onSave={handleSaveAccount}
      />

      <ConfirmDialog
        isOpen={Boolean(accountPendingRemoval)}
        title="Remove admin access?"
        description={
          accountPendingRemoval
            ? `This will revoke ${accountPendingRemoval.name}'s ${getRoleLabel(
                accountPendingRemoval,
              )} access. Their church membership record (if any) is not affected — only their admin account.`
            : ""
        }
        confirmLabel="Remove Access"
        onConfirm={handleConfirmRemoveAccount}
        onCancel={handleCancelRemoveAccount}
      />
    </div>
  );
}
