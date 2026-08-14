# Backend Integration Guide

Every feature module has its own `api.js` (e.g. `src/features/members/api.js`).
**All mock/placeholder data lives behind these files.** No component ever
imports `mockData.js` directly — they only call functions from `api.js`.

## The pattern

Each function currently looks like this:

```js
export async function getMembers() {
  // TODO: replace with:
  //   const res = await fetch("/api/members");
  //   if (!res.ok) throw new Error("Failed to load members");
  //   return res.json();
  return simulateNetwork(mockMembers);
}
```

To connect a real endpoint: **delete the `simulateNetwork(...)` line, uncomment
and adjust the `fetch()` block above it.** That's the entire change. Nothing
in any page or component needs to be touched, because every caller already
expects an async function returning a Promise — that's true today (backed by
mock data) and will still be true once it's backed by a real request.

## Where each dataset lives

| Feature | File | Functions |
|---|---|---|
| Members | `src/features/members/api.js` | `getMembers`, `createMember`, `updateMember`, `deleteMember` |
| Departments | `src/features/departments/api.js` | `getDepartments`, `createDepartment`, `updateDepartment`, `deleteDepartment` |
| Attendance | `src/features/attendance/api.js` | `getAttendanceHistory`, `recordAttendance` |
| Events | `src/features/events/api.js` | `getEvents`, `createEvent`, `updateEvent`, `deleteEvent` |
| Dashboard | `src/features/dashboard/api.js` | `getMembershipGrowth`, `getRecentActivity`, `getDashboardData` (aggregates all of the above) |

Each of these maps to one real REST resource you can build and ship
independently — you don't need every endpoint done at once. As soon as, say,
`/api/members` is live, edit only `getMembers()`/`createMember()`/etc. in
`features/members/api.js`, and the Members page, the Dashboard's stats, and
the Departments page's member counts all pick it up automatically (they all
call `getMembers()`, never the mock array directly).

## What to expect back

- List endpoints (`getMembers`, `getEvents`, etc.) should return an **array**
  of plain objects matching the shape already in each `mockData.js` file —
  that's the exact field set the UI already renders.
- Create/update endpoints should return the **saved object** (including its
  real `id` from the database) — the UI uses the returned value to update
  its local state.
- Delete endpoints just need to resolve/succeed; the UI already knows which
  item to remove from its own state.

## Not yet wired to a page

`recordAttendance`, `createEvent`, `updateEvent`, and `deleteEvent` exist as
placeholder functions but don't have a UI calling them yet (Attendance and
Events pages haven't been built out beyond "Coming Soon"). They're there so
the API shape is agreed early — feel free to build those endpoints whenever,
they'll get wired up when those pages are built.