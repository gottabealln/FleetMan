import random
from datetime import timedelta, datetime, date, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.utils import timezone

from fleet.models import Vehicle, Driver, Trip, FuelLog, Maintenance


class Command(BaseCommand):
    help = "Seed the database with sample FleetMan data"

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all existing fleet data before seeding',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting fleet data...'))
            Trip.objects.all().delete()
            FuelLog.objects.all().delete()
            Maintenance.objects.all().delete()
            Driver.objects.all().delete()
            Vehicle.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('  ✓ Reset complete'))

        self._ensure_groups()
        users = self._create_users()
        vehicles = self._create_vehicles()
        drivers = self._create_drivers(users)
        self._create_trips(vehicles, drivers)
        self._create_fuel_logs(vehicles, drivers)
        self._create_maintenance(vehicles)

        self.stdout.write(self.style.SUCCESS('\nSeed complete!'))
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('  admin   / AdminPass2026!')
        self.stdout.write('  john    / DriverPass2026!')
        self.stdout.write('  viewer  / ViewerPass2026!')

    # ---------- helpers ----------

    def _ensure_groups(self):
        for name in ['admin', 'driver', 'viewer']:
            Group.objects.get_or_create(name=name)

    def _create_users(self):
        users = {}

        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@fleetman.local', 'is_superuser': True, 'is_staff': True},
        )
        admin.set_password('AdminPass2026!')
        admin.save()
        admin.groups.add(Group.objects.get(name='admin'))
        users['admin'] = admin

        john, _ = User.objects.get_or_create(username='john')
        john.set_password('DriverPass2026!')
        john.first_name = 'John'
        john.last_name = 'Doe'
        john.save()
        john.groups.add(Group.objects.get(name='driver'))
        users['john'] = john

        viewer, _ = User.objects.get_or_create(username='viewer')
        viewer.set_password('ViewerPass2026!')
        viewer.save()
        viewer.groups.add(Group.objects.get(name='viewer'))
        users['viewer'] = viewer

        self.stdout.write(self.style.SUCCESS('  ✓ Users created'))
        return users

    def _create_vehicles(self):
        data = [
            ('KA01AB1234', 'Toyota',     'Innova Crysta', 2021),
            ('KA02CD5678', 'Mahindra',   'Scorpio N',     2022),
            ('KA03EF9012', 'Tata',       'Ace Gold',      2020),
            ('KA04GH3456', 'Ashok Leyland', 'Dost',       2019),
            ('KA05IJ7890', 'Maruti',     'Ertiga',        2022),
            ('KA06KL2345', 'Hyundai',    'Creta',         2023),
            ('KA07MN6789', 'Force',      'Traveller',     2018),
            ('KA08OP1234', 'Eicher',     'Pro 2049',      2021),
            ('KA09QR5678', 'Honda',      'City',          2020),
            ('KA10ST9012', 'Kia',        'Seltos',        2023),
        ]

        today = date.today()
        vehicles = []
        for plate, make, model, year in data:
            v, _ = Vehicle.objects.update_or_create(
                plate_number=plate,
                defaults={
                    'make': make,
                    'model': model,
                    'year': year,
                    'status': random.choice(['active', 'active', 'active', 'maintenance']),
                    'insurance_expiry': today + timedelta(days=random.randint(-20, 400)),
                    'permit_expiry': today + timedelta(days=random.randint(30, 500)),
                },
            )
            vehicles.append(v)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(vehicles)} vehicles created'))
        return vehicles

    def _create_drivers(self, users):
        driver_data = [
            ('John Doe',        'DL-KA-001', 'john'),
            ('Suresh Kumar',    'DL-KA-002', None),
            ('Ravi Sharma',     'DL-KA-003', None),
            ('Anita Reddy',     'DL-KA-004', None),
            ('Vikram Singh',    'DL-KA-005', None),
            ('Priya Nair',      'DL-KA-006', None),
            ('Arjun Patel',     'DL-KA-007', None),
            ('Meera Iyer',      'DL-KA-008', None),
        ]

        today = date.today()
        drivers = []
        for name, lic, username in driver_data:
            user = users.get(username) if username else None

            # If this user already has a Driver profile with a different license,
            # detach it first to avoid the unique user_id constraint.
            if user:
                Driver.objects.filter(user=user).exclude(license_number=lic).update(user=None)

            d, _ = Driver.objects.update_or_create(
                license_number=lic,
                defaults={
                    'user': user,
                    'full_name': name,
                    'license_expiry': today + timedelta(days=random.randint(-10, 500)),
                    'phone': f"+91-9{random.randint(100000000, 999999999)}",
                    'is_active': True,
                },
            )
            drivers.append(d)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(drivers)} drivers created'))
        return drivers

    def _create_trips(self, vehicles, drivers):
        routes = [
            ('Bangalore', 'Mysore'),
            ('Bangalore', 'Chennai'),
            ('Bangalore', 'Coorg'),
            ('Mysore', 'Ooty'),
            ('Chennai', 'Pondicherry'),
            ('Hyderabad', 'Vijayawada'),
            ('Mangalore', 'Udupi'),
            ('Hubli', 'Goa'),
        ]

        now = timezone.now()
        created = 0
        used_slots = {v.id: [] for v in vehicles}

        for _ in range(30):
            vehicle = random.choice(vehicles)
            driver = random.choice(drivers)
            origin, destination = random.choice(routes)

            if random.random() < 0.7:
                start = now - timedelta(days=random.randint(1, 60), hours=random.randint(0, 12))
                status = 'completed'
            else:
                start = now + timedelta(days=random.randint(1, 30), hours=random.randint(8, 18))
                status = 'scheduled'

            duration_hours = random.randint(2, 8)
            end = start + timedelta(hours=duration_hours)

            conflict = False
            for (s, e) in used_slots[vehicle.id]:
                if start < e and end > s:
                    conflict = True
                    break
            if conflict:
                continue

            used_slots[vehicle.id].append((start, end))

            try:
                Trip.objects.create(
                    vehicle=vehicle,
                    driver=driver,
                    start_time=start,
                    end_time=end,
                    origin=origin,
                    destination=destination,
                    status=status,
                )
                created += 1
            except Exception:
                continue

        self.stdout.write(self.style.SUCCESS(f'  ✓ {created} trips created'))

    def _create_fuel_logs(self, vehicles, drivers):
        """
        Generate realistic fuel logs for EVERY vehicle.
        - Each vehicle gets 12-20 fuel logs
        - Odometer increases monotonically
        - Realistic mileage (9-18 km/L) and price (90-105 per litre)
        """
        today = date.today()
        created = 0

        for v in vehicles:
            odometer = random.randint(15000, 120000)
            num_fills = random.randint(12, 20)

            for i in range(num_fills):
                d = random.choice(drivers)
                km_since_fill = random.randint(180, 550)
                mileage = random.uniform(9, 18)
                litres = round(km_since_fill / mileage, 2)
                price_per_litre = random.uniform(90, 105)
                cost = round(litres * price_per_litre, 2)

                odometer += km_since_fill

                days_ago = 120 - (i * 5) + random.randint(-2, 2)
                days_ago = max(1, days_ago)

                FuelLog.objects.create(
                    vehicle=v,
                    driver=d,
                    date=today - timedelta(days=days_ago),
                    odometer=odometer,
                    liters=Decimal(str(litres)),
                    cost=Decimal(str(cost)),
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {created} fuel logs created'))

    def _create_maintenance(self, vehicles):
        services = ['Oil change', 'Brake pads', 'Tyre rotation',
                    'AC service', 'Battery replacement', 'Engine tune-up']
        statuses = ['scheduled', 'in_progress', 'completed']
        today = date.today()
        created = 0

        for _ in range(15):
            v = random.choice(vehicles)
            status = random.choice(statuses)
            scheduled = today + timedelta(days=random.randint(-30, 45))
            completed = scheduled + timedelta(days=random.randint(0, 3)) if status == 'completed' else None

            Maintenance.objects.create(
                vehicle=v,
                service_type=random.choice(services),
                description='Routine service.',
                scheduled_date=scheduled,
                completed_date=completed,
                cost=Decimal(random.randint(500, 15000)),
                status=status,
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {created} maintenance records created'))