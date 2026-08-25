from django.contrib import admin
from .models import AdminAccount, Announcement, Department, DepartmentReport, Member
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin): list_display = ("name", "leader"); search_fields = ("name", "leader")
@admin.register(AdminAccount)
class AdminAccountAdmin(admin.ModelAdmin): list_display = ("user", "role", "department", "created_at"); list_select_related = ("user", "department")
@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "phone", "updated_at"); search_fields = ("first_name", "last_name", "email", "phone"); filter_horizontal = ("departments",)
admin.site.register(Announcement)
admin.site.register(DepartmentReport)
