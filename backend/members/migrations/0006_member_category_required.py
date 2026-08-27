from django.db import migrations, models


CATEGORY_CHOICES = (("Children", "Children"), ("Teenager", "Teenager"), ("Youth", "Youth"), ("Adult", "Adult"))


def fill_missing_categories(apps, schema_editor):
    Member = apps.get_model("members", "Member")
    Member.objects.filter(category="").update(category="Adult")


class Migration(migrations.Migration):
    dependencies = [("members", "0005_adminaccount_category_and_category_admin")]

    operations = [
        migrations.RunPython(fill_missing_categories, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="member",
            name="category",
            field=models.CharField(choices=CATEGORY_CHOICES, max_length=32),
        ),
    ]