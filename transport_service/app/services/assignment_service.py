from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.assignment_repository import assignment_repository
from app.repositories.route_repository import route_repository
from app.repositories.stop_repository import stop_repository
from app.repositories.bus_repository import bus_repository
from app.schemas.assignment import StudentAssignmentCreate, DriverAssignmentCreate
from app.models.assignment import StudentAssignment, DriverAssignment
from app.models.enums import AssignmentStatus
from app.core.exceptions import EntityNotFoundException, BusinessRuleException
from app.services.event_service import event_service
from datetime import datetime, timezone
import uuid

class AssignmentService:
    async def assign_student(self, db: AsyncSession, data: StudentAssignmentCreate, user_id: uuid.UUID) -> StudentAssignment:
        route = await route_repository.get(db, data.route_id)
        if not route:
            raise EntityNotFoundException("Route", str(data.route_id))
            
        stop = await stop_repository.get(db, data.pickup_stop_id)
        if not stop:
            raise EntityNotFoundException("Stop", str(data.pickup_stop_id))
            
        if stop.route_id != route.id:
            raise BusinessRuleException("Stop does not belong to the given Route.")
            
        # Suspend existing assignment if active
        existing = await assignment_repository.get_active_student_assignment(db, data.student_id)
        if existing:
            existing.assignment_status = AssignmentStatus.EXPIRED
            existing.valid_to = datetime.now(timezone.utc)
            existing.updated_by = user_id
            db.add(existing)

        # Create new assignment snapshotting the stop name and sequence
        obj_in = data.model_dump()
        obj_in["pickup_stop_name"] = stop.stop_name
        obj_in["pickup_stop_sequence"] = stop.sequence_number
        obj_in["valid_from"] = datetime.now(timezone.utc)
        obj_in["created_by"] = user_id
        obj_in["updated_by"] = user_id
        
        assignment = await assignment_repository.create_student_assignment(db, obj_in)
        await event_service.publish(db, "STUDENT_ASSIGNED", {"student_id": str(data.student_id), "route_id": str(route.id)})
        return assignment

    async def assign_driver(self, db: AsyncSession, data: DriverAssignmentCreate, user_id: uuid.UUID) -> DriverAssignment:
        bus = await bus_repository.get(db, data.bus_id)
        if not bus:
            raise EntityNotFoundException("Bus", str(data.bus_id))
            
        # Suspend existing assignment if active
        existing = await assignment_repository.get_active_driver_assignment(db, data.driver_id)
        if existing:
            existing.assignment_status = AssignmentStatus.EXPIRED
            existing.valid_to = datetime.now(timezone.utc)
            existing.updated_by = user_id
            db.add(existing)
            
        obj_in = data.model_dump()
        obj_in["valid_from"] = datetime.now(timezone.utc)
        obj_in["created_by"] = user_id
        obj_in["updated_by"] = user_id
        
        assignment = await assignment_repository.create_driver_assignment(db, obj_in)
        await event_service.publish(db, "DRIVER_ASSIGNED", {"driver_id": str(data.driver_id), "bus_id": str(bus.id)})
        return assignment

    async def get_my_route(self, db: AsyncSession, student_id: uuid.UUID):
        assignment = await assignment_repository.get_active_student_assignment(db, student_id)
        if not assignment:
            raise EntityNotFoundException("Assignment", str(student_id))
        return await route_repository.get(db, assignment.route_id)
        
    async def get_my_stop(self, db: AsyncSession, student_id: uuid.UUID):
        assignment = await assignment_repository.get_active_student_assignment(db, student_id)
        if not assignment:
            raise EntityNotFoundException("Assignment", str(student_id))
        return await stop_repository.get(db, assignment.pickup_stop_id)
        
    async def get_all_student_assignments(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        return await assignment_repository.get_all_student_assignments(db, skip, limit)

    async def get_all_driver_assignments(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        return await assignment_repository.get_all_driver_assignments(db, skip, limit)

    async def get_my_bus(self, db: AsyncSession, driver_id: uuid.UUID):
        assignment = await assignment_repository.get_active_driver_assignment(db, driver_id)
        if not assignment:
            raise EntityNotFoundException("Assignment", str(driver_id))
        return await bus_repository.get(db, assignment.bus_id)

    async def get_student_full_assignment(self, db: AsyncSession, student_id: uuid.UUID):
        # 1. Get student assignment
        student_assign = await assignment_repository.get_active_student_assignment(db, student_id)
        if not student_assign:
            raise EntityNotFoundException("Student Assignment", str(student_id))
            
        # 2. Get Route and Stop
        route = await route_repository.get(db, student_assign.route_id)
        stop = await stop_repository.get(db, student_assign.pickup_stop_id)
        
        # 3. Get Bus assigned to this route
        from sqlalchemy import select
        from app.models.bus import Bus
        bus_res = await db.execute(select(Bus).where(Bus.current_route_id == route.id))
        bus = bus_res.scalars().first()
        
        # 4. Get Driver assigned to this bus
        driver_name = "TBD"
        if bus:
            from app.models.assignment import DriverAssignment
            driver_assign_res = await db.execute(
                select(DriverAssignment).where(
                    DriverAssignment.bus_id == bus.id,
                    DriverAssignment.assignment_status == AssignmentStatus.ACTIVE
                )
            )
            driver_assign = driver_assign_res.scalars().first()
            if driver_assign:
                # We don't have the user's name in Transport Service DB directly!
                # Driver info is in Auth service. For now, return the UUID or placeholder
                driver_name = str(driver_assign.driver_id)[:8]
                
        return {
            "route_id": str(route.id),
            "route_name": route.route_name,
            "bus_id": str(bus.id) if bus else None,
            "bus_number": bus.bus_number if bus else None,
            "pickup_stop_id": str(stop.id),
            "driver_name": driver_name
        }

    async def get_driver_full_assignment(self, db: AsyncSession, driver_id: uuid.UUID):
        # 1. Get driver assignment
        driver_assign = await assignment_repository.get_active_driver_assignment(db, driver_id)
        if not driver_assign:
            raise EntityNotFoundException("Driver Assignment", str(driver_id))
            
        # 2. Get Bus
        bus = await bus_repository.get(db, driver_assign.bus_id)
        if not bus:
            raise EntityNotFoundException("Bus", str(driver_assign.bus_id))
            
        # 3. Get Route if assigned
        route = None
        stops = []
        if bus.current_route_id:
            route = await route_repository.get(db, bus.current_route_id)
            if route:
                stops, _ = await stop_repository.get_by_route(db, route.id, limit=500)
                
        # We need route_status, but since this is transport_service, the route execution 
        # state is tracked in TrackingService. We'll default to NOT_STARTED. The 
        # frontend will merge it with tracking service data or the tracking service will provide it.
        # But wait, requirement says return it all here. Let's include default route_status.
                
        return {
            "driver": {"id": str(driver_id)},
            "bus": {"id": str(bus.id), "bus_number": bus.bus_number, "registration_number": bus.registration_number, "capacity": bus.capacity} if bus else None,
            "route": {"id": str(route.id), "route_name": route.route_name, "route_code": route.route_code} if route else None,
            "stops": [{"id": str(s.id), "stop_name": s.stop_name, "sequence_number": s.sequence_number, "latitude": s.latitude, "longitude": s.longitude} for s in stops],
            "schedule": {"expected_duration_minutes": route.expected_duration_mins if route else 0},
            "assignment_status": driver_assign.assignment_status.value,
            "route_status": "NOT_STARTED"
        }

assignment_service = AssignmentService()
