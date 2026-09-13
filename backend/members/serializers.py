import secrets
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from .models import ActivityLog, AdminAccount, Announcement, ApprovalRequest, AttendanceRecord, ChurchEvent, Department, DepartmentReport, Member, Notification, Pastorate


class DepartmentSerializer(serializers.ModelSerializer):
    memberCount = serializers.SerializerMethodField()
    pastorateId = serializers.PrimaryKeyRelatedField(source="pastorate", queryset=Pastorate.objects.all(), required=False, allow_null=True)
    pastorateName = serializers.CharField(source="pastorate.name", read_only=True)
    departmentAdmin = serializers.SerializerMethodField()
    pastorateAdmin = serializers.SerializerMethodField()
    class Meta:
        model = Department
        fields = ("id", "name", "description", "leader", "memberCount", "pastorateId", "pastorateName", "departmentAdmin", "pastorateAdmin")

    def get_memberCount(self, obj):
        return getattr(obj, "member_count", obj.members.count())

    def get_departmentAdmin(self, obj):
        account = next((item for item in obj.admins.all() if item.role == AdminAccount.DEPARTMENT_ADMIN), None)
        if not account:
            return None
        return {"id": account.user_id, "name": account.user.get_full_name() or account.user.email, "email": account.user.email}

    def get_pastorateAdmin(self, obj):
        account = next((item for item in obj.pastorate_admins.all()), None)
        if not account:
            return None
        return {"id": account.user_id, "name": account.user.get_full_name() or account.user.email, "email": account.user.email}


class PastorateSerializer(serializers.ModelSerializer):
    departmentCount = serializers.IntegerField(source="departments.count", read_only=True)

    class Meta:
        model = Pastorate
        fields = ("id", "name", "description", "departmentCount")


class MemberSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source="user_id", read_only=True, allow_null=True)
    departments = serializers.SlugRelatedField(slug_field="name", many=True, queryset=Department.objects.all(), required=False)
    category = serializers.ChoiceField(choices=AdminAccount.CATEGORY_CHOICES, required=True)
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    dateOfBirth = serializers.DateField(source="date_of_birth")
    photoUrl = serializers.CharField(source="photo_url", required=False, allow_blank=True)
    membershipId = serializers.CharField(source="membership_id", required=False, allow_blank=True, allow_null=True)
    occupation = serializers.CharField(required=False, allow_blank=True)
    maritalStatus = serializers.CharField(source="marital_status", required=False, allow_blank=True)
    dateJoined = serializers.DateField(source="date_joined", required=False, allow_null=True)
    cellGroup = serializers.CharField(source="cell_group", required=False, allow_blank=True)
    serviceUnit = serializers.CharField(source="service_unit", required=False, allow_blank=True)
    isAdmin = serializers.SerializerMethodField()
    class Meta:
        model = Member
        fields = ("id", "userId", "membershipId", "photoUrl", "firstName", "lastName", "gender", "dateOfBirth", "maritalStatus", "occupation", "phone", "email", "address", "category", "departments", "status", "dateJoined", "baptized", "worker", "cellGroup", "serviceUnit", "created_at", "updated_at", "isAdmin")
        read_only_fields = ("created_at", "updated_at", "isAdmin")
    
    def get_isAdmin(self, obj):
        return bool(obj.user and hasattr(obj.user, 'admin_account'))

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    code = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        uid, separator, token = attrs["code"].strip().partition(".")
        if not separator:
            raise serializers.ValidationError({"code": "Invalid reset code."})

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = get_user_model().objects.get(pk=user_id)
        except (ValueError, TypeError, get_user_model().DoesNotExist):
            raise serializers.ValidationError({"code": "Invalid reset code."})

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({"code": "Invalid or expired reset code."})

        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": list(exc.messages)})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user

class AdminAccountSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    scope = serializers.SerializerMethodField()
    departmentId = serializers.PrimaryKeyRelatedField(source="department", queryset=Department.objects.all(), write_only=True, required=False, allow_null=True)
    departmentIds = serializers.PrimaryKeyRelatedField(source="departments", queryset=Department.objects.all(), many=True, write_only=True, required=False)
    departments = serializers.SerializerMethodField()
    pastorateId = serializers.PrimaryKeyRelatedField(source="pastorate", queryset=Pastorate.objects.all(), required=False, allow_null=True)
    pastorate = serializers.SerializerMethodField()
    category = serializers.ChoiceField(choices=AdminAccount.CATEGORY_CHOICES, write_only=True, required=False, allow_null=True)
    password = serializers.CharField(source="user.password", write_only=True, required=False, min_length=8)
    role = serializers.ChoiceField(choices=AdminAccount.ROLE_CHOICES, required=False, default=AdminAccount.DEPARTMENT_ADMIN)
    mustSetPassword = serializers.BooleanField(source="must_set_password", read_only=True)
    class Meta:
        model = AdminAccount
        fields = ("id", "name", "email", "role", "scope", "departmentId", "departmentIds", "departments", "pastorateId", "pastorate", "category", "password", "mustSetPassword")
        read_only_fields = ()

    def to_internal_value(self, data):
        data = data.copy()
        scope = data.get("scope")
        role = data.get("role", self.instance.role if self.instance else AdminAccount.DEPARTMENT_ADMIN)
        if scope:
            if role == AdminAccount.DEPARTMENT_ADMIN:
                department = Department.objects.filter(name=scope).first()
                if not department:
                    raise serializers.ValidationError({"scope": "Unknown department."})
                data["departmentId"] = department.pk
            elif role == AdminAccount.CATEGORY_ADMIN:
                data["category"] = scope
            elif role == AdminAccount.PASTORATE:
                if isinstance(scope, list):
                    data["departmentIds"] = [department.pk for department in Department.objects.filter(name__in=scope)]
                    pastorates = Pastorate.objects.filter(departments__name__in=scope).distinct()
                    if pastorates.count() == 1:
                        data["pastorateId"] = pastorates.first().pk
        return super().to_internal_value(data)
    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_departments(self, obj):
        if obj.role != AdminAccount.PASTORATE:
            return []
        return [department.name for department in obj.departments.all()] if obj.pastorate_id else []

    def get_pastorate(self, obj):
        return obj.pastorate.name if obj.pastorate_id else None

    def get_scope(self, obj):
        if obj.role == AdminAccount.PASTORATE:
            return [department.name for department in obj.departments.all()] if obj.pastorate_id else []
        return obj.department.name if obj.department_id else obj.category
    def validate_email(self, value):
        email = value.strip().lower()
        User = get_user_model()
        existing = User.objects.filter(username__iexact=email)
        if self.instance:
            existing = existing.exclude(pk=self.instance.user_id)
        if existing.exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email
    def validate(self, attrs):
        role = attrs.get("role", self.instance.role if self.instance else AdminAccount.DEPARTMENT_ADMIN)
        department = attrs.get("department", self.instance.department if self.instance else None)
        category = attrs.get("category", self.instance.category if self.instance else None)
        pastorate = attrs.get("pastorate", self.instance.pastorate if self.instance else None)
        if role == AdminAccount.CATEGORY_ADMIN:
            department = None
            attrs["department"] = None
        elif role == AdminAccount.DEPARTMENT_ADMIN:
            category = None
            attrs["category"] = None
        elif role in (AdminAccount.SUPER_ADMIN, AdminAccount.MANAGING_DEPARTMENTS, AdminAccount.PASTORATE):
            department = None
            category = None
            attrs["department"] = None
            attrs["category"] = None
        if role != AdminAccount.PASTORATE:
            pastorate = None
            attrs["pastorate"] = None
        if role == AdminAccount.DEPARTMENT_ADMIN and not department:
            raise serializers.ValidationError({"departmentId": "A Departmental Admin must be assigned to a department."})
        if role == AdminAccount.CATEGORY_ADMIN and not category:
            raise serializers.ValidationError({"category": "A Category Admin must be assigned to a category."})
        if role == AdminAccount.SUPER_ADMIN and (department or category):
            raise serializers.ValidationError({"scope": "A Super Admin cannot have a scope."})
        if role == AdminAccount.CATEGORY_ADMIN and department:
            raise serializers.ValidationError({"departmentId": "A Category Admin cannot be assigned to a department."})
        if role == AdminAccount.DEPARTMENT_ADMIN and category:
            raise serializers.ValidationError({"category": "A Departmental Admin cannot be assigned to a category."})
        if role == AdminAccount.MANAGING_DEPARTMENTS and attrs.get("departments"):
            raise serializers.ValidationError({"departmentIds": "Managing Departments accounts are read-only and cannot be assigned departments."})
        if role == AdminAccount.PASTORATE and not pastorate:
            departments = attrs.get("departments", self.instance.departments.all() if self.instance else Department.objects.none())
            pastorate_ids = set(departments.values_list("pastorate_id", flat=True)) if hasattr(departments, "values_list") else {department.pastorate_id for department in departments}
            pastorate_ids.discard(None)
            if len(pastorate_ids) == 1:
                pastorate = Pastorate.objects.get(pk=next(iter(pastorate_ids)))
                attrs["pastorate"] = pastorate
            elif departments:
                pastorate, _ = Pastorate.objects.get_or_create(name="General Pastorate")
                Department.objects.filter(pk__in=[department.pk for department in departments], pastorate__isnull=True).update(pastorate=pastorate)
                attrs["pastorate"] = pastorate
            else:
                pastorate, _ = Pastorate.objects.get_or_create(name="General Pastorate")
                attrs["pastorate"] = pastorate
        pastorate = attrs.get("pastorate", pastorate)
        if role == AdminAccount.PASTORATE and not attrs.get("pastorate"):
            raise serializers.ValidationError({"pastorateId": "A Pastorate Admin must be assigned to one pastorate."})
        if role == AdminAccount.PASTORATE:
            departments = attrs.get("departments", self.instance.departments.all() if self.instance else Department.objects.none())
            department_queryset = departments if hasattr(departments, "exclude") else Department.objects.filter(pk__in=[department.pk for department in departments])
            if pastorate and department_queryset.filter(pastorate__isnull=False).exclude(pastorate=pastorate).exists():
                raise serializers.ValidationError({"departmentIds": "All assigned departments must belong to the selected pastorate."})
            occupied = AdminAccount.objects.filter(
                role=AdminAccount.PASTORATE,
                departments__in=department_queryset,
            ).exclude(pk=self.instance.pk if self.instance else None)
            if occupied.exists():
                raise serializers.ValidationError({"departmentIds": "One or more selected departments are already assigned to another Pastorate Admin."})
        return attrs
    @transaction.atomic
    def create(self, validated_data):
        user_data = validated_data.pop("user")
        departments = validated_data.pop("departments", [])
        role = validated_data.pop("role", AdminAccount.DEPARTMENT_ADMIN)
        name = self.initial_data.get("name", "").strip()
        user_data.pop("password", None)
        password = secrets.token_urlsafe(18)
        if not name: raise serializers.ValidationError({"name": "Name is required."})
        parts = name.split(maxsplit=1); User = get_user_model()
        user = User.objects.create_user(username=user_data["email"], email=user_data["email"], first_name=parts[0], last_name=parts[1] if len(parts) > 1 else "", password=password)
        account = AdminAccount.objects.create(user=user, role=role, **validated_data)
        if role == AdminAccount.PASTORATE:
            if account.pastorate_id:
                account.departments.set(departments)
        else:
            account.departments.set([])
        account.must_set_password = True
        account.save(update_fields=("must_set_password",))
        send_mail(
            "Your FGC Olugoke admin account",
            f"Your temporary password is:\n\n{password}\n\nUse it to sign in. You will be required to set a new password before accessing the dashboard.",
            None,
            [user.email],
            fail_silently=False,
        )
        return account
    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {}); name = self.initial_data.get("name")
        if name is not None:
            parts = name.strip().split(maxsplit=1); instance.user.first_name = parts[0] if parts else ""; instance.user.last_name = parts[1] if len(parts) > 1 else ""
        if "email" in user_data: instance.user.email = instance.user.username = user_data["email"]
        if user_data.get("password"): instance.user.set_password(user_data["password"])
        instance.user.save(); return super().update(instance, validated_data)


class AnnouncementSerializer(serializers.ModelSerializer):
    department = serializers.SlugRelatedField(slug_field="name", queryset=Department.objects.all(), required=False, allow_null=True)
    authorName = serializers.CharField(source="author.get_full_name", read_only=True)
    class Meta:
        model = Announcement
        fields = ("id", "title", "body", "department", "authorName", "created_at")
        read_only_fields = ("authorName", "created_at")


class DepartmentReportSerializer(serializers.ModelSerializer):
    department = serializers.SlugRelatedField(slug_field="name", queryset=Department.objects.all(), required=False)
    submittedBy = serializers.CharField(source="submitted_by.get_full_name", read_only=True)
    class Meta:
        model = DepartmentReport
        fields = ("id", "department", "subject", "body", "submittedBy", "created_at")
        read_only_fields = ("submittedBy", "created_at")


class AttendanceRecordSerializer(serializers.ModelSerializer):
    week = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    department = serializers.SlugRelatedField(slug_field="name", queryset=Department.objects.all(), required=False, allow_null=True)

    class Meta:
        model = AttendanceRecord
        fields = ("id", "date", "week", "adults", "youth", "teenagers", "children", "total", "department")
        read_only_fields = ("week", "total")
        validators = []

    def get_week(self, obj):
        return obj.date.strftime("%b %d")

    def get_total(self, obj):
        return obj.adults + obj.youth + obj.teenagers + obj.children


class ChurchEventSerializer(serializers.ModelSerializer):
    department = serializers.SlugRelatedField(slug_field="name", queryset=Department.objects.all(), required=False, allow_null=True)

    class Meta:
        model = ChurchEvent
        fields = ("id", "name", "type", "date", "time", "location", "department")


class ApprovalRequestSerializer(serializers.ModelSerializer):
    memberId = serializers.PrimaryKeyRelatedField(source="member", queryset=Member.objects.all())
    memberName = serializers.SerializerMethodField()
    requestedBy = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True)
    rejectionReason = serializers.CharField(source="rejection_reason", read_only=True)

    class Meta:
        model = ApprovalRequest
        fields = ("id", "type", "memberId", "memberName", "requestedBy", "pastorate", "changes", "reason", "rejectionReason", "status", "createdAt", "reviewedAt")
        read_only_fields = ("status",)
    pastorate = serializers.CharField(source="pastorate.name", read_only=True)

    def get_memberName(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}" if obj.member else "Deleted member"

    def get_requestedBy(self, obj):
        account = getattr(obj.requested_by, "admin_account", None)
        if not account:
            return {"id": obj.requested_by_id, "name": obj.requested_by.get_full_name() or obj.requested_by.email, "role": None, "scope": None}
        return AdminAccountSerializer(account).data


class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    readAt = serializers.DateTimeField(source="read_at", read_only=True)

    class Meta:
        model = Notification
        fields = ("id", "title", "message", "createdAt", "readAt")


class ActivityLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)
    admin = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ("id", "description", "timestamp", "admin")

    def get_admin(self, obj):
        return obj.admin.get_full_name() or obj.admin.email if obj.admin else "System"
