import mockApprovalRequests from "./mockData";

const SIMULATED_DELAY_MS = 300;

function simulateNetwork(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

export async function getApprovalRequests() {
  // TODO: replace with `GET /api/approval-requests`
  return simulateNetwork(mockApprovalRequests);
}

export async function submitApprovalRequest(requestData) {
  // TODO: replace with `POST /api/approval-requests`. Not called
  // anywhere yet — this is the seam for when Category Admin's
  // edit/delete flow is built to submit through here instead of
  // calling updateMember/deleteMember directly.
  const created = {
    id: Date.now(),
    status: "pending",
    createdAt: new Date().toISOString(),
    ...requestData,
  };
  return simulateNetwork(created);
}

export async function reviewApprovalRequest(id, decision) {
  // TODO: replace with `PATCH /api/approval-requests/:id { status: decision }`
  return simulateNetwork({ id, status: decision });
}