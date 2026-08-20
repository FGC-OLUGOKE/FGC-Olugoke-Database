// One seeded pending request so the review page isn't empty on
// first look. Nothing currently creates new requests — Category
// Admin's edit/delete submission flow isn't wired into the UI yet
// (see lib/permissions.js) — but the review side is fully real, so
// this demonstrates the pipeline works end to end for whenever
// submission is built.

const mockApprovalRequests = [
  {
    id: 1,
    type: "edit", // "edit" | "delete"
    memberId: 10, // Blessing Umeh
    memberName: "Blessing Umeh",
    requestedBy: { id: 4, name: "Grace Okafor", role: "category_admin", scope: "Youth" },
    changes: { phone: "08099998888" },
    reason: "Member provided an updated phone number.",
    status: "pending", // "pending" | "approved" | "rejected"
    createdAt: "2026-08-14T10:00:00",
  },
];

export default mockApprovalRequests;