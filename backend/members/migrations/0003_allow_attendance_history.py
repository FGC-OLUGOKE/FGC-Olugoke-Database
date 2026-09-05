from django.db import migrations


def rebuild_attendance_table(apps, schema_editor):
    cursor = schema_editor.connection.cursor()
    # Execute each statement separately for PostgreSQL compatibility
    cursor.execute(
        """
        INSERT INTO members_category (name, department_id)
        VALUES ('General', NULL)
        ON CONFLICT (name) DO NOTHING
        """
    )
    cursor.execute(
        """
        CREATE TABLE members_attendancerecord_history (
            id SERIAL NOT NULL PRIMARY KEY,
            date DATE NOT NULL,
            adults INTEGER NOT NULL,
            youth INTEGER NOT NULL,
            teenagers INTEGER NOT NULL,
            children INTEGER NOT NULL,
            category_id BIGINT NOT NULL REFERENCES members_category(id)
                DEFERRABLE INITIALLY DEFERRED,
            department_id BIGINT NULL REFERENCES members_department(id)
                DEFERRABLE INITIALLY DEFERRED,
            recorded_by_id BIGINT NOT NULL REFERENCES auth_user(id)
                DEFERRABLE INITIALLY DEFERRED,
            created_at TIMESTAMP NOT NULL
        )
        """
    )
    cursor.execute(
        """
        INSERT INTO members_attendancerecord_history
            (id, date, adults, youth, teenagers, children, category_id,
             department_id, recorded_by_id, created_at)
        SELECT id, date, adults, youth, teenagers, children,
               (SELECT id FROM members_category WHERE name = 'General'),
               department_id, recorded_by_id, created_at
        FROM members_attendancerecord
        """
    )
    cursor.execute("DROP TABLE members_attendancerecord")
    cursor.execute("ALTER TABLE members_attendancerecord_history RENAME TO members_attendancerecord")


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0002_repair_category_table"),
    ]

    operations = [
        migrations.RunPython(rebuild_attendance_table, migrations.RunPython.noop),
    ]
