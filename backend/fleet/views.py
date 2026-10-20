from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance
from .serializers import (
    VehicleSerializer, DriverSerializer, TripSerializer,
    FuelLogSerializer, MaintenanceSerializer,
)
from .permissions import (
    IsAdmin, IsAdminOrReadOnly,
    IsAdminOrDriverForOwnTrips, IsAdminOrDriverForFuel,
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Min, Max

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by('plate_number')
    serializer_class = VehicleSerializer
    permission_classes = [IsAdminOrReadOnly]


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all().order_by('full_name')
    serializer_class = DriverSerializer
    permission_classes = [IsAdminOrReadOnly]


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsAdminOrDriverForOwnTrips]

    def get_queryset(self):
        user = self.request.user
        qs = Trip.objects.select_related('vehicle', 'driver').order_by('-start_time')
        # Admin/superuser: see all
        if user.is_superuser or user.groups.filter(name='admin').exists():
            return qs
        # Driver: only own trips
        if user.groups.filter(name='driver').exists():
            driver = getattr(user, 'driver', None)
            if driver:
                return qs.filter(driver=driver)
            return qs.none()
        # Viewer: read-only, but sees everything
        return qs


class FuelLogViewSet(viewsets.ModelViewSet):
    queryset = FuelLog.objects.select_related('vehicle', 'driver').order_by('-date')
    serializer_class = FuelLogSerializer
    permission_classes = [IsAdminOrDriverForFuel]


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset = Maintenance.objects.select_related('vehicle').order_by('-scheduled_date')
    serializer_class = MaintenanceSerializer
    permission_classes = [IsAdminOrReadOnly]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vehicle_analytics(request):
    """
    Returns per-vehicle fuel and cost analytics:
    - total liters, total cost
    - distance driven (from odometer deltas)
    - cost per km, km per liter
    """
    result = []

    for vehicle in Vehicle.objects.all():
        logs = vehicle.fuel_logs.order_by('date')

        total_cost = logs.aggregate(s=Sum('cost'))['s'] or 0
        total_liters = logs.aggregate(s=Sum('liters'))['s'] or 0

        first = logs.first()
        last = logs.last()
        distance = 0
        if first and last and last.odometer > first.odometer:
            distance = last.odometer - first.odometer

        cost_per_km = float(total_cost) / distance if distance > 0 else None
        km_per_liter = distance / float(total_liters) if total_liters > 0 else None

        result.append({
            'vehicle_id': vehicle.id,
            'plate_number': vehicle.plate_number,
            'make': vehicle.make,
            'model': vehicle.model,
            'total_cost': float(total_cost),
            'total_liters': float(total_liters),
            'distance_km': distance,
            'cost_per_km': round(cost_per_km, 2) if cost_per_km else None,
            'km_per_liter': round(km_per_liter, 2) if km_per_liter else None,
            'fuel_log_count': logs.count(),
        })

    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the current user's role and driver profile info."""
    user = request.user
    groups = list(user.groups.values_list('name', flat=True))
    driver = getattr(user, 'driver', None)

    if user.is_superuser or 'admin' in groups:
        role = 'admin'
    elif 'driver' in groups:
        role = 'driver'
    else:
        role = 'viewer'

    return Response({
        'id': user.id,
        'username': user.username,
        'role': role,
        'groups': groups,
        'driver_id': driver.id if driver else None,
        'driver_name': driver.full_name if driver else None,
    })