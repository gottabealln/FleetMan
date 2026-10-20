from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, DriverViewSet, TripViewSet,
    FuelLogViewSet, MaintenanceViewSet, me, vehicle_analytics,
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'fuel-logs', FuelLogViewSet, basename='fuel-log')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')

urlpatterns = [
    path('me/', me, name='me'),
    path('analytics/vehicles/', vehicle_analytics, name='vehicle-analytics'),
    path('', include(router.urls)),
]
