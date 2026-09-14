from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0015_approvalrequest_rejection_reason_notification"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminaccount",
            name="must_set_password",
            field=models.BooleanField(default=False),
        ),
    ]
