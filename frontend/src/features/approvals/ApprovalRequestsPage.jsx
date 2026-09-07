
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  CheckCircle2,
  XCircle,
  Inbox,
  Users,
  UserPlus,
  ChevronRight,
  Clock3,
  FilePenLine,
  Trash2,
} from "lucide-react";

import SectionCard from "../../components/ui/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Drawer from "../../components/ui/Drawer";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/ToastProvider";

import { getApprovalRequests, reviewApprovalRequest } from "./api";

import {
  getUsers,
  createAdminAccount,
  updateAdminAccount,
  removeAdminAccount,
} from "../auth/api";

import { getRoleLabel, isCategoryAdmin, isSuperAdmin } from "../../lib/permissions";

import CreateAdminAccountForm from "./CreateAdminAccountForm";
import AdminDetailsDrawer from "./AdminDetailsDrawer";

import { useAuth } from "../auth/AuthContext";

/**
 * ApprovalRequestsPage
 *
 * Role-aware approval request history and review page.
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
  const location = useLocation();
  const isAdminConsole = location.pathname === "/admin";
  const showRequests = !isAdminConsole;

  const [requests, setRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingAccount, setEditingAccount] = useState(null);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);

  const [accountPendingRemoval, setAccountPendingRemoval] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [reviewConfirmation, setReviewConfirmation] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Admin details drawer
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isAdminDetailsOpen, setIsAdminDetailsOpen] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin(user) && !isCategoryAdmin(user)) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    Promise.all([
      getApprovalRequests(),
      isSuperAdmin(user) ? getUsers() : Promise.resolve([]),
    ])
      .then(([requestsData, usersData]) => {
        if (!isMounted) return;

        setRequests(requestsData);
        setAdmins(usersData);
      })
      .catch(() => {
        if (isMounted) toast.error("Couldn't load approval requests. Try refreshing.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isSuperAdmin(user) && !isCategoryAdmin(user)) return undefined;

    let isMounted = true;
    const refreshRequests = async () => {
      try {
        const requestsData = await getApprovalRequests();
        if (isMounted) setRequests(requestsData);
      } catch {
        // Keep the current list visible if a background refresh fails.
      }
    };

    const handleWindowFocus = () => refreshRequests();
    window.addEventListener("focus", handleWindowFocus);
    const interval = window.setInterval(refreshRequests, 10000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleWindowFocus);
      window.clearInterval(interval);
    };
  }, [user]);

  async function handleReview(request, decision) {
    if (reviewingRequestId === request.id) return;
    setReviewingRequestId(request.id);
    try {
      const reviewedRequest = await reviewApprovalRequest(request.id, decision);

      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? reviewedRequest : r,
        ),
      );
      setSelectedRequest(null);
      window.dispatchEvent(new Event("members-updated"));

      toast.success(
        decision === "approved"
          ? "Request approved and applied"
          : "Request rejected",
      );
    } catch (error) {
      toast.error(error.message || "Something went wrong reviewing this request.");
    } finally {
      setReviewingRequestId(null);
    }
  }

  function askToReview(request, decision) {
    setReviewConfirmation({ request, decision });
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
    } catch (error) {
      toast.error(error.message || "Something went wrong saving this account.");
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
    } catch (error) {
      toast.error(error.message || "Something went wrong removing this account.");
    } finally {
      setAccountPendingRemoval(null);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");
  const isSuper = isSuperAdmin(user);
  const requestHistory = isSuper ? history : requests;
  const filteredHistory = requestHistory.filter((request) => matchesDateFilter(request, dateFilter, customStartDate, customEndDate));
  const historyPageSize = 8;
  const pagedHistory = filteredHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  if (!isSuper && !isCategoryAdmin(user)) {
    return (
      <EmptyState
        icon={Users}
        title="Super Admin access required"
        description="This administration console is restricted to the Super Admin."
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading requests..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isAdminConsole ? "Admin Accounts" : "Approval Requests"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {isAdminConsole
            ? "Create and manage Category Admin and Department Admin accounts."
            : isSuper
              ? "Review member change requests and their current status."
              : "Track the requests you have submitted for Super Admin approval."}
        </p>
      </div>

      {/* Pending Requests */}
      {isSuper && showRequests && <SectionCard title={`Pending Requests (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No pending requests"
            description="All caught up — nothing needs your review."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((request) => (
              <li
                key={request.id}
                className="rounded-xl border border-gray-200 bg-gray-50/60 transition hover:border-[#154d78]/40 hover:bg-white hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedRequest(request)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left focus:outline-none focus:ring-0"
                  aria-label={`View details for ${request.memberName}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={request.type === "delete" ? "inactive" : "info"}>
                        {request.type === "delete" ? "Deletion" : "Edit"}
                      </Badge>
                      <RequestStatus status={request.status} />
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatRequestDateTime(request.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-gray-900">
                      {request.memberName}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {request.requestedBy.name} · {request.requestedBy.scope || "Church-wide"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#154d78]">
                      {request.type === "delete"
                        ? "Member will be removed"
                        : `${Object.keys(request.changes || {}).length} proposed field change${Object.keys(request.changes || {}).length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </button>
                <div className="flex gap-2 border-t border-gray-200 px-4 py-3">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      askToReview(request, "rejected")
                    }
                    className="text-xs"
                    disabled={reviewingRequestId === request.id}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() =>
                      askToReview(request, "approved")
                    }
                    className="text-xs"
                    disabled={reviewingRequestId === request.id}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>}

      {showRequests && <SectionCard
        title={isSuper ? "Request History" : "Approval Requests"}
        headerContent={(
          <div className="w-44 shrink-0">
            <Select
              label=""
              options={[
                { value: "all", label: "All dates" },
                { value: "last-month", label: "Last month" },
                { value: "two-months", label: "Last 2 months" },
                { value: "custom", label: "Custom range" },
              ]}
              value={dateFilter}
              onChange={(event) => { setDateFilter(event.target.value); setHistoryPage(1); }}
              aria-label="Filter approval requests by date"
            />
          </div>
        )}
      >
        {requestHistory.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={isSuper ? "No completed requests" : "No approval requests yet"}
            description={isSuper ? "Approved and rejected requests will appear here." : "Requests you submit for changes that require Super Admin approval will appear here."}
          />
        ) : (
          <>
            {dateFilter === "custom" && <div className="mb-5 grid gap-3 md:grid-cols-2">
              <Input label="From" type="date" value={customStartDate} onChange={(event) => { setCustomStartDate(event.target.value); setHistoryPage(1); }} />
              <Input label="To" type="date" value={customEndDate} onChange={(event) => { setCustomEndDate(event.target.value); setHistoryPage(1); }} />
            </div>}
            {pagedHistory.length === 0 ? (
              <EmptyState icon={Inbox} title="No requests in this date range" description="Try another date filter to see more request history." />
            ) : (
              <RequestHistoryList requests={pagedHistory} onSelect={setSelectedRequest} />
            )}
            <Pagination page={historyPage} pageSize={historyPageSize} totalItems={filteredHistory.length} onPrev={() => setHistoryPage((page) => Math.max(1, page - 1))} onNext={() => setHistoryPage((page) => page + 1)} itemLabel="requests" />
          </>
        )}
      </SectionCard>}

      {showRequests && <ApprovalRequestDrawer
        request={selectedRequest}
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        onReview={askToReview}
        canReview={isSuper && selectedRequest?.status === "pending"}
        isReviewing={selectedRequest && reviewingRequestId === selectedRequest.id}
      />}

      {/* Admin Accounts */}
      {isSuper && isAdminConsole && <SectionCard title="Admin Accounts">
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
                    className="flex w-full items-center justify-between gap-3 rounded-lg py-3 text-left transition hover:bg-gray-50 focus:outline-none cursor-pointer focus:ring-0 first:pt-3 last:pb-3"
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
      </SectionCard>}

      {/* Create / Edit Admin Account */}
      {isAdminConsole && <CreateAdminAccountForm
        isOpen={isAccountFormOpen}
        account={editingAccount}
        onClose={handleCloseAccountForm}
        onSave={handleSaveAccount}
      />}

      {/* Admin Details */}
      {isAdminConsole && <AdminDetailsDrawer
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
      />}

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

      <ConfirmDialog
        isOpen={Boolean(reviewConfirmation)}
        title={reviewConfirmation?.decision === "approved" ? "Approve request?" : "Reject request?"}
        description={reviewConfirmation ? `${reviewConfirmation.decision === "approved" ? "This will apply the requested changes for" : "This will reject the request for"} ${reviewConfirmation.request.memberName}.` : ""}
        confirmLabel={reviewConfirmation?.decision === "approved" ? "Approve" : "Reject"}
        confirmVariant={reviewConfirmation?.decision === "approved" ? "success" : "danger"}
        onConfirm={() => {
          const confirmation = reviewConfirmation;
          setReviewConfirmation(null);
          handleReview(confirmation.request, confirmation.decision);
        }}
        onCancel={() => setReviewConfirmation(null)}
      />
    </div>
  );
}

function formatRequestDate(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function matchesDateFilter(request, filter, startDate, endDate) {
  if (filter === "all") return true;
  const submitted = new Date(request.createdAt);
  const now = new Date();
  if (filter === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return submitted >= start && submitted < end;
  }
  if (filter === "two-months") {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return submitted >= start;
  }
  if (filter === "custom") {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
    return (!start || submitted >= start) && (!end || submitted <= end);
  }
  return true;
}

function formatRequestDateTime(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFieldLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (Array.isArray(value)) return value.join(", ") || "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function RequestStatus({ status }) {
  const labels = { pending: "Pending", approved: "Accepted", rejected: "Rejected" };
  const tones = { pending: "neutral", approved: "active", rejected: "inactive" };
  return <Badge tone={tones[status] || "neutral"}>{labels[status] || status}</Badge>;
}

function RequestHistoryList({ requests, onSelect }) {
  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li key={request.id}>
          <button
            type="button"
            onClick={() => onSelect(request)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#154d78]/40 hover:shadow-sm focus:outline-none focus:ring-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={request.type === "delete" ? "inactive" : "info"}>
                    {request.type === "delete" ? "Delete member" : "Edit member"}
                  </Badge>
                  <RequestStatus status={request.status} />
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-gray-900">{request.memberName}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {request.type === "delete"
                    ? "Member deletion requested"
                    : `${Object.keys(request.changes || {}).length} change${Object.keys(request.changes || {}).length === 1 ? "" : "s"} requested`}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400">
                  <Clock3 className="h-3.5 w-3.5" /> Submitted {formatRequestDateTime(request.createdAt)}
                </p>
              </div>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-400" />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ApprovalRequestDrawer({ request, isOpen, onClose, onReview, canReview, isReviewing }) {
  if (!request) return null;

  const isDeletion = request.type === "delete";
  const changes = Object.entries(request.changes || {});

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isDeletion ? "Deletion Request" : "Edit Request"}
      widthClass="md:max-w-lg"
      desktopModal
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDeletion ? "bg-[#9e263b]/10 text-[#9e263b]" : "bg-[#154d78]/10 text-[#154d78]"}`}>
              {isDeletion ? <Trash2 className="h-5 w-5" /> : <FilePenLine className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{request.memberName}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Submitted by {request.requestedBy.name}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <InfoBlock label="Requester role" value={getRequesterRole(request.requestedBy.role)} />
            <InfoBlock label="Scope" value={request.requestedBy.scope || "Church-wide"} />
            <InfoBlock label="Submitted" value={formatRequestDate(request.createdAt)} />
            <InfoBlock label="Status" value={<RequestStatus status={request.status} />} />
          </div>

          <section className="mt-7">
            <h4 className="text-sm font-semibold text-gray-900">
              {isDeletion ? "Requested action" : "Proposed changes"}
            </h4>
            {isDeletion ? (
              <div className="mt-3 rounded-lg border border-[#9e263b]/20 bg-[#9e263b]/5 p-4 text-sm text-[#821f31]">
                This member will be permanently removed after approval.
              </div>
            ) : changes.length > 0 ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                {changes.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0">
                    <span className="text-sm font-medium text-gray-500">{formatFieldLabel(key)}</span>
                    <span className="break-words text-sm font-medium text-gray-900">{formatFieldValue(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No field changes were supplied.</p>
            )}
          </section>

          {request.reviewedAt && request.status !== "pending" && (
            <p className="mt-4 text-xs text-gray-400">
              {request.status === "approved" ? "Accepted" : "Rejected"} {formatRequestDateTime(request.reviewedAt)}
            </p>
          )}

          <section className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900">Reason from requester</h4>
            <p className="mt-2 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-600">
              {request.reason || "No reason was provided."}
            </p>
          </section>
        </div>

        {canReview && <div className="sticky bottom-0 z-10 flex shrink-0 gap-3 border-t border-gray-100 bg-white p-5 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
          <Button
            variant="danger"
            onClick={() => onReview(request, "rejected")}
            disabled={isReviewing}
            className="flex-1"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button
            variant="success"
            onClick={() => onReview(request, "approved")}
            disabled={isReviewing}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
        </div>}
      </div>
    </Drawer>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function getRequesterRole(role) {
  if (role === "category_admin") return "Category Admin";
  if (role === "department_admin") return "Department Admin";
  if (role === "super_admin") return "Super Admin";
  return "Administrator";
}
