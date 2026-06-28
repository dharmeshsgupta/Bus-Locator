from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    DRIVER = "driver"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class BusStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    EN_ROUTE = "EN_ROUTE"

class AssignmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    EXPIRED = "EXPIRED"

class RouteVersionStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
