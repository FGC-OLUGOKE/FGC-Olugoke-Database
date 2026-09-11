from django.db import migrations, models
import django.db.models.deletion


def backfill_request_pastorates(apps, schema_editor):
    ApprovalRequest = apps.get_model("members", "ApprovalRequest")
    for request in ApprovalRequest.objects.select_related("member").filter(pastorate__isnull=True):
        department = request.member.departments.select_related("pastorate").first() if request.member_id else None
        if department and department.pastorate_id:
            request.pastorate_id = department.pastorate_id
            request.save(update_fields=("pastorate",))


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0012_pastorate_scope"),
    ]

    operations = [
        migrations.AddField(
            model_name="approvalrequest",
            name="pastorate",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="approval_requests",
                to="members.pastorate",
            ),
        ),
        migrations.RunPython(backfill_request_pastorates, migrations.RunPython.noop),
    ]
