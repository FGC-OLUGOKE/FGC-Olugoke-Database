from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from .models import AdminAccount, ApprovalRequest, AttendanceRecord, Department, Member


class AccessControlTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.choir = Department.objects.create(name="Choir")
        self.media = Department.objects.create(name="Media")
        super_user = User.objects.create_user(username="super@example.com", email="super@example.com", password="secure-pass")
        AdminAccount.objects.create(user=super_user, role=AdminAccount.SUPER_ADMIN)
        self.super_token = Token.objects.create(user=super_user).key
        staff_user = User.objects.create_user(username="choir@example.com", email="choir@example.com", password="secure-pass")
        AdminAccount.objects.create(user=staff_user, role=AdminAccount.DEPARTMENT_ADMIN, department=self.choir)
        self.staff_token = Token.objects.create(user=staff_user).key
        self.choir_member = Member.objects.create(first_name="Ada", last_name="Choir", gender="Female", date_of_birth="2000-01-01")
        self.choir_member.departments.add(self.choir)
        self.media_member = Member.objects.create(first_name="Ben", last_name="Media", gender="Male", date_of_birth="2000-01-01")
        self.media_member.departments.add(self.media)
        category_user = User.objects.create_user(username="youth@example.com", email="youth@example.com", password="secure-pass")
        AdminAccount.objects.create(user=category_user, role=AdminAccount.CATEGORY_ADMIN, category="Youth")
        self.category_token = Token.objects.create(user=category_user).key

    def authenticate(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_logout_invalidates_the_current_token(self):
        self.authenticate(self.super_token)

        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Token.objects.filter(key=self.super_token).exists())

        response = self.client.get("/api/me/")
        self.assertEqual(response.status_code, 401)

    def test_logout_succeeds_when_the_token_is_already_missing(self):
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, 204)

    def test_password_reset_reports_unknown_email(self):
        response = self.client.post(
            "/api/auth/password-reset/request/",
            {"email": "missing@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["detail"], "No active admin account exists for that email.")

    def test_password_reset_confirms_existing_admin_email(self):
        response = self.client.post(
            "/api/auth/password-reset/request/",
            {"email": "super@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["detail"], "A password reset link has been sent to your email.")

    def test_department_admin_only_sees_and_manages_own_department(self):
        self.authenticate(self.staff_token)
        response = self.client.get("/api/members/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([member["id"] for member in response.data], [self.choir_member.id])
        self.assertIn("firstName", response.data[0])
        self.assertEqual(self.client.patch(f"/api/members/{self.choir_member.id}/", {"status": "Active"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch(f"/api/members/{self.media_member.id}/departments/", {"add": "Media"}, format="json").status_code, 404)
        self.assertEqual(self.client.patch(f"/api/members/{self.media_member.id}/", {"status": "Active"}, format="json").status_code, 404)

    def test_super_admin_can_create_department_admin(self):
        self.authenticate(self.super_token)
        response = self.client.post("/api/users/", {"name": "Media Lead", "email": "lead@example.com", "password": "another-secure-password", "departmentId": self.media.id}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["role"], "department_admin")
        self.assertEqual(response.data["scope"], "Media")

    def test_super_admin_can_create_managing_departments_and_pastorate_accounts(self):
        self.authenticate(self.super_token)

        managing = self.client.post(
            "/api/users/",
            {"name": "Managing Lead", "email": "managing@example.com", "password": "another-secure-password", "role": AdminAccount.MANAGING_DEPARTMENTS},
            format="json",
        )
        self.assertEqual(managing.status_code, 201, managing.data)
        self.assertEqual(managing.data["role"], AdminAccount.MANAGING_DEPARTMENTS)
        self.assertEqual(managing.data["scope"], None)

        pastorate = self.client.post(
            "/api/users/",
            {
                "name": "Pastorate Lead",
                "email": "pastorate@example.com",
                "password": "another-secure-password",
                "role": AdminAccount.PASTORATE,
                "departmentIds": [self.choir.id, self.media.id],
            },
            format="json",
        )
        self.assertEqual(pastorate.status_code, 201, pastorate.data)
        self.assertEqual(pastorate.data["role"], AdminAccount.PASTORATE)
        self.assertEqual(set(pastorate.data["departments"]), {self.choir.name, self.media.name})

    def test_managing_departments_reads_all_but_cannot_write_and_pastorate_manages_assigned_departments(self):
        User = get_user_model()
        managing_user = User.objects.create_user(username="managing@example.com", email="managing@example.com", password="secure-pass")
        AdminAccount.objects.create(user=managing_user, role=AdminAccount.MANAGING_DEPARTMENTS)
        managing_token = Token.objects.create(user=managing_user).key

        pastorate_user = User.objects.create_user(username="pastorate@example.com", email="pastorate@example.com", password="secure-pass")
        pastorate_account = AdminAccount.objects.create(user=pastorate_user, role=AdminAccount.PASTORATE)
        pastorate_account.departments.add(self.choir)
        pastorate_token = Token.objects.create(user=pastorate_user).key

        self.authenticate(managing_token)
        members = self.client.get("/api/members/")
        self.assertEqual(members.status_code, 200)
        self.assertEqual({member["id"] for member in members.data}, {self.choir_member.id, self.media_member.id})
        self.assertEqual(self.client.patch(f"/api/members/{self.choir_member.id}/", {"status": "Active"}, format="json").status_code, 403)

        self.authenticate(pastorate_token)
        members = self.client.get("/api/members/")
        self.assertEqual(members.status_code, 200)
        self.assertEqual({member["id"] for member in members.data}, {self.choir_member.id, self.media_member.id})
        self.assertEqual(self.client.patch(f"/api/members/{self.choir_member.id}/", {"status": "Active"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch(f"/api/members/{self.media_member.id}/", {"status": "Active"}, format="json").status_code, 403)

    def test_super_admin_can_promote_member_and_demote_admin_back_to_member(self):
        self.authenticate(self.super_token)
        User = get_user_model()
        User.objects.create_user(
            username="member-only@example.com",
            email="member-only@example.com",
            password="secure-pass",
        )

        promoted = self.client.post(
            "/api/users/promote_member/",
            {
                "member_id": self.choir_member.id,
                "role": AdminAccount.DEPARTMENT_ADMIN,
                "department_id": self.choir.id,
                "password": "another-secure-password",
            },
            format="json",
        )
        self.assertEqual(promoted.status_code, 201, promoted.data)
        self.assertEqual(promoted.data["role"], AdminAccount.DEPARTMENT_ADMIN)
        self.assertEqual(promoted.data["scope"], self.choir.name)
        self.assertNotEqual(promoted.data["id"], AdminAccount.objects.get(user__email="ada.choir@member").pk)

        self.choir_member.refresh_from_db()
        self.assertIsNotNone(self.choir_member.user_id)
        admin_user_id = self.choir_member.user_id
        self.assertTrue(AdminAccount.objects.filter(user_id=admin_user_id).exists())

        demoted = self.client.post(
            "/api/users/demote_admin/",
            {"admin_id": promoted.data["id"]},
            format="json",
        )
        self.assertEqual(demoted.status_code, 200, demoted.data)
        self.assertEqual(demoted.data["detail"], "Admin successfully demoted to regular member.")

        self.choir_member.refresh_from_db()
        self.assertIsNone(self.choir_member.user_id)
        self.assertFalse(AdminAccount.objects.filter(user_id=admin_user_id).exists())
        self.assertFalse(get_user_model().objects.filter(pk=admin_user_id).exists())

    def test_super_admin_cannot_remove_staff_department_assignment(self):
        self.authenticate(self.super_token)
        staff_account = AdminAccount.objects.get(user__email="choir@example.com")
        response = self.client.patch(f"/api/users/{staff_account.user_id}/", {"departmentId": None}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_deleting_admin_releases_email_and_uses_the_serialized_user_id(self):
        self.authenticate(self.super_token)
        User = get_user_model()
        # Ensure the user and AdminAccount IDs differ; this mirrors a real
        # database where not every user is an application admin.
        User.objects.create_user(username="member-only@example.com", email="member-only@example.com", password="secure-pass")

        created = self.client.post(
            "/api/users/",
            {"name": "Media Lead", "email": "lead@example.com", "password": "another-secure-password", "departmentId": self.media.id},
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        account = AdminAccount.objects.get(user__email="lead@example.com")
        self.assertNotEqual(created.data["id"], account.pk)

        deleted = self.client.delete(f"/api/users/{created.data['id']}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(AdminAccount.objects.filter(user_id=created.data["id"]).exists())
        self.assertFalse(User.objects.get(pk=created.data["id"]).is_active)

        recreated = self.client.post(
            "/api/users/",
            {"name": "New Media Lead", "email": "lead@example.com", "password": "another-secure-password", "departmentId": self.media.id},
            format="json",
        )
        self.assertEqual(recreated.status_code, 201, recreated.data)

    def test_category_admin_only_sees_and_creates_members_in_own_category(self):
        self.choir_member.category = "Youth"
        self.choir_member.save(update_fields=("category",))
        self.media_member.category = "Adult"
        self.media_member.save(update_fields=("category",))
        self.authenticate(self.category_token)
        response = self.client.get("/api/members/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([member["id"] for member in response.data], [self.choir_member.id])
        response = self.client.post("/api/members/", {"firstName": "Cara", "lastName": "Youth", "gender": "Female", "dateOfBirth": "2001-01-01", "category": "Adult"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["category"], "Youth")

    def test_category_admin_only_sees_departments_and_reports_with_own_category_members(self):
        self.choir_member.category = "Youth"
        self.choir_member.save(update_fields=("category",))
        self.media_member.category = "Adult"
        self.media_member.save(update_fields=("category",))
        from .models import DepartmentReport
        super_user = get_user_model().objects.get(email="super@example.com")

        DepartmentReport.objects.create(
            department=self.choir,
            subject="Youth report",
            body="Youth details",
            submitted_by=super_user,
        )
        DepartmentReport.objects.create(
            department=self.media,
            subject="Adult report",
            body="Adult details",
            submitted_by=super_user,
        )

        self.authenticate(self.category_token)
        departments_response = self.client.get("/api/departments/")
        reports_response = self.client.get("/api/department-reports/")
        self.assertEqual(departments_response.status_code, 200)
        self.assertEqual(reports_response.status_code, 200)
        self.assertEqual([department["name"] for department in departments_response.data], ["Choir"])
        self.assertEqual([report["subject"] for report in reports_response.data], ["Youth report"])

    def test_category_admin_can_record_and_view_attendance_for_their_category(self):
        self.authenticate(self.category_token)
        response = self.client.post(
            "/api/attendance/",
            {
                "date": "2026-08-29",
                "adults": 8,
                "youth": 5,
                "teenagers": 3,
                "children": 4,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["total"], 20)

        response = self.client.post(
            "/api/attendance/",
            {
                "date": "2026-08-29",
                "adults": 0,
                "youth": 8,
                "teenagers": 0,
                "children": 0,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["total"], 8)

        response = self.client.get("/api/attendance/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["youth"], 5)
        self.assertEqual(response.data[1]["youth"], 8)

    def test_category_admin_can_submit_edit_and_delete_requests_for_own_category(self):
        self.choir_member.category = "Youth"
        self.choir_member.save(update_fields=("category",))
        self.authenticate(self.category_token)

        edit_response = self.client.post(
            "/api/approval-requests/",
            {
                "type": "edit",
                "memberId": self.choir_member.id,
                "changes": {"phone": "0700000000"},
            },
            format="json",
        )
        self.assertEqual(edit_response.status_code, 201, edit_response.data)
        self.assertEqual(edit_response.data["status"], ApprovalRequest.PENDING)

        delete_response = self.client.post(
            "/api/approval-requests/",
            {
                "type": "delete",
                "memberId": self.choir_member.id,
                "changes": {},
            },
            format="json",
        )
        self.assertEqual(delete_response.status_code, 201, delete_response.data)
        self.assertEqual(ApprovalRequest.objects.filter(requested_by__email="youth@example.com").count(), 2)

        history_response = self.client.get("/api/approval-requests/")
        self.assertEqual(history_response.status_code, 200)
        self.assertEqual(len(history_response.data), 2)
        self.assertTrue(all(item["requestedBy"]["email"] == "youth@example.com" for item in history_response.data))

    def test_category_admin_cannot_request_changes_for_another_category(self):
        self.choir_member.category = "Adult"
        self.choir_member.save(update_fields=("category",))
        self.authenticate(self.category_token)

        response = self.client.post(
            "/api/approval-requests/",
            {"type": "delete", "memberId": self.choir_member.id, "changes": {}},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_category_admins_only_see_requests_they_created(self):
        User = get_user_model()
        adult_user = User.objects.create_user(
            username="adult@example.com",
            email="adult@example.com",
            password="secure-pass",
        )
        AdminAccount.objects.create(
            user=adult_user,
            role=AdminAccount.CATEGORY_ADMIN,
            category="Adult",
        )
        adult_token = Token.objects.create(user=adult_user).key

        self.choir_member.category = "Youth"
        self.choir_member.save(update_fields=("category",))
        self.media_member.category = "Adult"
        self.media_member.save(update_fields=("category",))

        self.authenticate(self.category_token)
        youth_request = self.client.post(
            "/api/approval-requests/",
            {"type": "edit", "memberId": self.choir_member.id, "changes": {"phone": "0700000000"}},
            format="json",
        )
        self.assertEqual(youth_request.status_code, 201, youth_request.data)

        self.authenticate(adult_token)
        adult_request = self.client.post(
            "/api/approval-requests/",
            {"type": "delete", "memberId": self.media_member.id, "changes": {}},
            format="json",
        )
        self.assertEqual(adult_request.status_code, 201, adult_request.data)

        adult_history = self.client.get("/api/approval-requests/")
        self.assertEqual(adult_history.status_code, 200)
        self.assertEqual([item["id"] for item in adult_history.data], [adult_request.data["id"]])
        self.assertEqual(
            self.client.get(f"/api/approval-requests/{youth_request.data['id']}/").status_code,
            404,
        )

        self.authenticate(self.category_token)
        youth_history = self.client.get("/api/approval-requests/")
        self.assertEqual(youth_history.status_code, 200)
        self.assertEqual([item["id"] for item in youth_history.data], [youth_request.data["id"]])
        self.assertEqual(
            self.client.get(f"/api/approval-requests/{adult_request.data['id']}/").status_code,
            404,
        )

    def test_super_admin_can_approve_and_reject_category_requests(self):
        self.choir_member.category = "Youth"
        self.choir_member.save(update_fields=("category",))

        self.authenticate(self.category_token)
        edit_response = self.client.post(
            "/api/approval-requests/",
            {"type": "edit", "memberId": self.choir_member.id, "changes": {"phone": "0700000000"}},
            format="json",
        )
        reject_response = self.client.post(
            "/api/approval-requests/",
            {"type": "delete", "memberId": self.choir_member.id, "changes": {}},
            format="json",
        )
        self.assertEqual(edit_response.status_code, 201, edit_response.data)
        self.assertEqual(reject_response.status_code, 201, reject_response.data)
        self.assertEqual(edit_response.data["memberId"], self.choir_member.id)
        self.assertEqual(reject_response.data["memberId"], self.choir_member.id)

        self.authenticate(self.super_token)
        approve = self.client.patch(
            f"/api/approval-requests/{edit_response.data['id']}/",
            {"status": "approved"},
            format="json",
        )
        reject = self.client.patch(
            f"/api/approval-requests/{reject_response.data['id']}/",
            {"status": "rejected"},
            format="json",
        )
        self.assertEqual(approve.status_code, 200, approve.data)
        self.assertEqual(reject.status_code, 200, reject.data)
        self.assertEqual(approve.data["status"], ApprovalRequest.APPROVED)
        self.assertEqual(reject.data["status"], ApprovalRequest.REJECTED)
        self.assertIsNotNone(approve.data["reviewedAt"])
        self.assertIsNotNone(reject.data["reviewedAt"])
        self.choir_member.refresh_from_db()
        self.assertEqual(self.choir_member.phone, "0700000000")

        delete_member = Member.objects.create(
            first_name="Dina",
            last_name="Youth",
            gender="Female",
            date_of_birth="2000-01-01",
            category="Youth",
        )
        self.authenticate(self.category_token)
        delete_request = self.client.post(
            "/api/approval-requests/",
            {"type": "delete", "memberId": delete_member.id, "changes": {}},
            format="json",
        )
        self.assertEqual(delete_request.status_code, 201, delete_request.data)
        self.authenticate(self.super_token)
        approve_delete = self.client.patch(
            f"/api/approval-requests/{delete_request.data['id']}/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(approve_delete.status_code, 200, approve_delete.data)
        self.assertEqual(approve_delete.data["status"], ApprovalRequest.APPROVED)
        self.assertFalse(Member.objects.filter(pk=delete_member.id).exists())


from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetEmailTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="member1",
            email="member1@example.com",
            password="OldPassw0rd!",
        )

    def request_reset(self, email):
        return self.client.post(
            reverse("password-reset"),
            {"email": email},
            content_type="application/json",
        )

    def reset_code(self):
        return mail.outbox[0].body.strip().splitlines()[-1].strip()

    def test_reset_email_sent_to_registered_user(self):
        response = self.request_reset("member1@example.com")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["member1@example.com"])
        self.assertIn(".", self.reset_code())
        self.assertNotIn("?", mail.outbox[0].body)

    def test_unknown_email_sends_nothing_but_returns_200(self):
        response = self.request_reset("nobody@example.com")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_emailed_code_resets_password(self):
        self.request_reset("member1@example.com")

        response = self.client.post(
            reverse("password-reset-confirm"),
            {"code": self.reset_code(), "new_password": "BrandNewPassw0rd!"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("BrandNewPassw0rd!"))

    def test_code_is_single_use(self):
        self.request_reset("member1@example.com")
        payload = {"code": self.reset_code(), "new_password": "BrandNewPassw0rd!"}

        self.client.post(
            reverse("password-reset-confirm"), payload, content_type="application/json"
        )
        response = self.client.post(
            reverse("password-reset-confirm"), payload, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_weak_password_is_rejected(self):
        self.request_reset("member1@example.com")

        response = self.client.post(
            reverse("password-reset-confirm"),
            {"code": self.reset_code(), "new_password": "123"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldPassw0rd!"))

    def test_malformed_code_is_rejected(self):
        response = self.client.post(
            reverse("password-reset-confirm"),
            {"code": "not-a-code", "new_password": "BrandNewPassw0rd!"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)