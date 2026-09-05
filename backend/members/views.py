from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from datetime import date
from datetime import timedelta
import hashlib
import secrets
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.password_validation import validate_password
from django.db.models import Count
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import ActivityLog, AdminAccount, Announcement, ApprovalRequest, AttendanceRecord, Category, ChurchEvent, Department, DepartmentReport, Member, PasswordResetToken
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
            return queryset.filter(members__category=account.category).distinct()
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
        account = account_for(request.user)
        
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.CATEGORY_ADMIN) and "departments" in request.data:
            data.pop("departments")
        if account.role == AdminAccount.CATEGORY_ADMIN:
            data["category"] = account.category
        
        instance = self.get_object()
        
        # Additional scope validation for updates
        if account.role == AdminAccount.CATEGORY_ADMIN and instance.category != account.category:
            return Response({"detail": "You can only update members in your category."}, status=status.HTTP_403_FORBIDDEN)
        if account.role == AdminAccount.DEPARTMENT_ADMIN and not instance.departments.filter(pk=account.department_id).exists():
            return Response({"detail": "You can only update members in your department."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    def partial_update(self, request, *args, **kwargs): return self.update(request, *args, **kwargs)
    def destroy(self, request, *args, **kwargs):
        account = account_for(request.user)
        instance = self.get_object()
        
        # Scope validation for delete
        if account.role == AdminAccount.CATEGORY_ADMIN and instance.category != account.category:
            return Response({"detail": "You can only delete members in your category."}, status=status.HTTP_403_FORBIDDEN)
        if account.role == AdminAccount.DEPARTMENT_ADMIN and not instance.departments.filter(pk=account.department_id).exists():
            return Response({"detail": "You can only delete members in your department."}, status=status.HTTP_403_FORBIDDEN)
        
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
        
        # Scope validation for department assignment
        if account.role == AdminAccount.CATEGORY_ADMIN and member.category != account.category:
            return Response({"detail": "You can only manage members in your category."}, status=status.HTTP_403_FORBIDDEN)
        if account.role == AdminAccount.DEPARTMENT_ADMIN and not member.departments.filter(pk=account.department_id).exists():
            return Response({"detail": "You can only manage members in your department."}, status=status.HTTP_403_FORBIDDEN)
        
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
    @action(detail=False, methods=("post",))
    def promote_member(self, request):
        member_id = request.data.get("member_id")
        role = request.data.get("role")
        department_id = request.data.get("department_id")
        category = request.data.get("category")
        password = request.data.get("password")
        
        if not member_id or not role or not password:
            return Response({"detail": "member_id, role, and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            member = Member.objects.get(pk=member_id)
        except Member.DoesNotExist:
            return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if member.user:
            return Response({"detail": "This member already has an admin account."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Scope validation - only Super Admin can promote members
        account = account_for(request.user)
        if account.role != AdminAccount.SUPER_ADMIN:
            return Response({"detail": "Only Super Admin can promote members to admin."}, status=status.HTTP_403_FORBIDDEN)
        
        User = get_user_model()
        username = member.email or f"{member.first_name.lower()}.{member.last_name.lower()}@member"
        
        try:
            user = User.objects.create_user(
                username=username,
                email=member.email or username,
                first_name=member.first_name,
                last_name=member.last_name,
                password=password
            )
        except Exception as e:
            return Response({"detail": f"Failed to create user: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        admin_data = {"role": role}
        if role == AdminAccount.DEPARTMENT_ADMIN and department_id:
            try:
                admin_data["department"] = Department.objects.get(pk=department_id)
            except Department.DoesNotExist:
                user.delete()
                return Response({"detail": "Department not found."}, status=status.HTTP_400_BAD_REQUEST)
        elif role == AdminAccount.CATEGORY_ADMIN and category:
            admin_data["category"] = category
        
        try:
            admin_account = AdminAccount.objects.create(user=user, **admin_data)
            member.user = user
            member.save(update_fields=("user",))
            log_activity(request.user, f"Promoted {member.first_name} {member.last_name} to {role}")
            return Response(AdminAccountSerializer(admin_account).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            user.delete()
            return Response({"detail": f"Failed to create admin account: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=("post",))
    def demote_admin(self, request):
        admin_id = request.data.get("admin_id")
        
        if not admin_id:
            return Response({"detail": "admin_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            admin_account = AdminAccount.objects.get(pk=admin_id)
        except AdminAccount.DoesNotExist:
            return Response({"detail": "Admin account not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if admin_account.role == AdminAccount.SUPER_ADMIN:
            return Response({"detail": "Cannot demote Super Admin."}, status=status.HTTP_403_FORBIDDEN)
        
        user = admin_account.user
        member = Member.objects.filter(user=user).first()
        
        if member:
            member.user = None
            member.save(update_fields=("user",))
        
        admin_name = f"{user.first_name} {user.last_name}"
        admin_account.delete()
        user.delete()
        
        log_activity(request.user, f"Demoted {admin_name} to regular member")
        return Response({"detail": "Admin successfully demoted to regular member."}, status=status.HTTP_200_OK)

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
    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsApplicationAdmin()]
        return [IsApplicationAdmin(), NonCategoryAdmin()]
    def get_queryset(self):
        account = account_for(self.request.user); query = DepartmentReport.objects.select_related("department", "submitted_by")
        if account.role == AdminAccount.SUPER_ADMIN:
            return query
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return query.filter(department__members__category=account.category).distinct()
        return query.filter(department=account.department)
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
    serializer_class = ApprovalRequestSerializer; permission_classes = (IsApplicationAdmin,)
    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [IsApplicationAdmin(), SuperAdminOnly()]
        return [IsApplicationAdmin()]
    def get_queryset(self):
        account = account_for(self.request.user); query = ApprovalRequest.objects.select_related("member", "requested_by", "requested_by__admin_account", "requested_by__admin_account__department")
        return query if account.role == AdminAccount.SUPER_ADMIN else query.filter(requested_by=self.request.user)
    def perform_create(self, serializer):
        account = account_for(self.request.user); member = serializer.validated_data["member"]
        if account.role == AdminAccount.CATEGORY_ADMIN and member.category != account.category:
            raise PermissionDenied("You may only request changes for members in your category.")
        if account.role == AdminAccount.DEPARTMENT_ADMIN and not member.departments.filter(pk=account.department_id).exists():
            raise PermissionDenied("You may only request changes for members in your department.")
        request = serializer.save(requested_by=self.request.user)
        log_activity(self.request.user, f"Submitted {request.type} request for {member}", account.department)
    def partial_update(self, request, *args, **kwargs):
        if not is_super_admin(request.user): return Response({"detail": "Only the Super Admin can review requests."}, status=status.HTTP_403_FORBIDDEN)
        approval = self.get_object(); decision = request.data.get("status")
        if approval.status != ApprovalRequest.PENDING or decision not in (ApprovalRequest.APPROVED, ApprovalRequest.REJECTED):
            return Response({"detail": "Only pending requests can be approved or rejected."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            if decision == ApprovalRequest.APPROVED:
                if approval.type == ApprovalRequest.EDIT:
                    member_serializer = MemberSerializer(approval.member, data=approval.changes, partial=True)
                    member_serializer.is_valid(raise_exception=True)
                    member_serializer.save()
                else:
                    member = approval.member
                    member_name = str(member)
                    member.delete()
                    approval.member = None
                    log_activity(request.user, f"Approved deletion request for {member_name}")
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
@permission_classes((permissions.AllowAny,))
def request_password_reset(request):
    email = str(request.data.get("email", "")).strip().lower()
    user = get_user_model().objects.filter(email__iexact=email, is_active=True, admin_account__isnull=False).first()
    if not user:
        return Response({"detail": "No active admin account exists for that email."}, status=status.HTTP_404_NOT_FOUND)
    PasswordResetToken.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())
    raw_token = secrets.token_urlsafe(48)
    PasswordResetToken.objects.create(
        user=user,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{raw_token}"
    send_mail("Reset your FGC Olugoke password", f"Open this link to reset your password:\n\n{reset_url}\n\nThis link expires in 30 minutes.", settings.DEFAULT_FROM_EMAIL, [user.email])
    return Response({"detail": "A password reset link has been sent to your email."})

@api_view(("POST",))
@permission_classes((permissions.AllowAny,))
def confirm_password_reset(request, token):
    password = request.data.get("password", "")
    confirmation = request.data.get("confirmPassword", "")
    if password != confirmation:
        return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
    reset = PasswordResetToken.objects.select_related("user").filter(token_hash=hashlib.sha256(token.encode()).hexdigest(), used_at__isnull=True, expires_at__gt=timezone.now()).first()
    if not reset:
        return Response({"detail": "This password reset link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_password(password, reset.user)
    except Exception as error:
        return Response({"detail": error.messages}, status=status.HTTP_400_BAD_REQUEST)
    reset.user.set_password(password)
    reset.user.save(update_fields=("password",))
    Token.objects.filter(user=reset.user).delete()
    reset.used_at = timezone.now()
    reset.save(update_fields=("used_at",))
    return Response({"detail": "Password reset successfully. Please sign in again."})

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

@api_view(("GET",))
@permission_classes((permissions.AllowAny,))
def health(request):
    """Health check endpoint for Vercel monitoring."""
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response({"status": "healthy", "database": "connected"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"status": "unhealthy", "database": "disconnected", "error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
