from rest_framework import permissions


def user_in_group(user, group_name):
    return user.is_authenticated and user.groups.filter(name=group_name).exists()


class IsAdmin(permissions.BasePermission):
    """Full access — only Admin group or superuser."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or user_in_group(request.user, 'admin')
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """Read for anyone logged in; write only for Admin."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_superuser or user_in_group(request.user, 'admin')


class IsAdminOrDriverForOwnTrips(permissions.BasePermission):
    """Admin: full. Driver: only own trips. Viewer: read-only."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser or user_in_group(request.user, 'admin'):
            return True
        if user_in_group(request.user, 'driver'):
            return True
        if user_in_group(request.user, 'viewer'):
            return request.method in permissions.SAFE_METHODS
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or user_in_group(request.user, 'admin'):
            return True
        if user_in_group(request.user, 'driver'):
            # Driver can only touch their own trips
            driver = getattr(request.user, 'driver', None)
            if driver is None:
                return False
            if request.method in permissions.SAFE_METHODS:
                return obj.driver_id == driver.id
            return obj.driver_id == driver.id
        if user_in_group(request.user, 'viewer'):
            return request.method in permissions.SAFE_METHODS
        return False


class IsAdminOrDriverForFuel(permissions.BasePermission):
    """Admin: full. Driver: create + read. Viewer: read-only."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser or user_in_group(request.user, 'admin'):
            return True
        if user_in_group(request.user, 'driver'):
            return True
        if user_in_group(request.user, 'viewer'):
            return request.method in permissions.SAFE_METHODS
        return False