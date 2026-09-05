from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE TABLE IF NOT EXISTS members_category (
                    id SERIAL NOT NULL PRIMARY KEY,
                    name VARCHAR(120) NOT NULL UNIQUE,
                    department_id BIGINT NULL REFERENCES members_department(id)
                        DEFERRABLE INITIALLY DEFERRED
                )
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
