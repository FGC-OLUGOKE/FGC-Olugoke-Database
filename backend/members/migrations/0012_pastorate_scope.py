from django.db import migrations, models
import django.db.models.deletion


def assign_existing_scopes(apps, schema_editor):
    AdminAccount = apps.get_model("members", "AdminAccount")
    Department = apps.get_model("members", "Department")
    Pastorate = apps.get_model("members", "Pastorate")

    general, _ = Pastorate.objects.get_or_create(name="General Pastorate")
    Department.objects.filter(pastorate__isnull=True).update(pastorate=general)

    for account in AdminAccount.objects.filter(role="pastorate").select_related("user"):
        departments = list(account.departments.all())
        pastorates = {department.pastorate_id for department in departments if department.pastorate_id}
        if len(pastorates) == 1:
            pastorate_id = next(iter(pastorates))
            account.pastorate_id = pastorate_id
        elif departments:
            label = account.user.get_full_name() or account.user.email
            pastorate, _ = Pastorate.objects.get_or_create(name=f"{label} Pastorate")
            Department.objects.filter(pk__in=[department.pk for department in departments]).update(pastorate=pastorate)
            account.pastorate = pastorate
        else:
            account.pastorate = general
        account.save(update_fields=("pastorate",))
        account.departments.set(account.pastorate.departments.all())


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0011_member_date_of_membership"),
    ]

    operations = [
        migrations.CreateModel(
            name="Pastorate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ("name",)},
        ),
        migrations.AddField(
            model_name="department",
            name="pastorate",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="departments",
                to="members.pastorate",
            ),
        ),
        migrations.AddField(
            model_name="adminaccount",
            name="pastorate",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="admins",
                to="members.pastorate",
            ),
        ),
        migrations.RunPython(assign_existing_scopes, migrations.RunPython.noop),
    ]
