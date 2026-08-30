
import { useEffect, useState } from "react";

import {
  CheckCircle2,
  XCircle,
  Inbox,
  Users,
  UserPlus,
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
import { getRoleLabel, isSuperAdmin } from "../../lib/permissions";

import CreateAdminAccountForm from "./CreateAdminAccountForm";
import AdminDetailsDrawer from "./AdminDetailsDrawer";

import { useAuth } from "../auth/AuthContext";

/**
 * ApprovalRequestsPage
 *
 * Super Admin only.
 *
 * Responsibilities:
 *
 * 1. Reviewing existing edit/delete requests.
 *
 * 2. Managing Staff Admin accounts.
 *
 * Admin accounts are now opened by clicking the entire admin row.
 * Edit/Remove actions live inside AdminDetailsDrawer instead of
 * appearing directly on the admin list.
 */

export default function ApprovalRequestsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingAccount, setEditingAccount] = useState(null);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);

  const [accountPendingRemoval, setAccountPendingRemoval] = useState(null);

  // Admin details drawer
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);

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
        prev.map((r) =>
          r.id === request.id ? { ...r, status: decision } : r,
        ),
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
    setIsAdminDetailsOpen(false);

    setEditingAccount(admin);
    setIsAccountFormOpen(true);
  }

  function handleCloseAccountForm() {
    setIsAccountFormOpen(false);
  }

  async function handleSaveAccount(accountData) {
    try {
      if (editingAccount) {
        const updated = await updateAdminAccount(
          editingAccount.id,
          accountData,
        );

        setAdmins((prev) =>
          prev.map((a) =>
            a.id === editingAccount.id
              ? { ...a, ...accountData, ...updated }
              : a,
          ),
        );

        setSelectedAdmin((prev) =>
          prev && prev.id === editingAccount.id
            ? { ...prev, ...accountData, ...updated }
            : prev,
        );

        toast.success(`${accountData.name}'s account was updated`);
      } else {
        const created = await createAdminAccount(accountData);

        setAdmins((prev) => [...prev, created]);

        toast.success(
          `${created.name} was added as ${getRoleLabel(created)}`,
        );
      }

      setIsAccountFormOpen(false);
      setEditingAccount(null);
    } catch {
      toast.error("Something went wrong saving this account.");
    }
  }

  function handleOpenAdmin(admin) {
    setSelectedAdmin(admin);
    setIsAdminDetailsOpen(true);
  }

  function handleCloseAdminDetails() {
    setIsAdminDetailsOpen(false);
    setSelectedAdmin(null);
  }

  function handleRequestRemoveAccount(admin) {
    setIsAdminDetailsOpen(false);
    setAccountPendingRemoval(admin);
  }

  function handleCancelRemoveAccount() {
    setAccountPendingRemoval(null);
  }

  async function handleConfirmRemoveAccount() {
    if (!accountPendingRemoval) return;

    try {
      await removeAdminAccount(accountPendingRemoval.id);

      setAdmins((prev) =>
        prev.filter((a) => a.id !== accountPendingRemoval.id),
      );

      if (selectedAdmin?.id === accountPendingRemoval.id) {
        setSelectedAdmin(null);
      }

      toast.success(
        `${accountPendingRemoval.name}'s admin access was removed`,
      );
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
          Review member change requests and manage Category Admin and
          Department Admin accounts.
        </p>
      </div>

      {/* Pending Requests */}
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
                      tone={
                        request.type === "delete" ? "neutral" : "info"
                      }
                    >
                      {request.type === "delete"
                        ? "Deletion Request"
                        : "Edit Request"}
                    </Badge>

                    <span className="text-xs text-gray-400">
                      {new Date(
                        request.createdAt,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {request.memberName} — requested by{" "}
                    {request.requestedBy.name} (
                    {request.requestedBy.scope}{" "}
                    {request.requestedBy.role === "category_admin"
                      ? "Category Admin"
                      : "Departmental Admin"}
                    )
                  </p>

                  <p className="text-sm text-gray-600">
                    {request.reason}
                  </p>

                  {request.changes &&
                    Object.keys(request.changes).length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        Proposed change:{" "}
                        {Object.entries(request.changes)
                          .map(
                            ([key, value]) =>
                              `${key} → ${value}`,
                          )
                          .join(", ")}
                      </p>
                    )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleReview(request, "rejected")
                    }
                    className="text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() =>
                      handleReview(request, "approved")
                    }
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

      {/* Admin Accounts */}
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
              const isSuperAdminRow =
                admin.role === "super_admin";

              return (
                <li key={admin.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenAdmin(admin)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg py-3 text-left transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#d6b447] focus:ring-inset first:pt-3 last:pb-3"
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
                      <Badge
                        tone={
                          isSuperAdminRow ? "info" : "neutral"
                        }
                      >
                        {getRoleLabel(admin)}
                      </Badge>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* Create / Edit Admin Account */}
      <CreateAdminAccountForm
        isOpen={isAccountFormOpen}
        account={editingAccount}
        onClose={handleCloseAccountForm}
        onSave={handleSaveAccount}
      />

      {/* Admin Details */}
      <AdminDetailsDrawer
        admin={selectedAdmin}
        isOpen={isAdminDetailsOpen}
        onClose={handleCloseAdminDetails}
        onEdit={
          selectedAdmin?.role !== "super_admin"
            ? handleEditAccount
            : undefined
        }
        onDelete={
          selectedAdmin?.role !== "super_admin"
            ? handleRequestRemoveAccount
            : undefined
        }
      />

      {/* Remove Admin Confirmation */}
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
