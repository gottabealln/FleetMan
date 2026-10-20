from django.contrib import admin
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('plate_number', 'make', 'model', 'year', 'status', 'insurance_expiry', 'permit_expiry')
    list_filter = ('status',)
    search_fields = ('plate_number', 'make', 'model')


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'license_number', 'license_expiry', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('full_name', 'license_number')


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('id', 'vehicle', 'driver', 'start_time', 'end_time', 'status', 'origin', 'destination')
    list_filter = ('status',)
    search_fields = ('origin', 'destination')


@admin.register(FuelLog)
class FuelLogAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'date', 'odometer', 'liters', 'cost')
    list_filter = ('date',)
    search_fields = ('vehicle__plate_number',)


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'service_type', 'scheduled_date', 'completed_date', 'status', 'cost')
    list_filter = ('status', 'service_type')
    search_fields = ('vehicle__plate_number', 'service_type')