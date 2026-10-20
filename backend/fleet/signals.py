from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Driver


@receiver(post_save, sender=User)
def ensure_driver_profile(sender, instance, created, **kwargs):
    """
    If a user is added to the 'driver' group, ensure a Driver row exists.
    Profile is filled in manually via admin afterwards.
    """
    if instance.groups.filter(name='driver').exists():
        Driver.objects.get_or_create(
            user=instance,
            defaults={
                'full_name': instance.get_full_name() or instance.username,
                'license_number': f'PENDING-{instance.id}',
                'license_expiry': '2099-12-31',
            },
        )