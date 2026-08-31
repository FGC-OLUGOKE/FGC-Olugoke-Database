from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Department(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    leader = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name="categories")
    class Meta:
        unique_together = ('name', 'department')
    
    def __str__(self):
        return self.name


class AdminAccount(models.Model):
    """An application account scoped to the records its administrator manages."""
    SUPER_ADMIN = "super_admin"
    CATEGORY_ADMIN = "category_admin"
    DEPARTMENT_ADMIN = "department_admin"
    CATEGORY_CHOICES = (("Children", "Children"), ("Teenager", "Teenager"), ("Youth", "Youth"), ("Adult", "Adult"))
    ROLE_CHOICES = ((SUPER_ADMIN, "Super Admin"), (CATEGORY_ADMIN, "Category Admin"), (DEPARTMENT_ADMIN, "Departmental Admin"))
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_account")
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True, blank=True, related_name="admins")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("role",), condition=Q(role="super_admin"), name="single_super_admin")]

    def clean(self):
        if self.role == self.SUPER_ADMIN and (self.department_id or self.category):
            raise ValidationError("A Super Admin cannot have a scope.")
        if self.role == self.CATEGORY_ADMIN and not self.category:
            raise ValidationError({"category": "A Category Admin must be assigned to one category."})
        if self.role == self.DEPARTMENT_ADMIN and not self.department_id:
            raise ValidationError({"department": "A Departmental Admin must be assigned to one department."})


class Member(models.Model):
    """Church member fields match the frontend form (via the API serializer)."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="member_profile")
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128)
    gender = models.CharField(max_length=16, choices=(("Male", "Male"), ("Female", "Female")))
    date_of_birth = models.DateField()
    photo_url = models.TextField(blank=True)
    occupation = models.CharField(max_length=255, blank=True)
    membership_id = models.CharField(max_length=64, blank=True, unique=True, null=True)
    marital_status = models.CharField(max_length=64, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    category = models.CharField(max_length=32, choices=AdminAccount.CATEGORY_CHOICES)
    departments = models.ManyToManyField(Department, blank=True, related_name="members")
    status = models.CharField(max_length=32, blank=True)
    date_joined = models.DateField(null=True, blank=True)
    baptized = models.BooleanField(default=False)
    worker = models.BooleanField(default=False)
    cell_group = models.CharField(max_length=255, blank=True)
    service_unit = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("last_name", "first_name")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Announcement(models.Model):
    title = models.CharField(max_length=255)
    body = models.TextField()
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.CASCADE, related_name="announcements")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="announcements")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class DepartmentReport(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="reports")
    subject = models.CharField(max_length=255)
    body = models.TextField()
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="department_reports")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)


class AttendanceRecord(models.Model):
    """One attendance summary for a church service or department gathering."""
    date = models.DateField()
    adults = models.PositiveIntegerField(default=0)
    youth = models.PositiveIntegerField(default=0)
    teenagers = models.PositiveIntegerField(default=0)
    children = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="attendance_records")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="attendance_records")
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="attendance_records")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("date",)


class ChurchEvent(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    date = models.DateField()
    time = models.CharField(max_length=80, blank=True)
    location = models.CharField(max_length=255, blank=True)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.CASCADE, related_name="events")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="events")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("date", "time", "name")


class ApprovalRequest(models.Model):
    EDIT = "edit"
    DELETE = "delete"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="approval_requests")
    type = models.CharField(max_length=16, choices=((EDIT, "Edit"), (DELETE, "Delete")))
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="approval_requests")
    changes = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=((PENDING, "Pending"), (APPROVED, "Approved"), (REJECTED, "Rejected")), default=PENDING)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="reviewed_approval_requests")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)


class ActivityLog(models.Model):
    description = models.CharField(max_length=500)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs")
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
