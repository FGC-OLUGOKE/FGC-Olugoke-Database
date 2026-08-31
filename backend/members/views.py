from django.contrib.auth import authenticate
from datetime import date
from django.utils import timezone
from django.db.models import Count
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import ActivityLog, AdminAccount, Announcement, ApprovalRequest, AttendanceRecord, Category, ChurchEvent, Department, DepartmentReport, Member
from .serializers import ActivityLogSerializer, AdminAccountSerializer, AnnouncementSerializer, ApprovalRequestSerializer, AttendanceRecordSerializer, ChurchEventSerializer, DepartmentReportSerializer, DepartmentSerializer, MemberSerializer

def account_for(user):
    try: return user.admin_account
    except AdminAccount.DoesNotExist: return None

def is_super_admin(user):
    account = account_for(user)
    return bool(account and account.role == AdminAccount.SUPER_ADMIN)

def is_category_admin(user):
    account = account_for(user)
    return bool(account and account.role == AdminAccount.CATEGORY_ADMIN)

def log_activity(user, description, department=None):
    ActivityLog.objects.create(admin=user, description=description, department=department)

class IsApplicationAdmin(permissions.BasePermission):
    def has_permission(self, request, view): return bool(request.user and request.user.is_authenticated and account_for(request.user))

class SuperAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view): return is_super_admin(request.user)

class NonCategoryAdmin(permissions.BasePermission):
    def has_permission(self, request, view): return not is_category_admin(request.user)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all(); serializer_class = DepartmentSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin)
    def get_queryset(self):
        account = account_for(self.request.user)
        queryset = Department.objects.annotate(member_count=Count("members"))
        if account.role == AdminAccount.DEPARTMENT_ADMIN:
            return queryset.filter(pk=account.department_id)
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return queryset.none()
        return queryset
    def get_permissions(self): return [IsApplicationAdmin(), SuperAdminOnly()] if self.action not in ("list", "retrieve") else [IsApplicationAdmin()]

class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer; permission_classes = (IsApplicationAdmin,)
    def get_queryset(self):
        queryset = Member.objects.prefetch_related("departments").all(); account = account_for(self.request.user)
        if account.role == AdminAccount.SUPER_ADMIN:
            return queryset
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return queryset.filter(category=account.category)
        return queryset.filter(departments=account.department).distinct()
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    def perform_create(self, serializer):
        account = account_for(self.request.user)
        if account.role == AdminAccount.DEPARTMENT_ADMIN:
            serializer.validated_data.pop("departments", None)
            member = serializer.save()
            member.departments.add(account.department)
        elif account.role == AdminAccount.CATEGORY_ADMIN:
            serializer.validated_data["category"] = account.category
            serializer.validated_data.pop("departments", None)
            member = serializer.save()
        else:
            member = serializer.save()
        member.worker = member.departments.exists()
        member.save(update_fields=("worker",))
        log_activity(self.request.user, f"Added new member {member.first_name} {member.last_name}")
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        data = request.data.copy()
        if account_for(request.user).role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.CATEGORY_ADMIN) and "departments" in request.data:
            data.pop("departments")
        if account_for(request.user).role == AdminAccount.CATEGORY_ADMIN:
            data["category"] = account_for(request.user).category
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    def partial_update(self, request, *args, **kwargs): return self.update(request, *args, **kwargs)
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    def perform_update(self, serializer):
        member = serializer.save()
        member.worker = member.departments.exists()
        member.save(update_fields=("worker",))
        log_activity(self.request.user, f"Updated member {member.first_name} {member.last_name}")
    def perform_destroy(self, instance):
        name = str(instance); instance.delete(); log_activity(self.request.user, f"Deleted member {name}")
    @action(detail=True, methods=("patch",), url_path="departments")
    def departments(self, request, pk=None):
        account = account_for(request.user); add, remove = request.data.get("add"), request.data.get("remove")
        member = Member.objects.prefetch_related("departments").filter(pk=pk).first()
        if not member: return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)
        if bool(add) == bool(remove): return Response({"detail": "Provide exactly one of 'add' or 'remove'."}, status=status.HTTP_400_BAD_REQUEST)
        try: department = Department.objects.get(name=add or remove)
        except Department.DoesNotExist: return Response({"department": "Unknown department."}, status=status.HTTP_400_BAD_REQUEST)
        if account.role == AdminAccount.DEPARTMENT_ADMIN and department.pk != account.department_id: return Response({"detail": "You may only manage your assigned department."}, status=status.HTTP_403_FORBIDDEN)
        if account.role == AdminAccount.CATEGORY_ADMIN: return Response({"detail": "Category Admins cannot manage department assignments."}, status=status.HTTP_403_FORBIDDEN)
        (member.departments.add if add else member.departments.remove)(department)
        member.worker = member.departments.exists()
        member.save(update_fields=("worker",))
        log_activity(request.user, f"{'Added' if add else 'Removed'} {member} {'to' if add else 'from'} {department.name}", department)
        return Response(MemberSerializer(member).data)

class AdminAccountViewSet(viewsets.ModelViewSet):
    serializer_class = AdminAccountSerializer; permission_classes = (SuperAdminOnly,)
    queryset = AdminAccount.objects.select_related("user", "department")
    def destroy(self, request, *args, **kwargs):
        account = self.get_object()
        if account.role == AdminAccount.SUPER_ADMIN: return Response({"detail": "The Super Admin account cannot be removed."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin)
    def get_queryset(self):
        account = account_for(self.request.user); query = Announcement.objects.select_related("department", "author")
        return query if account.role == AdminAccount.SUPER_ADMIN else query.filter(department=account.department)
    def perform_create(self, serializer):
        account = account_for(self.request.user); department = serializer.validated_data.get("department")
        if account.role == AdminAccount.DEPARTMENT_ADMIN:
            if department and department != account.department: raise permissions.PermissionDenied("You may only post for your department.")
            serializer.save(author=self.request.user, department=account.department)
        else: serializer.save(author=self.request.user)

class DepartmentReportViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentReportSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin)
    def get_queryset(self):
        account = account_for(self.request.user); query = DepartmentReport.objects.select_related("department", "submitted_by")
        return query if account.role == AdminAccount.SUPER_ADMIN else query.filter(department=account.department)
    def perform_create(self, serializer):
        account = account_for(self.request.user)
        if account.role == AdminAccount.DEPARTMENT_ADMIN: serializer.save(submitted_by=self.request.user, department=account.department)
        else:
            if not serializer.validated_data.get("department"): raise permissions.PermissionDenied("A department is required.")
            serializer.save(submitted_by=self.request.user)

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer; permission_classes = (IsApplicationAdmin,)
    def get_queryset(self):
        account = account_for(self.request.user); query = AttendanceRecord.objects.select_related("category", "recorded_by")
        if account.role == AdminAccount.SUPER_ADMIN:
            return query
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return query.filter(category__name=account.category)
        return query.filter(department=account.department)
    def perform_create(self, serializer):
        account = account_for(self.request.user)
        category_name = account.category if account.role == AdminAccount.CATEGORY_ADMIN else "General"
        category = Category.objects.get_or_create(name=category_name)[0]
        department = serializer.validated_data.get("department") or account.department
        record = serializer.save(recorded_by=self.request.user, category=category, department=department)
        log_activity(self.request.user, f"Recorded attendance for {record.date:%b %d}", department)

class ChurchEventViewSet(viewsets.ModelViewSet):
    serializer_class = ChurchEventSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin)
    def get_queryset(self):
        account = account_for(self.request.user); query = ChurchEvent.objects.select_related("department", "created_by")
        return query if account.role == AdminAccount.SUPER_ADMIN else query.filter(department=account.department) | query.filter(department__isnull=True)
    def perform_create(self, serializer):
        account = account_for(self.request.user); department = account.department if account.role == AdminAccount.DEPARTMENT_ADMIN else serializer.validated_data.get("department")
        event = serializer.save(created_by=self.request.user, department=department)
        log_activity(self.request.user, f"Created event: {event.name}", department)
    def perform_update(self, serializer):
        event = serializer.save(); log_activity(self.request.user, f"Updated event: {event.name}", event.department)
    def perform_destroy(self, instance):
        name, department = instance.name, instance.department; instance.delete(); log_activity(self.request.user, f"Deleted event: {name}", department)

class ApprovalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ApprovalRequestSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin)
    def get_queryset(self):
        account = account_for(self.request.user); query = ApprovalRequest.objects.select_related("member", "requested_by", "requested_by__admin_account", "requested_by__admin_account__department")
        return query if account.role == AdminAccount.SUPER_ADMIN else query.filter(requested_by=self.request.user)
    def perform_create(self, serializer):
        account = account_for(self.request.user); member = serializer.validated_data["member"]
        if account.role == AdminAccount.DEPARTMENT_ADMIN and not member.departments.filter(pk=account.department_id).exists():
            raise permissions.PermissionDenied("You may only request changes for members in your department.")
        request = serializer.save(requested_by=self.request.user)
        log_activity(self.request.user, f"Submitted {request.type} request for {member}", account.department)
    def partial_update(self, request, *args, **kwargs):
        if not is_super_admin(request.user): return Response({"detail": "Only the Super Admin can review requests."}, status=status.HTTP_403_FORBIDDEN)
        approval = self.get_object(); decision = request.data.get("status")
        if approval.status != ApprovalRequest.PENDING or decision not in (ApprovalRequest.APPROVED, ApprovalRequest.REJECTED):
            return Response({"detail": "Only pending requests can be approved or rejected."}, status=status.HTTP_400_BAD_REQUEST)
        approval.status, approval.reviewed_by, approval.reviewed_at = decision, request.user, timezone.now(); approval.save(update_fields=("status", "reviewed_by", "reviewed_at"))
        return Response(ApprovalRequestSerializer(approval).data)

@api_view(("POST",))
@permission_classes((permissions.AllowAny,))
def login(request):
    email = str(request.data.get("email", "")).strip().lower()
    password = request.data.get("password", "")
    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(request, username=email, password=password)
    if not user or not account_for(user): return Response({"detail": "Invalid credentials or inactive admin account."}, status=status.HTTP_401_UNAUTHORIZED)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": AdminAccountSerializer(account_for(user)).data})

@api_view(("POST",))
@permission_classes((IsApplicationAdmin,))
def logout(request): Token.objects.filter(user=request.user).delete(); return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(("GET",))
@permission_classes((IsApplicationAdmin,))
def me(request): return Response(AdminAccountSerializer(account_for(request.user)).data)

@api_view(("GET",))
@permission_classes((IsApplicationAdmin,))
def membership_growth(request):
    """Cumulative registrations by month for the dashboard trend chart."""
    account = account_for(request.user)
    if account.role == AdminAccount.SUPER_ADMIN:
        members = Member.objects.all()
    elif account.role == AdminAccount.CATEGORY_ADMIN:
        members = Member.objects.filter(category=account.category)
    else:
        members = Member.objects.filter(departments=account.department).distinct()
    today = date.today(); months = []
    for offset in range(7, -1, -1):
        month_number = today.month - offset; year = today.year
        while month_number <= 0: month_number += 12; year -= 1
        months.append((year, month_number))
    result = []
    for year, month in months:
        end = date(year + (month == 12), 1 if month == 12 else month + 1, 1)
        result.append({"month": date(year, month, 1).strftime("%b"), "total": members.filter(date_joined__lt=end).count()})
    return Response(result)

@api_view(("GET",))
@permission_classes((IsApplicationAdmin,))
def activity_log(request):
    account = account_for(request.user); query = ActivityLog.objects.select_related("admin", "department")
    if account.role == AdminAccount.CATEGORY_ADMIN: return Response([])
    if account.role != AdminAccount.SUPER_ADMIN: query = query.filter(department=account.department)
    return Response(ActivityLogSerializer(query[:50], many=True).data)
