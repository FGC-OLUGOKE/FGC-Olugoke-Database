# FGC-Olugoke Database Backend

Django REST API for the FGC-Olugoke church membership administration system.
The React frontend calls this service through the feature API modules in
`frontend/src/features/*/api.js`.

## Roles and permissions

The application has two roles:

- **Super Admin** — one account with unrestricted access. Can manage all
  members, departments, staff accounts, attendance, events, reports,
  announcements, and approval requests.
- **Staff Admin** — assigned to exactly one department. Can view and manage
  members assigned to that department, including creating, editing, deleting,
  and assigning members. Staff Admins can only see department-scoped
  announcements, reports, attendance, events, and activity.

The database enforces one Super Admin. Staff Admin accounts are created and
managed by the Super Admin through the custom frontend admin console.

## Setup

From the `backend` directory:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py create_super_admin --name "Church Administrator" --email admin@example.com --password "use-a-strong-password"
python manage.py runserver
```

On Windows PowerShell, use the Python executable or activate the virtual
environment if the `python` command is not on `PATH`.

The API is available at `http://127.0.0.1:8000/api/`.

The Django technical administration site is separate from the application
admin console and is available at `http://127.0.0.1:8000/admin/`.
The application admin console is the React page at
`http://localhost:5173/admin` when the frontend is running.

## Authentication

`POST /api/auth/login/` accepts:

```json
{ "email": "admin@example.com", "password": "use-a-strong-password" }
```

It returns a token and frontend-compatible account object:

```json
{
  "token": "token-value",
  "user": {
    "id": 1,
    "name": "Church Administrator",
    "email": "admin@example.com",
    "role": "super_admin",
    "scope": null
  }
}
```

Send the token with every protected request:

```text
Authorization: Token <token>
```

Use `GET /api/me/` to retrieve the current account and
`POST /api/auth/logout/` to revoke its token.


- `POST /api/auth/password-reset/` - body `{"email": "..."}`. Emails a reset code to the
  matching active user. Always returns 200 so the response does not reveal whether an
  account exists.
- `POST /api/auth/password-reset/confirm/` - body `{"code": "...", "new_password": "..."}`.
  The code is the `<uid>.<token>` string from the email; it is single use and the new
  password runs through `AUTH_PASSWORD_VALIDATORS`.

Email is configured through environment variables, defaulting to the console backend for
local development:

- `EMAIL_BACKEND` (default `django.core.mail.backends.console.EmailBackend`)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`
- `PASSWORD_RESET_URL` - frontend page named in the email where the code is entered
  (default `http://localhost:5173/reset-password`)

Run the tests with `python manage.py test members`.


## API endpoints

All endpoints below are prefixed with `/api/` and require an authenticated
application account unless stated otherwise.

### Accounts and administration

- `GET|POST|PATCH|DELETE /users/` — Super Admin account management. Staff
  account creation accepts `name`, `email`, `password`, `role` set to
  `department_admin`, and `scope` set to the department name, or the
  equivalent `departmentId` field.
- `GET|POST|PATCH|DELETE /departments/` — department records. All admins can
  read their permitted departments; only Super Admin can write them.
- `GET /activity-log/` — recent activity, scoped to the current admin.

### Members

- `GET|POST|PATCH|DELETE /members/` — member records, scoped by role.
- `PATCH /members/{id}/departments/` — add or remove a department using one
  of these bodies:

  ```json
  { "add": "Choir" }
  ```

  ```json
  { "remove": "Choir" }
  ```

Member responses use the frontend camelCase contract, including
`membershipId`, `photoUrl`, `firstName`, `lastName`, `dateOfBirth`,
`maritalStatus`, `phone`, `email`, `address`, `category`,
`departments`, `status`, `dateJoined`, `baptized`, `worker`, `cellGroup`, and
`serviceUnit`.

### Church operations

- `GET|POST|PATCH|DELETE /announcements/` — announcements, scoped by
  department for Staff Admins.
- `GET|POST|PATCH|DELETE /department-reports/` — department reports.
- `GET|POST|PATCH|DELETE /attendance/` — attendance summaries by date and
  optional department.
- `GET|POST|PATCH|DELETE /events/` — church and department events.
- `GET|POST|PATCH|DELETE /approval-requests/` — member edit/delete requests;
  Super Admin reviews pending requests.
- `GET /membership-growth/` — dashboard membership growth data.

### Auth routes

- `POST /auth/login/`
- `POST /auth/logout/`
- `GET /me/`

## Frontend integration

The frontend API client defaults to:

```text
http://127.0.0.1:8000/api
```

Set `VITE_API_URL` when the backend runs elsewhere, for example:

```text
VITE_API_URL=http://localhost:8000/api
```

Start the frontend from the `frontend` directory with `npm.cmd run dev` on
PowerShell systems where the `npm.ps1` execution policy is restricted.

## Database migrations and checks

After changing models, create and apply migrations:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py check
```

The current migrations include the member profile metadata and the final
two-role account model.
