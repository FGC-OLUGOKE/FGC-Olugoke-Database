from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0009_passwordresettoken"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminaccount",
            name="departments",
            field=models.ManyToManyField(blank=True, related_name="pastorate_admins", to="members.department"),
        ),
        migrations.AlterField(
            model_name="adminaccount",
            name="role",
            field=models.CharField(
                choices=[
                    ("super_admin", "Super Admin"),
                    ("category_admin", "Category Admin"),
                    ("department_admin", "Departmental Admin"),
                    ("managing_departments", "Managing Departments"),
                    ("pastorate", "Pastorate"),
                ],
                max_length=32,
            ),
        ),
    ]