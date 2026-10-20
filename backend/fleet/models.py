from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators
from django.db.models import F, Func


# ---------- Vehicle ----------
class Vehicle(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'In Maintenance'),
        ('retired', 'Retired'),
    ]
    plate_number = models.CharField(max_length=20, unique=True)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    insurance_expiry = models.DateField(null=True, blank=True)
    permit_expiry = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.plate_number} ({self.make} {self.model})"


# ---------- Driver ----------
class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True)
    full_name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField()
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


# ---------- Trip ----------
class Trip(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='trips')
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, related_name='trips')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    origin = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            ExclusionConstraint(
                name='exclude_overlapping_trips_vehicle',
                expressions=[
                    ('vehicle', RangeOperators.EQUAL),
                    (Func(F('start_time'), F('end_time'), function='tstzrange'), RangeOperators.OVERLAPS),
                ],
            ),
            ExclusionConstraint(
                name='exclude_overlapping_trips_driver',
                expressions=[
                    ('driver', RangeOperators.EQUAL),
                    (Func(F('start_time'), F('end_time'), function='tstzrange'), RangeOperators.OVERLAPS),
                ],
            ),
        ]

    def __str__(self):
        return f"Trip {self.id}: {self.origin} → {self.destination}"


# ---------- Fuel Log ----------
class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_logs')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    odometer = models.PositiveIntegerField(help_text="Odometer reading at fill-up (km)")
    liters = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Fuel {self.vehicle.plate_number} @ {self.odometer}km"


# ---------- Maintenance ----------
class Maintenance(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_records')
    service_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    scheduled_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.service_type} - {self.vehicle.plate_number}"