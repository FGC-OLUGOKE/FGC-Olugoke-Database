from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import ActivityLog, AdminAccount, Announcement, ApprovalRequest, AttendanceRecord, ChurchEvent, Department, DepartmentReport, Member


class DepartmentSerializer(serializers.ModelSerializer):
    memberCount = serializers.IntegerField(source="members.count", read_only=True)
    class Meta:
        model = Department
        fields = ("id", "name", "description", "leader", "memberCount")


class MemberSerializer(serializers.ModelSerializer):
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
        fields = ("id", "membershipId", "photoUrl", "firstName", "lastName", "gender", "dateOfBirth", "maritalStatus", "occupation", "phone", "email", "address", "category", "departments", "status", "dateJoined", "baptized", "worker", "cellGroup", "serviceUnit", "created_at", "updated_at", "isAdmin")
        read_only_fields = ("created_at", "updated_at", "isAdmin")
    
    def get_isAdmin(self, obj):
        return bool(obj.user and hasattr(obj.user, 'admin_account'))


class AdminAccountSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    scope = serializers.SerializerMethodField()
    departmentId = serializers.PrimaryKeyRelatedField(source="department", queryset=Department.objects.all(), write_only=True, required=False, allow_null=True)
    category = serializers.ChoiceField(choices=AdminAccount.CATEGORY_CHOICES, write_only=True, required=False, allow_null=True)
    password = serializers.CharField(source="user.password", write_only=True, required=False, min_length=8)
    class Meta:
        model = AdminAccount
        fields = ("id", "name", "email", "role", "scope", "departmentId", "category", "password")
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
        return super().to_internal_value(data)
    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.email
    def get_scope(self, obj):
        return obj.department.name if obj.department_id else obj.category
    def validate(self, attrs):
        role = attrs.get("role", self.instance.role if self.instance else AdminAccount.DEPARTMENT_ADMIN)
        department = attrs.get("department", self.instance.department if self.instance else None)
        category = attrs.get("category", self.instance.category if self.instance else None)
        if role == AdminAccount.CATEGORY_ADMIN:
            department = None
            attrs["department"] = None
        elif role == AdminAccount.DEPARTMENT_ADMIN:
            category = None
            attrs["category"] = None
        elif role == AdminAccount.SUPER_ADMIN:
            department = None
            category = None
            attrs["department"] = None
            attrs["category"] = None
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
        return attrs
    def create(self, validated_data):
        user_data = validated_data.pop("user")
        role = validated_data.pop("role", AdminAccount.DEPARTMENT_ADMIN)
        name = self.initial_data.get("name", "").strip()
        password = user_data.pop("password", None)
        if not name: raise serializers.ValidationError({"name": "Name is required."})
        if not password: raise serializers.ValidationError({"password": "Password is required."})
        parts = name.split(maxsplit=1); User = get_user_model()
        user = User.objects.create_user(username=user_data["email"], email=user_data["email"], first_name=parts[0], last_name=parts[1] if len(parts) > 1 else "", password=password)
        return AdminAccount.objects.create(user=user, role=role, **validated_data)
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

    class Meta:
        model = ApprovalRequest
        fields = ("id", "type", "memberId", "memberName", "requestedBy", "changes", "reason", "status", "createdAt", "reviewedAt")
        read_only_fields = ("status",)

    def get_memberName(self, obj):
        return f"{obj.member.first_name} {obj.member.last_name}" if obj.member else "Deleted member"

    def get_requestedBy(self, obj):
        account = getattr(obj.requested_by, "admin_account", None)
        if not account:
            return {"id": obj.requested_by_id, "name": obj.requested_by.get_full_name() or obj.requested_by.email, "role": None, "scope": None}
        return AdminAccountSerializer(account).data


class ActivityLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)
    admin = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ("id", "description", "timestamp", "admin")

    def get_admin(self, obj):
        return obj.admin.get_full_name() or obj.admin.email if obj.admin else "System"
