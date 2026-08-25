from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from members.models import AdminAccount


class Command(BaseCommand):
    help = "Create the one application Super Admin account."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--name", required=True)

    def handle(self, *args, **options):
        if AdminAccount.objects.filter(role=AdminAccount.SUPER_ADMIN).exists():
            raise CommandError("A Super Admin already exists. Use /api/users/ to manage Department Admins.")
        name = options["name"].strip().split(maxsplit=1)
        email = options["email"].lower()
        User = get_user_model()
        if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
            raise CommandError("A user with this email already exists.")
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=name[0],
            last_name=name[1] if len(name) > 1 else "",
            password=options["password"],
            is_staff=True,
            is_superuser=True,
        )
        AdminAccount.objects.create(user=user, role=AdminAccount.SUPER_ADMIN)
        self.stdout.write(self.style.SUCCESS(f"Super Admin created for {email}."))
