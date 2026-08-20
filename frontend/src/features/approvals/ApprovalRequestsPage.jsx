import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Inbox, Users, UserPlus } from "lucide-react";
import SectionCard from "../../components/ui/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useToast } from "../../components/ui/ToastProvider";
import { getApprovalRequests, reviewApprovalRequest } from "./api";
import { getUsers, createAdminAccount } from "../auth/api";
import { updateMember, deleteMember } from "../members/api";
import { getRoleLabel } from "../../lib/permissions";
import CreateAdminAccountForm from "./CreateAdminAccountForm";

/**
 * ApprovalRequestsPage
 *
 * Super Admin only (enforced by RequireAccess + hidden from other
 * roles' nav via lib/permissions.js). Two responsibilities live here,
 * matching the two things the spec lists as Super-Admin-exclusive:
 *
 * 1. Reviewing edit/delete requests submitted by Category Admins.
 *    Approving one now actually APPLIES the change (calls
 *    updateMember/deleteMember) — this isn't just a status flag with
 *    no effect. Known limitation: since each page fetches its own
 *    copy of `members` independently (no shared global store yet),
 *    an approval applied here won't visibly update the Members page
 *    until it's next loaded/refreshed. Worth revisiting once there's
 *    a shared data layer.
 *
 * 2. Creating Category Admin / Department Admin accounts. Newly
 *    created accounts show up in this page's own list immediately,
 *    but won't appear in the Navbar's "Preview as" role switcher
 *    until the page reloads — that list comes from AuthContext,
 *    fetched once on app load, and isn't refreshed by this page.
 */
export default function ApprovalRequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  useEffect(() => {
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
  }, []);

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
        prev.map((r) => (r.id === request.id ? { ...r, status: decision } : r))
      );
      toast.success(
        decision === "approved" ? "Request approved and applied" : "Request rejected"
      );
    } catch {
      toast.error("Something went wrong reviewing this request.");
    }
  }

  async function handleCreateAdmin(accountData) {
    try {
      const created = await createAdminAccount(accountData);
      setAdmins((prev) => [...prev, created]);
      toast.success(`${created.name} was added as ${getRoleLabel(created)}`);
      setIsCreateFormOpen(false);
    } catch {
      toast.error("Something went wrong creating this account.");
    }
  }

  const pending = requests.filter((r) => r.status === "pending");

  if (isLoading) {
    return <LoadingState label="Loading approval requests..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Approvals &amp; Admin Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review requests from Category Admins and manage Category/Department Admin accounts.
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
                    <Badge tone={request.type === "delete" ? "neutral" : "info"}>
                      {request.type === "delete" ? "Deletion Request" : "Edit Request"}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {request.memberName} — requested by {request.requestedBy.name} (
                    {request.requestedBy.scope} Category Admin)
                  </p>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                  {request.changes && Object.keys(request.changes).length > 0 && (
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
          <Button variant="primary" onClick={() => setIsCreateFormOpen(true)} className="text-xs">
            <UserPlus className="h-3.5 w-3.5" />
            New Admin Account
          </Button>
        </div>

        {admins.length === 0 ? (
          <EmptyState icon={Users} title="No admin accounts" description="Create the first one to get started." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{admin.name}</p>
                  <p className="truncate text-xs text-gray-500">{admin.email}</p>
                </div>
                <Badge tone={admin.role === "super_admin" ? "info" : "neutral"}>
                  {getRoleLabel(admin)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <CreateAdminAccountForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onSave={handleCreateAdmin}
      />
    </div>
  );
}