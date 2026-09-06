# Backend Integration Guide

Every feature module has its own `api.js` (for example,
`src/features/members/api.js`). These modules call the Django REST API through
`src/lib/apiClient.js`; components do not contain direct fetch calls.

The default API URL is `/api`. The Vite development server proxies that path
to Django at `http://127.0.0.1:8000`; on Vercel it is served by this project's
same-origin `/api` route. Set `VITE_API_BASE_URL` only when the backend runs at
another address.

## Where each dataset lives

| Feature     | File                              | Functions                                                                                    |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Members     | `src/features/members/api.js`     | `getMembers`, `createMember`, `updateMember`, `deleteMember`                                 |
| Departments | `src/features/departments/api.js` | `getDepartments`, `createDepartment`, `updateDepartment`, `deleteDepartment`                 |
| Attendance  | `src/features/attendance/api.js`  | `getAttendanceHistory`, `recordAttendance`                                                   |
| Events      | `src/features/events/api.js`      | `getEvents`, `createEvent`, `updateEvent`, `deleteEvent`                                     |
| Dashboard   | `src/features/dashboard/api.js`   | `getMembershipGrowth`, `getRecentActivity`, `getDashboardData` (aggregates all of the above) |

Each function maps to a live REST resource. Pages receive server responses
and update their local state after successful create, update, or delete calls.

## What to expect back

- List endpoints (`getMembers`, `getEvents`, etc.) return an **array** of
  plain objects matching the frontend field contract.
- Create/update endpoints should return the **saved object** (including its
  real `id` from the database) — the UI uses the returned value to update
  its local state.
- Delete endpoints just need to resolve/succeed; the UI already knows which
  item to remove from its own state.

## Authentication

The API client stores the token returned by `POST /auth/login/` and sends it
as `Authorization: Token <token>` on protected requests. Login, logout, and
current-account requests are implemented in `src/features/auth/api.js`.

Start the services with Django on port `8000` and Vite on port `5173` before
using the application. There is no frontend dummy-data fallback; API errors
are surfaced through each page's loading/error state.
