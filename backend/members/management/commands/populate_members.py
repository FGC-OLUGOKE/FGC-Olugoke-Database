from datetime import date, timedelta

from django.core.management.base import BaseCommand

from members.models import Department, Member


class Command(BaseCommand):
    help = "Populate five members in each category; two per category belong to departments."

    def handle(self, *args, **options):
        departments = [
            Department.objects.get_or_create(name=name)[0]
            for name in ("Choir", "Ushering", "Media", "Prayer")
        ]
        categories = ("Children", "Teenager", "Youth", "Adult")
        created = 0
        for category_index, category in enumerate(categories):
            for member_index in range(5):
                first_name = f"{category} Member"
                last_name = str(member_index + 1)
                member, was_created = Member.objects.get_or_create(
                    first_name=first_name,
                    last_name=last_name,
                    defaults={
                        "gender": "Female" if member_index % 2 == 0 else "Male",
                        "date_of_birth": date(1990, 1, 1) + timedelta(days=member_index * 365),
                        "category": category,
                    },
                )
                if was_created:
                    created += 1
                elif member.category != category:
                    member.category = category
                    member.save(update_fields=("category",))
                if member_index < 2:
                    member.departments.add(departments[(category_index + member_index) % len(departments)])
                else:
                    member.departments.clear()
                member.worker = member.departments.exists()
                member.save(update_fields=("worker",))
        self.stdout.write(self.style.SUCCESS(f"Created {created} members; ensured five per category and two departmental members per category."))
