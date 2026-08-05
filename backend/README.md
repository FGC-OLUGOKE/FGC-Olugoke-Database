# FGC-Olugoke Database Backend

This Django backend stores general church member information for the FGC-Olugoke website.

## Overview

- Uses Django with Django REST Framework and CORS headers.
- Defines a `Member` model for general membership records.
- Exposes a REST API at `/api/members/`.
- Only Django admin users should manage member records.

## Model

The `Member` model captures general member profile data:

- `title` - optional prefix such as Mr., Mrs., or Dr.
- `first_name` - required first name
- `other_name` - optional middle or other names
- `last_name` - required last name
- `gender` - required gender choice
- `picture` - optional profile photo upload
- `date_of_birth` - optional birth date
- `marital_status` - optional marital status
- `date_of_marriage` - optional marriage date
- `type_of_marriage` - optional marriage type
- `number_of_children` - optional children count
- `email` - optional contact email
- `mobile` - optional mobile phone
- `updated_at` - auto-managed timestamp when the record is changed

### Removed metadata

The backend no longer stores minister-specific or sensitive metadata such as:

- `second_mobile`
- `other_phone`
- `minister_id`
- `status`
- `designation`
- `zone`
- `church`
- `district`

This keeps the database general-purpose for all church members.

## Admin access

- The Django admin interface is the intended way to review and edit member records.
- Only admin users with login access should manage members.
- The `updated_at` field is read-only in the admin.

## Installation

From the `backend` folder:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install django djangorestframework django-cors-headers pillow
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## API

- `GET /api/members/` - list members
- `POST /api/members/` - create member
- `GET /api/members/{id}/` - retrieve member
- `PUT /api/members/{id}/` - update member
- `PATCH /api/members/{id}/` - partially update member
- `DELETE /api/members/{id}/` - delete member

## Notes

- The app is named `ministers` for now, but uses a generic `Member` model.
- You can rename the app later if desired.
