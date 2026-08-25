from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AdminAccountViewSet, AnnouncementViewSet, ApprovalRequestViewSet, AttendanceRecordViewSet, ChurchEventViewSet, DepartmentReportViewSet, DepartmentViewSet, MemberViewSet, activity_log, login, logout, me, membership_growth
router = DefaultRouter()
router.register("members", MemberViewSet, basename="member")
router.register("departments", DepartmentViewSet, basename="department")
router.register("users", AdminAccountViewSet, basename="user")
router.register("announcements", AnnouncementViewSet, basename="announcement")
router.register("department-reports", DepartmentReportViewSet, basename="department-report")
router.register("attendance", AttendanceRecordViewSet, basename="attendance")
router.register("events", ChurchEventViewSet, basename="event")
router.register("approval-requests", ApprovalRequestViewSet, basename="approval-request")
urlpatterns = [path("auth/login/", login), path("auth/logout/", logout), path("me/", me), path("membership-growth/", membership_growth), path("activity-log/", activity_log), path("", include(router.urls))]
