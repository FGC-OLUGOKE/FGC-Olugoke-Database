from django.db import migrations


def create_frontend_departments(apps, schema_editor):
    Department = apps.get_model("members", "Department")
    for name in ("Children Church", "Evangelism"):
        Department.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0006_alter_approvalrequest_member"),
    ]

    operations = [
        migrations.RunPython(create_frontend_departments, migrations.RunPython.noop),
    ]