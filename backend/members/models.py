from django.db import models

class Member(models.Model):
    """Generic church member record for general membership tracking."""

    title = models.CharField(
        max_length=50,
        blank=True,
        help_text="Optional title, such as Mr., Mrs., Dr., or Pastor.",
    )
    first_name = models.CharField(
        max_length=128,
        help_text="Member first name.",
    )
    other_name = models.CharField(
        max_length=128,
        blank=True,
        help_text="Optional additional given names.",
    )
    last_name = models.CharField(
        max_length=128,
        help_text="Member last name.",
    )
    gender = models.CharField(
        max_length=16,
        choices=[("Male", "Male"), ("Female", "Female")],
        help_text="Member gender.",
    )
    picture = models.ImageField(
        upload_to="member_photos/",
        blank=True,
        null=True,
        help_text="Optional profile photo.",
    )
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        help_text="Optional date of birth.",
    )
    marital_status = models.CharField(
        max_length=64,
        blank=True,
        help_text="Optional marital status.",
    )
    date_of_marriage = models.DateField(
        blank=True,
        null=True,
        help_text="Optional marriage date.",
    )
    type_of_marriage = models.CharField(
        max_length=64,
        blank=True,
        help_text="Optional marriage type.",
    )
    number_of_children = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Optional number of children.",
    )
    email = models.EmailField(
        blank=True,
        help_text="Optional contact email.",
    )
    mobile = models.CharField(
        max_length=32,
        blank=True,
        help_text="Optional primary mobile phone number.",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp updated when the member record changes.",
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.first_name and self.last_name else self.email
