from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.route_repository import route_repository
from app.schemas.route import RouteCreate, RouteUpdate, RouteCompleteCreate
from app.models.route import Route
from app.models.stop import Stop
from app.models.bus import Bus
from app.models.assignment import DriverAssignment
from app.models.event import DomainEvent
from app.models.enums import AssignmentStatus
from app.core.exceptions import EntityNotFoundException, BusinessRuleException
from app.services.event_service import event_service
from datetime import datetime, timezone
import uuid

class RouteService:
    async def validate_driver_conflicts(self, db: AsyncSession, driver_id: uuid.UUID, schedules: list[RouteScheduleCreate]):
        # Prevent assigning a driver if they already have an active assignment.
        # Advanced checking: if they have an active assignment, check if its schedules overlap with the requested schedules.
        # For simplicity in this P0 scope, we'll block it if they have an active assignment to a different route.
        stmt = select(DriverAssignment).where(
            DriverAssignment.driver_id == driver_id,
            DriverAssignment.assignment_status == AssignmentStatus.ACTIVE,
            DriverAssignment.is_deleted == False
        )
        active_driver = await db.scalar(stmt)
        if active_driver:
            raise BusinessRuleException("Driver already has an active assignment. Schedule overlap checking is required for multiple assignments.")

    async def validate_bus_conflicts(self, db: AsyncSession, bus_id: uuid.UUID):
        # Check if bus is actively assigned
        bus = await db.scalar(select(Bus).where(Bus.id == bus_id, Bus.is_deleted == False))
        if not bus:
            raise EntityNotFoundException("Bus", str(bus_id))
        if bus.current_route_id:
            raise BusinessRuleException("Bus is already assigned to a route.")
        return bus

    async def validate_schedule_conflicts(self, db: AsyncSession, schedules: list[RouteScheduleCreate]):
        # Ensure that no two schedules provided in the same request overlap
        # E.g. 08:00-09:00 and 08:15-09:15
        from datetime import datetime
        for i in range(len(schedules)):
            for j in range(i + 1, len(schedules)):
                s1 = schedules[i]
                s2 = schedules[j]
                # If they share any recurring days
                if set(s1.recurring_days).intersection(set(s2.recurring_days)):
                    t1_start = datetime.strptime(s1.start_time, "%H:%M").time()
                    t1_end = datetime.strptime(s1.end_time, "%H:%M").time()
                    t2_start = datetime.strptime(s2.start_time, "%H:%M").time()
                    t2_end = datetime.strptime(s2.end_time, "%H:%M").time()
                    
                    # Check overlap: (StartA <= EndB) and (EndA >= StartB)
                    if t1_start <= t2_end and t1_end >= t2_start:
                        raise BusinessRuleException(f"Schedule overlap detected between {s1.start_time}-{s1.end_time} and {s2.start_time}-{s2.end_time}.")

    async def create_wizard_route(self, db: AsyncSession, data: RouteWizardCreate, user_id: uuid.UUID) -> Route:
        # Validations
        if len(data.stops) < 2 or len(data.stops) > 100:
            raise BusinessRuleException("Route must have between 2 and 100 stops.")
            
        existing_route = await route_repository.get_by_code(db, data.route.route_code)
        if existing_route:
            raise BusinessRuleException(f"Route with code {data.route.route_code} already exists.")
            
        await self.validate_schedule_conflicts(db, data.schedules)
        
        bus = None
        if data.bus_id:
            bus = await self.validate_bus_conflicts(db, data.bus_id)
                
        if data.driver_id:
            if not data.bus_id:
                raise BusinessRuleException("Cannot assign driver without assigning a bus.")
            await self.validate_driver_conflicts(db, data.driver_id, data.schedules)
        
        try:
            # 1. Create Route
            route_in = data.route.model_dump()
            route_in["id"] = uuid.uuid4()
            route_in["created_by"] = user_id
            route_in["updated_by"] = user_id
            route = Route(**route_in)
            db.add(route)
            
            # 2. Create RouteVersion
            from app.models.route import RouteVersion
            route_version = RouteVersion(
                id=uuid.uuid4(),
                route_id=route.id,
                version_number=1,
                status="ACTIVE",
                created_by=user_id,
                updated_by=user_id
            )
            db.add(route_version)
            
            # 3. Create Schedules
            from app.models.schedule import RouteSchedule
            from datetime import datetime
            for sched in data.schedules:
                db_sched = RouteSchedule(
                    id=uuid.uuid4(),
                    route_id=route.id,
                    start_time=datetime.strptime(sched.start_time, "%H:%M").time(),
                    end_time=datetime.strptime(sched.end_time, "%H:%M").time(),
                    recurring_days=sched.recurring_days,
                    created_by=user_id,
                    updated_by=user_id
                )
                db.add(db_sched)
            
            # 4. Create Stops and StopVersions
            from app.models.stop import StopVersion
            for stop_data in data.stops:
                stop_in = stop_data.model_dump()
                stop_in["id"] = uuid.uuid4()
                stop_in["route_id"] = route.id
                stop_in["created_by"] = user_id
                stop_in["updated_by"] = user_id
                db.add(Stop(**stop_in))
                
                # Snapshot into StopVersion
                stop_v = StopVersion(
                    id=uuid.uuid4(),
                    route_version_id=route_version.id,
                    stop_name=stop_in["stop_name"],
                    latitude=stop_in["latitude"],
                    longitude=stop_in["longitude"],
                    sequence_number=stop_in["sequence_number"],
                    geofence_radius_meters=stop_in["geofence_radius_meters"],
                    estimated_arrival_time=stop_in.get("estimated_arrival_time"),
                    created_by=user_id,
                    updated_by=user_id
                )
                db.add(stop_v)
                
            # 5. Assign Bus
            if data.bus_id and bus:
                bus.current_route_id = route.id
                bus.updated_by = user_id
                db.add(bus)
                
            # 6. Assign Driver
            if data.driver_id and data.bus_id:
                assignment = DriverAssignment(
                    id=uuid.uuid4(),
                    driver_id=data.driver_id,
                    bus_id=data.bus_id,
                    assignment_status=AssignmentStatus.ACTIVE,
                    valid_from=datetime.now(timezone.utc),
                    created_by=user_id,
                    updated_by=user_id
                )
                db.add(assignment)
                
            # 7. Domain Events
            events = [
                DomainEvent(id=uuid.uuid4(), event_type="ROUTE_CREATED", payload={"route_id": str(route.id)}),
                DomainEvent(id=uuid.uuid4(), event_type="STOPS_CREATED", payload={"route_id": str(route.id), "count": len(data.stops)})
            ]
            if len(data.schedules) > 0:
                events.append(DomainEvent(id=uuid.uuid4(), event_type="SCHEDULE_CREATED", payload={"route_id": str(route.id), "count": len(data.schedules)}))
            if data.bus_id:
                events.append(DomainEvent(id=uuid.uuid4(), event_type="BUS_ASSIGNED", payload={"bus_id": str(data.bus_id), "route_id": str(route.id)}))
            if data.driver_id:
                events.append(DomainEvent(id=uuid.uuid4(), event_type="DRIVER_ASSIGNED", payload={"driver_id": str(data.driver_id), "bus_id": str(data.bus_id)}))
                
            for event in events:
                db.add(event)
                
            # Commit once
            await db.commit()
            await db.refresh(route)
            return route
        except Exception as e:
            await db.rollback()
            raise e
    async def activate_version(self, db: AsyncSession, route_id: uuid.UUID, version_id: uuid.UUID, user_id: uuid.UUID):
        from app.models.route import RouteVersion
        from sqlalchemy import delete
        
        # Get the new version
        new_version = await db.scalar(select(RouteVersion).where(RouteVersion.id == version_id, RouteVersion.route_id == route_id))
        if not new_version:
            raise EntityNotFoundException("RouteVersion", str(version_id))
            
        # Archive current active versions
        active_versions = await db.scalars(select(RouteVersion).where(RouteVersion.route_id == route_id, RouteVersion.status == "ACTIVE"))
        for v in active_versions:
            v.status = "ARCHIVED"
            v.updated_by = user_id
            db.add(v)
            
        # Activate new version
        new_version.status = "ACTIVE"
        new_version.updated_by = user_id
        db.add(new_version)
        
        # Delete existing stops for this route
        await db.execute(delete(Stop).where(Stop.route_id == route_id))
        
        # Load stops from version
        from app.models.stop import StopVersion
        version_stops = await db.scalars(select(StopVersion).where(StopVersion.route_version_id == version_id).order_by(StopVersion.sequence_number))
        
        for vs in version_stops:
            stop = Stop(
                id=uuid.uuid4(),
                route_id=route_id,
                stop_name=vs.stop_name,
                latitude=vs.latitude,
                longitude=vs.longitude,
                sequence_number=vs.sequence_number,
                geofence_radius_meters=vs.geofence_radius_meters,
                estimated_arrival_time=vs.estimated_arrival_time,
                created_by=user_id,
                updated_by=user_id
            )
            db.add(stop)
            
        await event_service.publish(db, "ROUTE_VERSION_ACTIVATED", {"route_id": str(route_id), "version_id": str(version_id)})
        await db.commit()
        return {"status": "success", "message": f"Version {new_version.version_number} activated."}

    async def create_route(self, db: AsyncSession, data: RouteCreate, user_id: uuid.UUID) -> Route:
        existing = await route_repository.get_by_code(db, data.route_code)
        if existing:
            raise BusinessRuleException(f"Route with code {data.route_code} already exists.")
        
        route = await route_repository.create(db, obj_in=data.model_dump(), created_by=user_id)
        
        await event_service.publish(db, "ROUTE_CREATED", {"route_id": str(route.id), "route_code": route.route_code})
        return route

    async def get_route(self, db: AsyncSession, id: uuid.UUID) -> Route:
        route = await route_repository.get(db, id)
        if not route:
            raise EntityNotFoundException("Route", str(id))
        return route

    async def get_routes(self, db: AsyncSession, skip: int, limit: int):
        return await route_repository.get_multi(db, skip=skip, limit=limit)

    async def update_route(self, db: AsyncSession, id: uuid.UUID, data: RouteUpdate, user_id: uuid.UUID) -> Route:
        route = await self.get_route(db, id)
        
        if data.route_code and data.route_code != route.route_code:
            existing = await route_repository.get_by_code(db, data.route_code)
            if existing:
                raise BusinessRuleException("Route code already in use.")
                
        updated = await route_repository.update(db, db_obj=route, obj_in=data.model_dump(exclude_unset=True), updated_by=user_id)
        await event_service.publish(db, "ROUTE_UPDATED", {"route_id": str(updated.id)})
        return updated

    async def delete_route(self, db: AsyncSession, id: uuid.UUID, user_id: uuid.UUID):
        await self.get_route(db, id)
        await route_repository.soft_delete(db, id=id, deleted_by=user_id)
        await event_service.publish(db, "ROUTE_DELETED", {"route_id": str(id)})

    async def clone_route(self, db: AsyncSession, id: uuid.UUID, user_id: uuid.UUID):
        # 1. Fetch original route and its active version
        original = await self.get_route(db, id)
        
        # We need stops from the active version
        from app.models.route import RouteVersion
        from app.models.stop import StopVersion
        from app.models.schedule import RouteSchedule
        
        active_version = await db.scalar(select(RouteVersion).where(RouteVersion.route_id == id, RouteVersion.status == "ACTIVE"))
        
        # Create new route
        new_route_id = uuid.uuid4()
        new_route_code = original.route_code + "_COPY"
        # Validate uniqueness
        if await route_repository.get_by_code(db, new_route_code):
            new_route_code += "_" + str(uuid.uuid4())[:4]
            
        new_route = Route(
            id=new_route_id,
            route_name=original.route_name + " (Copy)",
            route_code=new_route_code,
            start_location=original.start_location,
            end_location=original.end_location,
            expected_duration_mins=original.expected_duration_mins,
            created_by=user_id,
            updated_by=user_id
        )
        db.add(new_route)
        
        new_version_id = uuid.uuid4()
        new_version = RouteVersion(
            id=new_version_id,
            route_id=new_route_id,
            version_number=1,
            status="ACTIVE",
            created_by=user_id,
            updated_by=user_id
        )
        db.add(new_version)
        
        # Clone schedules
        schedules = await db.scalars(select(RouteSchedule).where(RouteSchedule.route_id == id))
        for s in schedules:
            db.add(RouteSchedule(
                id=uuid.uuid4(),
                route_id=new_route_id,
                start_time=s.start_time,
                end_time=s.end_time,
                recurring_days=s.recurring_days,
                created_by=user_id,
                updated_by=user_id
            ))
            
        # Clone stops
        if active_version:
            stops = await db.scalars(select(StopVersion).where(StopVersion.route_version_id == active_version.id))
            for st in stops:
                # Add to Stop
                db.add(Stop(
                    id=uuid.uuid4(),
                    route_id=new_route_id,
                    stop_name=st.stop_name,
                    latitude=st.latitude,
                    longitude=st.longitude,
                    sequence_number=st.sequence_number,
                    geofence_radius_meters=st.geofence_radius_meters,
                    estimated_arrival_time=st.estimated_arrival_time,
                    created_by=user_id,
                    updated_by=user_id
                ))
                # Add to StopVersion
                db.add(StopVersion(
                    id=uuid.uuid4(),
                    route_version_id=new_version_id,
                    stop_name=st.stop_name,
                    latitude=st.latitude,
                    longitude=st.longitude,
                    sequence_number=st.sequence_number,
                    geofence_radius_meters=st.geofence_radius_meters,
                    estimated_arrival_time=st.estimated_arrival_time,
                    created_by=user_id,
                    updated_by=user_id
                ))
        
        await event_service.publish(db, "ROUTE_CLONED", {"original_route_id": str(id), "new_route_id": str(new_route_id)})
        await db.commit()
        await db.refresh(new_route)
        return new_route

    async def create_draft_version(self, db: AsyncSession, id: uuid.UUID, data: RouteWizardCreate, user_id: uuid.UUID):
        # Creates a DRAFT RouteVersion for an existing route. 
        # This will contain modified stops.
        # This allows admins to edit a route without applying it instantly.
        route = await self.get_route(db, id)
        
        from app.models.route import RouteVersion
        from sqlalchemy import func
        
        # Get max version number
        max_ver = await db.scalar(select(func.max(RouteVersion.version_number)).where(RouteVersion.route_id == id)) or 0
        
        new_version_id = uuid.uuid4()
        draft_version = RouteVersion(
            id=new_version_id,
            route_id=id,
            version_number=max_ver + 1,
            status="DRAFT",
            created_by=user_id,
            updated_by=user_id
        )
        db.add(draft_version)
        
        from app.models.stop import StopVersion
        for stop_data in data.stops:
            stop_in = stop_data.model_dump()
            db.add(StopVersion(
                id=uuid.uuid4(),
                route_version_id=new_version_id,
                stop_name=stop_in["stop_name"],
                latitude=stop_in["latitude"],
                longitude=stop_in["longitude"],
                sequence_number=stop_in["sequence_number"],
                geofence_radius_meters=stop_in["geofence_radius_meters"],
                estimated_arrival_time=stop_in.get("estimated_arrival_time"),
                created_by=user_id,
                updated_by=user_id
            ))
            
        await db.commit()
        return {"status": "success", "message": "Draft version created.", "version_id": str(new_version_id)}

route_service = RouteService()
