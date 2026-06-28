from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    DRIVER = "driver"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
