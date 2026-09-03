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

    def test_super_admin_cannot_remove_staff_department_assignment(self):
        self.authenticate(self.super_token)
        staff_account = AdminAccount.objects.get(user__email="choir@example.com")
        response = self.client.patch(f"/api/users/{staff_account.id}/", {"departmentId": None}, format="json")
        self.assertEqual(response.status_code, 400)

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
