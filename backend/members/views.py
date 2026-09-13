from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import date
from datetime import timedelta
import hashlib
import logging
import secrets
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.password_validation import validate_password
from django.db.models import Count, Q
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import ActivityLog, AdminAccount, Announcement, ApprovalRequest, AttendanceRecord, Category, ChurchEvent, Department, DepartmentReport, Member, Notification, Pastorate, PasswordResetToken
from .serializers import ActivityLogSerializer, AdminAccountSerializer, AnnouncementSerializer, ApprovalRequestSerializer, AttendanceRecordSerializer, ChurchEventSerializer, DepartmentReportSerializer, DepartmentSerializer, MemberSerializer, NotificationSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer, PastorateSerializer

logger = logging.getLogger(__name__)

def account_for(user):
    try: return user.admin_account
    except AdminAccount.DoesNotExist: return None

def is_super_admin(user):
    account = account_for(user)
    return bool(account and account.role == AdminAccount.SUPER_ADMIN)

def is_category_admin(user):
    account = account_for(user)
    return bool(account and account.role == AdminAccount.CATEGORY_ADMIN)

def is_read_only_admin(user):
    account = account_for(user)
    return bool(account and account.role in (AdminAccount.MANAGING_DEPARTMENTS, AdminAccount.PASTORATE))

def assigned_departments(account):
    if account.role == AdminAccount.DEPARTMENT_ADMIN:
        return Department.objects.filter(pk=account.department_id)
    if account.role == AdminAccount.PASTORATE and account.pastorate_id:
        return account.departments.filter(pastorate_id=account.pastorate_id)
    return account.departments.all()

def can_manage_department(account, department):
    return account.role == AdminAccount.SUPER_ADMIN or assigned_departments(account).filter(pk=getattr(department, "pk", department)).exists()

def log_activity(user, description, department=None):
    ActivityLog.objects.create(admin=user, description=description, department=department)

def notify(user, title, message):
    Notification.objects.create(recipient=user, title=title, message=message)

class IsApplicationAdmin(permissions.BasePermission):
    def has_permission(self, request, view): return bool(request.user and request.user.is_authenticated and account_for(request.user))

class SuperAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view): return is_super_admin(request.user)

class PastorateAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        account = account_for(request.user)
        return bool(account and account.role in (AdminAccount.SUPER_ADMIN, AdminAccount.PASTORATE))

class NonCategoryAdmin(permissions.BasePermission):
    def has_permission(self, request, view): return not is_category_admin(request.user)

class ReadOnlyManagingAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS or not is_read_only_admin(request.user)

class DepartmentWriteScope(permissions.BasePermission):
    def has_permission(self, request, view):
        account = account_for(request.user)
        if account.role == AdminAccount.SUPER_ADMIN:
            return True
        if account.role != AdminAccount.PASTORATE:
            return False
        if view.action == "create":
            return True
        department_id = view.kwargs.get(view.lookup_field, view.kwargs.get("pk"))
        return account.departments.filter(pk=department_id).exists()

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all(); serializer_class = DepartmentSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin)
    def get_queryset(self):
        account = account_for(self.request.user)
        queryset = Department.objects.select_related("pastorate").prefetch_related(
            "members",
            "admins__user",
            "pastorate_admins__user",
        ).annotate(member_count=Count("members", distinct=True))
        if account.role == AdminAccount.MANAGING_DEPARTMENTS:
            return queryset
        if account.role == AdminAccount.PASTORATE:
            return queryset.filter(pastorate_id=account.pastorate_id)
        if account.role == AdminAccount.DEPARTMENT_ADMIN:
            return queryset.filter(pk=account.department_id)
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return queryset.filter(members__category=account.category).distinct()
        return queryset
    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsApplicationAdmin()]
        return [IsApplicationAdmin(), DepartmentWriteScope()] if account_for(self.request.user).role == AdminAccount.PASTORATE else [IsApplicationAdmin(), SuperAdminOnly()]

    def perform_create(self, serializer):
        account = account_for(self.request.user)
        if account.role == AdminAccount.PASTORATE:
            if not account.pastorate_id:
                raise PermissionDenied("This Pastorate Admin is not assigned to a pastorate.")
            department = serializer.save(pastorate=account.pastorate)
            account.departments.add(department)
            log_activity(self.request.user, f"Created department {department.name}", department)
            return
        department = serializer.save(
            pastorate=serializer.validated_data.get("pastorate")
            or Pastorate.objects.get_or_create(name="General Pastorate")[0]
        )
        log_activity(self.request.user, f"Created department {department.name}", department)

    def perform_update(self, serializer):
        account = account_for(self.request.user)
        if account.role == AdminAccount.PASTORATE:
            department = self.get_object()
            if department.pastorate_id != account.pastorate_id:
                raise PermissionDenied("You may only manage departments in your pastorate.")
            requested_pastorate = serializer.validated_data.get("pastorate", department.pastorate)
            if requested_pastorate.pk != account.pastorate_id:
                raise PermissionDenied("You may not move a department to another pastorate.")
        department = serializer.save()
        log_activity(self.request.user, f"Updated department {department.name}", department)

    def perform_destroy(self, instance):
        account = account_for(self.request.user)
        if account.role == AdminAccount.PASTORATE and instance.pastorate_id != account.pastorate_id:
            raise PermissionDenied("You may only manage departments in your pastorate.")
        name = instance.name
        instance.delete()
        log_activity(self.request.user, f"Deleted department {name}")


class PastorateViewSet(viewsets.ModelViewSet):
    serializer_class = PastorateSerializer
    permission_classes = (IsApplicationAdmin,)
    queryset = Pastorate.objects.all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsApplicationAdmin()]
        return [IsApplicationAdmin(), SuperAdminOnly()]

    def get_queryset(self):
        account = account_for(self.request.user)
        if account.role == AdminAccount.SUPER_ADMIN:
            return Pastorate.objects.all()
        if account.role == AdminAccount.PASTORATE:
            return Pastorate.objects.filter(pk=account.pastorate_id)
        return Pastorate.objects.none()

    def perform_destroy(self, instance):
        if instance.departments.exists():
            raise PermissionDenied("A pastorate with departments cannot be deleted.")
        instance.delete()

class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer; permission_classes = (IsApplicationAdmin,)
    def get_permissions(self):
        if self.action == "departments":
            return [IsApplicationAdmin()]
        return [IsApplicationAdmin(), ReadOnlyManagingAdmin()]
    def get_queryset(self):
        queryset = Member.objects.select_related("user").prefetch_related("departments").all(); account = account_for(self.request.user)
        if account.role in (AdminAccount.SUPER_ADMIN, AdminAccount.MANAGING_DEPARTMENTS, AdminAccount.PASTORATE):
            return queryset
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return queryset.filter(category=account.category)
        return queryset.filter(departments__in=assigned_departments(account)).distinct()
    def create(self, request, *args, **kwargs):
        if account_for(request.user).role == AdminAccount.PASTORATE:
            return Response({"detail": "Pastorate Admins cannot create ordinary member profiles."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    def perform_create(self, serializer):
        account = account_for(self.request.user)
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE):
            serializer.validated_data.pop("departments", None)
            member = serializer.save()
            member.departments.add(*assigned_departments(account))
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
        if account.role == AdminAccount.PASTORATE:
            return Response({"detail": "Pastorate Admins cannot edit ordinary member profiles."}, status=status.HTTP_403_FORBIDDEN)
        
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE, AdminAccount.CATEGORY_ADMIN) and "departments" in request.data:
            data.pop("departments")
        if account.role == AdminAccount.CATEGORY_ADMIN:
            data["category"] = account.category
        
        instance = self.get_object()
        
        # Additional scope validation for updates
        if account.role == AdminAccount.CATEGORY_ADMIN and instance.category != account.category:
            return Response({"detail": "You can only update members in your category."}, status=status.HTTP_403_FORBIDDEN)
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE) and not instance.departments.filter(pk__in=assigned_departments(account)).exists():
            return Response({"detail": "You can only update members in your department."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
    def destroy(self, request, *args, **kwargs):
        account = account_for(request.user)
        if account.role == AdminAccount.PASTORATE:
            return Response({"detail": "Pastorate Admins cannot delete ordinary members."}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        
        # Scope validation for delete
        if account.role == AdminAccount.CATEGORY_ADMIN and instance.category != account.category:
            return Response({"detail": "You can only delete members in your category."}, status=status.HTTP_403_FORBIDDEN)
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE) and not instance.departments.filter(pk__in=assigned_departments(account)).exists():
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
        if account.role == AdminAccount.MANAGING_DEPARTMENTS:
            return Response({"detail": "Managing Departments accounts have read-only access."}, status=status.HTTP_403_FORBIDDEN)
        member = Member.objects.prefetch_related("departments").filter(pk=pk).first()
        if not member: return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)
        if bool(add) == bool(remove): return Response({"detail": "Provide exactly one of 'add' or 'remove'."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Scope validation for department assignment
        if account.role == AdminAccount.CATEGORY_ADMIN and member.category != account.category:
            return Response({"detail": "You can only manage members in your category."}, status=status.HTTP_403_FORBIDDEN)
        try: department = Department.objects.get(name=add or remove)
        except Department.DoesNotExist: return Response({"department": "Unknown department."}, status=status.HTTP_400_BAD_REQUEST)
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE) and not can_manage_department(account, department):
            return Response({"detail": "Department not found."}, status=status.HTTP_404_NOT_FOUND)
        if account.role == AdminAccount.CATEGORY_ADMIN: return Response({"detail": "Category Admins cannot manage department assignments."}, status=status.HTTP_403_FORBIDDEN)
        if remove and not member.departments.filter(pk=department.pk).exists():
            return Response({"detail": "The member is not assigned to this department."}, status=status.HTTP_400_BAD_REQUEST)
        if account.role == AdminAccount.DEPARTMENT_ADMIN:
            action_name = "add" if add else "remove"
            pending = ApprovalRequest.objects.filter(
                member=member,
                status=ApprovalRequest.PENDING,
                type=ApprovalRequest.EDIT,
                changes__departmentAction__department=department.name,
            ).exists()
            if pending:
                return Response({"detail": "A matching membership request is already pending."}, status=status.HTTP_400_BAD_REQUEST)
            approval = ApprovalRequest.objects.create(
                member=member,
                pastorate=department.pastorate,
                type=ApprovalRequest.EDIT,
                requested_by=request.user,
                changes={"departmentAction": {"action": action_name, "department": department.name}},
                reason=f"Request to {action_name} {member} {'to' if add else 'from'} {department.name}.",
            )
            for reviewer in AdminAccount.objects.filter(
                role=AdminAccount.PASTORATE,
                pastorate=department.pastorate,
            ).select_related("user"):
                notify(
                    reviewer.user,
                    "Membership request pending",
                    f"{request.user.get_full_name() or request.user.email} requested to {action_name} {member} in {department.name}.",
                )
            log_activity(request.user, f"Submitted membership {action_name} request for {member}", department)
            return Response(ApprovalRequestSerializer(approval).data, status=status.HTTP_201_CREATED)
        (member.departments.add if add else member.departments.remove)(department)
        member.worker = member.departments.exists()
        member.save(update_fields=("worker",))
        log_activity(request.user, f"{'Added' if add else 'Removed'} {member} {'to' if add else 'from'} {department.name}", department)
        return Response(MemberSerializer(member).data)

class AdminAccountViewSet(viewsets.ModelViewSet):
    serializer_class = AdminAccountSerializer; permission_classes = (SuperAdminOnly,)
    queryset = AdminAccount.objects.select_related("user", "department")
    # The serializer deliberately exposes the login user's ID.  Use that same
    # ID for detail routes so PATCH/DELETE operate on the account selected by
    # the client, even when User and AdminAccount primary keys differ.
    lookup_field = "user_id"

    def get_permissions(self):
        if self.action in (
            "appoint_department_admin",
            "revoke_department_admin",
            "department_admin_candidates",
        ):
            return [IsApplicationAdmin(), PastorateAdminOnly()]
        return [SuperAdminOnly()]

    def _scoped_department(self, account, department_id):
        department = Department.objects.filter(pk=department_id).first()
        if not department:
            raise PermissionDenied("Department not found.")
        if account.role == AdminAccount.PASTORATE and not can_manage_department(account, department):
            raise PermissionDenied("You may only manage departments assigned to you.")
        return department

    @action(detail=False, methods=("get",))
    def department_admin_candidates(self, request):
        account = account_for(request.user)
        if account.role not in (AdminAccount.SUPER_ADMIN, AdminAccount.PASTORATE):
            return Response({"detail": "Only Super Admins and Pastorate Admins can appoint Department Admins."}, status=status.HTTP_403_FORBIDDEN)
        users = get_user_model().objects.filter(
            is_active=True,
            admin_account__isnull=True,
        ).order_by("first_name", "last_name", "email")
        return Response([
            {"id": user.id, "name": user.get_full_name() or user.email, "email": user.email}
            for user in users
        ])

    @action(detail=False, methods=("post",))
    def appoint_department_admin(self, request):
        account = account_for(request.user)
        department = self._scoped_department(account, request.data.get("department_id"))
        user_id = request.data.get("user_id")
        user = get_user_model().objects.filter(pk=user_id, is_active=True).first()
        if not user:
            return Response({"detail": "An active user account is required."}, status=status.HTTP_400_BAD_REQUEST)
        current_account = account_for(user)
        if current_account and current_account.role != AdminAccount.DEPARTMENT_ADMIN:
            return Response({"detail": "Only a regular user or current Department Admin can be appointed."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            AdminAccount.objects.filter(role=AdminAccount.DEPARTMENT_ADMIN, department=department).exclude(pk=getattr(current_account, "pk", None)).delete()
            if current_account:
                current_account.department = department
                current_account.save(update_fields=("department",))
                appointed = current_account
            else:
                appointed = AdminAccount.objects.create(user=user, role=AdminAccount.DEPARTMENT_ADMIN, department=department)
        log_activity(request.user, f"Appointed {user.get_full_name() or user.email} as Department Admin for {department.name}", department)
        return Response(AdminAccountSerializer(appointed).data)

    @action(detail=False, methods=("post",))
    def revoke_department_admin(self, request):
        account = account_for(request.user)
        department = self._scoped_department(account, request.data.get("department_id"))
        appointed = AdminAccount.objects.filter(role=AdminAccount.DEPARTMENT_ADMIN, department=department).select_related("user").first()
        if not appointed:
            return Response({"detail": "This department has no active Department Admin."}, status=status.HTTP_404_NOT_FOUND)
        name = appointed.user.get_full_name() or appointed.user.email
        appointed.delete()
        log_activity(request.user, f"Revoked Department Admin access for {name} in {department.name}", department)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, *args, **kwargs):
        account = self.get_object()
        if account.role == AdminAccount.SUPER_ADMIN: return Response({"detail": "The Super Admin account cannot be removed."}, status=status.HTTP_403_FORBIDDEN)
        user = account.user
        admin_name = user.get_full_name() or user.email

        with transaction.atomic():
            # A promoted member must be eligible to be promoted again after
            # their admin access is removed.
            Member.objects.filter(user=user).update(user=None)
            account.delete()

            # Keep the user row for protected audit records (announcements,
            # reports, approvals, etc.), but retire its credentials and free
            # the previous email/username for a future admin account.
            user.username = f"deleted-admin-{user.pk}"
            user.email = f"deleted-admin-{user.pk}@deleted.invalid"
            user.is_active = False
            user.set_unusable_password()
            user.save(update_fields=("username", "email", "is_active", "password"))

        log_activity(request.user, f"Removed admin access for {admin_name}")
        return Response(status=status.HTTP_204_NO_CONTENT)
    @action(detail=False, methods=("post",))
    def promote_member(self, request):
        member_id = request.data.get("member_id")
        role = request.data.get("role")
        department_id = request.data.get("department_id")
        category = request.data.get("category")
        pastorate_id = request.data.get("pastorate_id")
        department_ids = request.data.get("department_ids") or []
        password = request.data.get("password")
        
        if not member_id or not role or not password:
            return Response({"detail": "member_id, role, and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            member = Member.objects.get(pk=member_id)
        except Member.DoesNotExist:
            return Response({"detail": "Member not found."}, status=status.HTTP_404_NOT_FOUND)
        if not member.email.strip():
            return Response({"detail": "This member must have an email address before being promoted to an admin."}, status=status.HTTP_400_BAD_REQUEST)
        
        if member.user:
            try:
                member.user.admin_account
            except AdminAccount.DoesNotExist:
                orphaned_user = member.user
                orphaned_user.username = f"orphaned-member-{orphaned_user.pk}@deleted.invalid"
                orphaned_user.email = orphaned_user.username
                orphaned_user.is_active = False
                orphaned_user.set_unusable_password()
                orphaned_user.save(update_fields=("username", "email", "is_active", "password"))
                member.user = None
                member.save(update_fields=("user",))
            else:
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
        elif role == AdminAccount.PASTORATE:
            pastorate = Pastorate.objects.filter(pk=pastorate_id).first()
            if not pastorate and not department_ids:
                member_pastorates = Pastorate.objects.filter(
                    departments__members=member,
                ).distinct()
                if member_pastorates.count() == 1:
                    pastorate = member_pastorates.first()
            if not pastorate and not department_ids:
                pastorate = Pastorate.objects.filter(name="General Pastorate").first()
                if not pastorate:
                    pastorate = Pastorate.objects.create(name="General Pastorate")
            if not pastorate:
                user.delete()
                return Response({"detail": "A valid pastorate is required."}, status=status.HTTP_400_BAD_REQUEST)
            departments = Department.objects.filter(pk__in=department_ids, pastorate=pastorate)
            if departments.count() != len(set(department_ids)):
                user.delete()
                return Response({"detail": "Select at least one valid department in the selected pastorate."}, status=status.HTTP_400_BAD_REQUEST)
            if department_ids and AdminAccount.objects.filter(
                role=AdminAccount.PASTORATE,
                departments__in=departments,
            ).exists():
                user.delete()
                return Response({"detail": "One or more selected departments are already assigned to another Pastorate Admin."}, status=status.HTTP_400_BAD_REQUEST)
            admin_data["pastorate"] = pastorate
        
        try:
            admin_account = AdminAccount.objects.create(user=user, **admin_data)
            if role == AdminAccount.PASTORATE:
                admin_account.departments.set(departments)
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
            admin_account = AdminAccount.objects.get(user_id=admin_id)
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
    serializer_class = AnnouncementSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin, ReadOnlyManagingAdmin)
    def get_queryset(self):
        account = account_for(self.request.user); query = Announcement.objects.select_related("department", "author")
        if account.role in (AdminAccount.SUPER_ADMIN, AdminAccount.MANAGING_DEPARTMENTS):
            return query
        if account.role == AdminAccount.PASTORATE and self.action in ("list", "retrieve"):
            return query
        return query.filter(department__in=assigned_departments(account))
    def perform_create(self, serializer):
        account = account_for(self.request.user); department = serializer.validated_data.get("department")
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE):
            if not department or not can_manage_department(account, department): raise permissions.PermissionDenied("You may only post for an assigned department.")
            serializer.save(author=self.request.user, department=department)
        else: serializer.save(author=self.request.user)

class DepartmentReportViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentReportSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin, ReadOnlyManagingAdmin)
    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsApplicationAdmin()]
        return [IsApplicationAdmin(), NonCategoryAdmin(), ReadOnlyManagingAdmin()]
    def get_queryset(self):
        account = account_for(self.request.user); query = DepartmentReport.objects.select_related("department", "submitted_by")
        if account.role in (AdminAccount.SUPER_ADMIN, AdminAccount.MANAGING_DEPARTMENTS):
            return query
        if account.role == AdminAccount.PASTORATE and self.action in ("list", "retrieve"):
            return query
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return query.filter(department__members__category=account.category).distinct()
            return query.filter(department__in=assigned_departments(account))
    def perform_create(self, serializer):
        account = account_for(self.request.user)
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE):
            department = serializer.validated_data.get("department")
            if not department or not can_manage_department(account, department): raise permissions.PermissionDenied("You may only submit reports for an assigned department.")
            serializer.save(submitted_by=self.request.user, department=department)
        else:
            if not serializer.validated_data.get("department"): raise permissions.PermissionDenied("A department is required.")
            serializer.save(submitted_by=self.request.user)

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer; permission_classes = (IsApplicationAdmin, ReadOnlyManagingAdmin)
    def get_queryset(self):
        account = account_for(self.request.user); query = AttendanceRecord.objects.select_related("category", "recorded_by")
        if account.role in (AdminAccount.SUPER_ADMIN, AdminAccount.MANAGING_DEPARTMENTS):
            return query
        if account.role == AdminAccount.PASTORATE and self.action in ("list", "retrieve"):
            return query
        if account.role == AdminAccount.CATEGORY_ADMIN:
            return query.filter(category__name=account.category)
        return query.filter(department__in=assigned_departments(account))
    def perform_create(self, serializer):
        account = account_for(self.request.user)
        category_name = account.category if account.role == AdminAccount.CATEGORY_ADMIN else "General"
        category = Category.objects.get_or_create(name=category_name)[0]
        department = serializer.validated_data.get("department") or (assigned_departments(account).first() if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE) else None)
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE) and not can_manage_department(account, department): raise permissions.PermissionDenied("You may only record attendance for an assigned department.")
        record = serializer.save(recorded_by=self.request.user, category=category, department=department)
        log_activity(self.request.user, f"Recorded attendance for {record.date:%b %d}", department)

class ChurchEventViewSet(viewsets.ModelViewSet):
    serializer_class = ChurchEventSerializer; permission_classes = (IsApplicationAdmin, NonCategoryAdmin, ReadOnlyManagingAdmin)
    def get_queryset(self):
        account = account_for(self.request.user); query = ChurchEvent.objects.select_related("department", "created_by")
        if account.role in (AdminAccount.SUPER_ADMIN, AdminAccount.MANAGING_DEPARTMENTS):
            return query
        if account.role == AdminAccount.PASTORATE and self.action in ("list", "retrieve"):
            return query
        return query.filter(department__in=assigned_departments(account))
    def perform_create(self, serializer):
        account = account_for(self.request.user); department = serializer.validated_data.get("department")
        if account.role in (AdminAccount.DEPARTMENT_ADMIN, AdminAccount.PASTORATE):
            if not department or not can_manage_department(account, department): raise permissions.PermissionDenied("You may only create events for an assigned department.")
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
            return [IsApplicationAdmin()]
        return [IsApplicationAdmin(), ReadOnlyManagingAdmin()]
    def get_queryset(self):
        account = account_for(self.request.user); query = ApprovalRequest.objects.select_related("member", "requested_by", "requested_by__admin_account", "requested_by__admin_account__department")
        if account.role == AdminAccount.SUPER_ADMIN:
            return query
        if account.role == AdminAccount.PASTORATE:
            return query.filter(
                Q(pastorate_id=account.pastorate_id)
                | Q(member__departments__pastorate_id=account.pastorate_id)
            ).distinct()
        return query.filter(requested_by=self.request.user)
    def perform_create(self, serializer):
        account = account_for(self.request.user); member = serializer.validated_data["member"]
        if account.role == AdminAccount.PASTORATE:
            raise PermissionDenied("Pastorate Admins review membership requests; they do not submit them.")
        if account.role == AdminAccount.CATEGORY_ADMIN and member.category != account.category:
            raise PermissionDenied("You may only request changes for members in your category.")
        department_action = serializer.validated_data.get("changes", {}).get("departmentAction")
        if account.role == AdminAccount.DEPARTMENT_ADMIN:
            if department_action:
                department = Department.objects.filter(name=department_action.get("department")).first()
                if not department or department.pk != account.department_id:
                    raise PermissionDenied("You may only request membership changes for your department.")
                if department_action.get("action") == "remove" and not member.departments.filter(pk=department.pk).exists():
                    raise PermissionDenied("The member is not assigned to your department.")
            elif not member.departments.filter(pk=account.department_id).exists():
                raise PermissionDenied("You may only request changes for members in your department.")
        request = serializer.save(
            requested_by=self.request.user,
            pastorate=member.departments.filter(pk=account.department_id).values_list("pastorate", flat=True).first()
            if account.role == AdminAccount.DEPARTMENT_ADMIN else None,
        )
        log_activity(self.request.user, f"Submitted {request.type} request for {member}", account.department)
    def partial_update(self, request, *args, **kwargs):
        account = account_for(request.user)
        if account.role not in (AdminAccount.SUPER_ADMIN, AdminAccount.PASTORATE):
            return Response({"detail": "Only Super Admins and Pastorate Admins can review requests."}, status=status.HTTP_403_FORBIDDEN)
        approval = self.get_object(); decision = request.data.get("status")
        if approval.status != ApprovalRequest.PENDING or decision not in (ApprovalRequest.APPROVED, ApprovalRequest.REJECTED):
            return Response({"detail": "Only pending requests can be approved or rejected."}, status=status.HTTP_400_BAD_REQUEST)
        if approval.requested_by_id == request.user.id:
            return Response({"detail": "You cannot approve your own request."}, status=status.HTTP_403_FORBIDDEN)
        department_action = approval.changes.get("departmentAction") if approval.changes else None
        if account.role == AdminAccount.PASTORATE:
            target_department = Department.objects.filter(name=department_action.get("department")).first() if department_action else None
            in_scope = approval.pastorate_id == account.pastorate_id or approval.member.departments.filter(pastorate_id=account.pastorate_id).exists()
            if target_department:
                in_scope = target_department.pastorate_id == account.pastorate_id
            if not in_scope:
                return Response({"detail": "This request is outside your pastorate."}, status=status.HTTP_403_FORBIDDEN)
        rejection_reason = str(request.data.get("rejectionReason", "")).strip()
        if decision == ApprovalRequest.REJECTED and not rejection_reason:
            return Response({"rejectionReason": "A reason is required when rejecting a request."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            if decision == ApprovalRequest.APPROVED:
                department_action = approval.changes.get("departmentAction") if approval.changes else None
                if department_action:
                    department = Department.objects.filter(name=department_action.get("department")).first()
                    if not department or (department.pastorate_id != account.pastorate_id and account.role != AdminAccount.SUPER_ADMIN):
                        return Response({"detail": "This department is outside your pastorate."}, status=status.HTTP_403_FORBIDDEN)
                    if department_action.get("action") == "add":
                        approval.member.departments.add(department)
                    elif department_action.get("action") == "remove":
                        approval.member.departments.remove(department)
                    log_activity(request.user, f"Approved membership request for {approval.member}", department)
                elif approval.type == ApprovalRequest.EDIT:
                    member_serializer = MemberSerializer(approval.member, data=approval.changes, partial=True)
                    member_serializer.is_valid(raise_exception=True)
                    member_serializer.save()
                else:
                    member = approval.member
                    member_name = str(member)
                    member.delete()
                    approval.member = None
                    log_activity(request.user, f"Approved deletion request for {member_name}")
            approval.status, approval.reviewed_by, approval.reviewed_at = decision, request.user, timezone.now()
            if decision == ApprovalRequest.REJECTED:
                approval.rejection_reason = rejection_reason
            approval.save(update_fields=("status", "reviewed_by", "reviewed_at", "rejection_reason"))
            notify(
                approval.requested_by,
                f"Request {decision}",
                f"Your request for {approval.member or 'a member'} was {decision} by {request.user.get_full_name() or request.user.email}."
                + (f" Reason: {rejection_reason}" if rejection_reason else ""),
            )
        return Response(ApprovalRequestSerializer(approval).data)

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "Approval requests cannot be edited after submission. Review them with PATCH."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (IsApplicationAdmin,)

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=("post",))
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=("read_at",))
        return Response(NotificationSerializer(notification).data)

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
    raw_token = secrets.token_urlsafe(48)
    reset = PasswordResetToken.objects.create(
        user=user,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{raw_token}"
    try:
        send_mail("Reset your FGC Olugoke password", f"Open this link to reset your password:\n\n{reset_url}\n\nThis link expires in 30 minutes.", settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception:
        # Keep any previously sent reset link usable when the provider rejects
        # this delivery attempt, and retain the technical reason in server logs.
        reset.delete()
        logger.exception("Unable to send password-reset email")
        return Response({"detail": "We could not send the password-reset email. Please check the mail configuration and try again."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    PasswordResetToken.objects.filter(user=user, used_at__isnull=True).exclude(pk=reset.pk).update(used_at=timezone.now())
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
@permission_classes((permissions.AllowAny,))
def logout(request):
    # Logout is intentionally idempotent: a locally stored token may already
    # have expired or been revoked, but the user should still be able to leave
    # the application without receiving a 401 response.
    if request.user.is_authenticated:
        Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

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
    elif account.role in (AdminAccount.MANAGING_DEPARTMENTS, AdminAccount.PASTORATE):
        members = Member.objects.all()
    else:
        members = Member.objects.filter(departments__in=assigned_departments(account)).distinct()
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
    if account.role not in (AdminAccount.SUPER_ADMIN, AdminAccount.MANAGING_DEPARTMENTS, AdminAccount.PASTORATE): query = query.filter(department__in=assigned_departments(account))
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

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        for user in get_user_model().objects.filter(email__iexact=email, is_active=True):
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            send_mail(
                subject="Reset your FGC-Olugoke password",
                message=(
                    f"Hello {user.get_username()},\n\n"
                    f"Go to {settings.PASSWORD_RESET_URL} and enter this reset code "
                    "to choose a new password. "
                    "Ignore this email if you did not request a reset.\n\n"
                    f"{uid}.{token}\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {"detail": "If an account exists for that email, a reset code has been sent."},
            status=status.HTTP_200_OK,
        )

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)
        