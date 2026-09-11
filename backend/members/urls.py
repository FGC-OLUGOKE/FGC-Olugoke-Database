from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AdminAccountViewSet, AnnouncementViewSet, ApprovalRequestViewSet, AttendanceRecordViewSet, ChurchEventViewSet, DepartmentReportViewSet, DepartmentViewSet, MemberViewSet, NotificationViewSet, PastorateViewSet, PasswordResetConfirmView, PasswordResetRequestView, activity_log, confirm_password_reset, health, login, logout, me, membership_growth, request_password_reset
router = DefaultRouter()
router.register("members", MemberViewSet, basename="member")
router.register("departments", DepartmentViewSet, basename="department")
router.register("pastorates", PastorateViewSet, basename="pastorate")
router.register("users", AdminAccountViewSet, basename="user")
router.register("announcements", AnnouncementViewSet, basename="announcement")
router.register("department-reports", DepartmentReportViewSet, basename="department-report")
router.register("attendance", AttendanceRecordViewSet, basename="attendance")
router.register("events", ChurchEventViewSet, basename="event")
router.register("approval-requests", ApprovalRequestViewSet, basename="approval-request")
router.register("notifications", NotificationViewSet, basename="notification")
urlpatterns = [path("auth/login/", login), path("auth/logout/", logout), path("auth/password-reset/request/", request_password_reset), path("auth/password-reset/confirm/<str:token>/", confirm_password_reset), path("auth/password-reset/", PasswordResetRequestView.as_view()), path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view()), path("me/", me), path("membership-growth/", membership_growth), path("activity-log/", activity_log), path("health/", health), path("", include(router.urls))]
