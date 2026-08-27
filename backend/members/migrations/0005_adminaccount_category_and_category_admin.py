from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("members", "0004_remove_adminaccount_category_alter_adminaccount_role")]

    operations = [
        migrations.AddField(
            model_name="adminaccount",
            name="category",
            field=models.CharField(blank=True, choices=[("Children", "Children"), ("Teenager", "Teenager"), ("Youth", "Youth"), ("Adult", "Adult")], max_length=32, null=True),
        ),
        migrations.AlterField(
            model_name="adminaccount",
            name="role",
            field=models.CharField(choices=[("super_admin", "Super Admin"), ("category_admin", "Category Admin"), ("department_admin", "Departmental Admin")], max_length=32),
        ),
    ]