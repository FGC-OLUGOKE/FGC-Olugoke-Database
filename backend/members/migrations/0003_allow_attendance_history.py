from django.db import migrations


def rebuild_attendance_table(apps, schema_editor):
    cursor = schema_editor.connection.cursor()
    cursor.executescript(
        """
        INSERT OR IGNORE INTO members_category (name, department_id)
        VALUES ('General', NULL);
        CREATE TABLE members_attendancerecord_history (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            adults INTEGER UNSIGNED NOT NULL,
            youth INTEGER UNSIGNED NOT NULL,
            teenagers INTEGER UNSIGNED NOT NULL,
            children INTEGER UNSIGNED NOT NULL,
            category_id BIGINT NOT NULL REFERENCES members_category(id)
                DEFERRABLE INITIALLY DEFERRED,
            department_id BIGINT NULL REFERENCES members_department(id)
                DEFERRABLE INITIALLY DEFERRED,
            recorded_by_id BIGINT NOT NULL REFERENCES auth_user(id)
                DEFERRABLE INITIALLY DEFERRED,
            created_at DATETIME NOT NULL
        );
        INSERT INTO members_attendancerecord_history
            (id, date, adults, youth, teenagers, children, category_id,
             department_id, recorded_by_id, created_at)
        SELECT id, date, adults, youth, teenagers, children,
               (SELECT id FROM members_category WHERE name = 'General'),
               department_id, recorded_by_id, created_at
        FROM members_attendancerecord;
        DROP TABLE members_attendancerecord;
        ALTER TABLE members_attendancerecord_history
            RENAME TO members_attendancerecord;
        """
    )


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0002_repair_category_table"),
    ]

    operations = [
        migrations.RunPython(rebuild_attendance_table, migrations.RunPython.noop),
    ]
