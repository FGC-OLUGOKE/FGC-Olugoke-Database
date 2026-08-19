import mockMembers from "./mockData";

/**
 * Data-access layer for Members.
 *
 * Every component/page should go through these functions instead of
 * importing mockData directly. Right now they just resolve the mock
 * array (wrapped in a Promise, with a small simulated delay so
 * loading states are actually visible/testable) — but the shape
 * matches a real fetch() call exactly, so switching to your Express
 * backend later means editing ONLY this file. Nothing in
 * MembersPage, MemberList, MemberForm, etc. needs to change.
 */

const SIMULATED_DELAY_MS = 300; // remove once these hit a real network

function simulateNetwork(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

export async function getMembers() {
  // TODO: replace with:
  //   const res = await fetch("/api/members");
  //   if (!res.ok) throw new Error("Failed to load members");
  //   return res.json();
  return simulateNetwork(mockMembers);
}

export async function createMember(memberData) {
  // TODO: replace with:
  //   const res = await fetch("/api/members", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(memberData),
  //   });
  //   if (!res.ok) throw new Error("Failed to create member");
  //   return res.json();
  const created = { id: Date.now(), ...memberData };
  return simulateNetwork(created);
}

export async function updateMember(id, memberData) {
  // TODO: replace with a real PUT/PATCH to `/api/members/${id}`
  const updated = { id, ...memberData };
  return simulateNetwork(updated);
}

export async function deleteMember(id) {
  // TODO: replace with a real DELETE to `/api/members/${id}`
  return simulateNetwork({ id });
}

/**
 * Adds/removes ONE department from a member's `departments` array
 * without touching their other memberships — this is what powers
 * Department Admin's "add existing member" / "remove from
 * department" actions (distinct from editing or deleting the member
 * entirely, which Department Admins can't do). The actual array
 * merge/filter happens in the calling page (it already has the
 * member's current departments in state); these functions just
 * represent the network round-trip.
 */
export async function assignMemberToDepartment(memberId, departmentName) {
  // TODO: replace with a real PATCH to `/api/members/${memberId}/departments`
  //   body: { add: departmentName }
  return simulateNetwork({ memberId, departmentName, action: "add" });
}

export async function removeMemberFromDepartment(memberId, departmentName) {
  // TODO: replace with a real PATCH to `/api/members/${memberId}/departments`
  //   body: { remove: departmentName }
  return simulateNetwork({ memberId, departmentName, action: "remove" });
}
