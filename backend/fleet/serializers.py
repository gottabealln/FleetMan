from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import IntegrityError
from .models import Vehicle, Driver, Trip, FuelLog, Maintenance


# ---------- Vehicle ----------
class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'


# ---------- Driver ----------
class DriverSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Driver
        fields = ['id', 'user', 'username', 'full_name', 'license_number',
                  'license_expiry', 'phone', 'is_active', 'created_at']
        read_only_fields = ['created_at']


# ---------- Trip ----------
class TripSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(source='vehicle.plate_number', read_only=True)
    driver_name = serializers.CharField(source='driver.full_name', read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'vehicle', 'vehicle_plate', 'driver', 'driver_name',
                  'start_time', 'end_time', 'origin', 'destination',
                  'status', 'created_at']
        read_only_fields = ['created_at']

    def validate(self, data):
        if data.get('start_time') and data.get('end_time'):
            if data['end_time'] <= data['start_time']:
                raise serializers.ValidationError(
                    "end_time must be after start_time."
                )
        return data

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except IntegrityError as e:
            msg = str(e)
            if 'exclude_overlapping_trips_vehicle' in msg:
                raise serializers.ValidationError(
                    {"detail": "This vehicle is already booked for the selected time range."}
                )
            if 'exclude_overlapping_trips_driver' in msg:
                raise serializers.ValidationError(
                    {"detail": "This driver is already booked for the selected time range."}
                )
            raise serializers.ValidationError({"detail": "Trip conflict."})

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except IntegrityError as e:
            msg = str(e)
            if 'exclude_overlapping_trips_vehicle' in msg:
                raise serializers.ValidationError(
                    {"detail": "This vehicle is already booked for the selected time range."}
                )
            if 'exclude_overlapping_trips_driver' in msg:
                raise serializers.ValidationError(
                    {"detail": "This driver is already booked for the selected time range."}
                )
            raise serializers.ValidationError({"detail": "Trip conflict."})


# ---------- Fuel Log ----------
class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(source='vehicle.plate_number', read_only=True)

    class Meta:
        model = FuelLog
        fields = ['id', 'vehicle', 'vehicle_plate', 'driver', 'date',
                  'odometer', 'liters', 'cost', 'receipt_image', 'created_at']
        read_only_fields = ['created_at']


# ---------- Maintenance ----------
class MaintenanceSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(source='vehicle.plate_number', read_only=True)

    class Meta:
        model = Maintenance
        fields = ['id', 'vehicle', 'vehicle_plate', 'service_type', 'description',
                  'scheduled_date', 'completed_date', 'cost', 'status', 'created_at']
        read_only_fields = ['created_at']