from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from .models import AdminAccount, Department, Member


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
