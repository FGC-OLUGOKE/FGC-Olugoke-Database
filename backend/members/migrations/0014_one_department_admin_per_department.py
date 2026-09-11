from django.db import migrations, models
from django.db.models import Q


def keep_one_department_admin(apps, schema_editor):
    AdminAccount = apps.get_model("members", "AdminAccount")
    department_ids = (
        AdminAccount.objects.filter(role="department_admin", department__isnull=False)
        .values_list("department_id", flat=True)
        .distinct()
    )
    for department_id in department_ids:
        accounts = AdminAccount.objects.filter(
            role="department_admin",
            department_id=department_id,
        ).order_by("created_at", "pk")
        duplicate_ids = list(accounts.values_list("pk", flat=True)[1:])
        if duplicate_ids:
            # Remove only duplicate admin profiles; the associated user rows
            # remain available as ordinary users and preserve audit history.
            AdminAccount.objects.filter(pk__in=duplicate_ids).delete()


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("members", "0013_approvalrequest_pastorate"),
    ]

    operations = [
        migrations.RunPython(keep_one_department_admin, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="adminaccount",
            constraint=models.UniqueConstraint(
                condition=Q(("role", "department_admin")),
                fields=("department",),
                name="one_department_admin_per_department",
            ),
        ),
    ]
