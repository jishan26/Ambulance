
from fastapi import FastAPI, Response, APIRouter, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, List
import ambulancefinderservice
from fastapi.middleware.cors import CORSMiddleware
import location_service
import json
from datetime import datetime
from db import get_session, engine
# import models
from models import Driver, Rider, TripRequest, DriverResponse, OngoingTrip, Notification, Hospital
from sqlmodel import SQLModel
from db import engine
import models
from authservice import create_user, authenticate_user, get_current_user, get_current_user_flexible
from schema import (
    SignupRequest,
    SignupResponse,
    LoginRequest,
    LoginResponse,
    ErrorResponse,
    NearbyDriversRequest,
    DriverLocationResponse
)
from schema import TokenData
from driver_location_service import driver_location_service

# WebSocket Connection Manager


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

        self.user_connections: Dict[int, str] = {}

        self.user_info: Dict[int, dict] = {}

        self.driver_locations: Dict[int, dict] = {}

    async def connect(self, websocket: WebSocket, connection_id: str, user_id: int = None, user_role: str = None):

        self.active_connections[connection_id] = websocket
        if user_id:
            self.user_connections[user_id] = connection_id
            self.user_info[user_id] = {
                "role": user_role, "connection_id": connection_id}

    def disconnect(self, connection_id: str, user_id: int = None):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
            if user_id in self.user_info:
                del self.user_info[user_id]

            if user_id in self.driver_locations:
                del self.driver_locations[user_id]

    async def send_personal_message(self, message: str, connection_id: str):
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            await websocket.send_text(message)

    async def send_to_user(self, message: str, user_id):

        user_id_int = int(user_id)
        print(f"🔍 Looking for user connection: {user_id_int}")
        print(
            f"🔍 Available user connections: {list(self.user_connections.keys())}")

        if user_id_int in self.user_connections:
            connection_id = self.user_connections[user_id_int]
            print(
                f"🔍 Found connection for user {user_id_int}: {connection_id}")
            await self.send_personal_message(message, connection_id)
            return True
        else:
            print(f"❌ No connection found for user {user_id_int}")
            return False

    async def broadcast_to_riders(self, message: str):
        """Broadcast message only to riders"""
        for user_id, info in self.user_info.items():
            if info.get("role") == "rider":
                await self.send_to_user(message, user_id)

    async def broadcast(self, message: str):
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message)
            except:
                # Remove disconnected connections
                self.disconnect(connection_id)

    def update_driver_location(self, driver_id: int, latitude: float, longitude: float):
        """Update driver location and return nearby riders"""
        self.driver_locations[driver_id] = {
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": datetime.now().isoformat()
        }
        return self.get_nearby_riders(driver_id, latitude, longitude)

    def get_nearby_riders(self, driver_id: int, latitude: float, longitude: float, radius_km: float = 5.0):

        return [user_id for user_id, info in self.user_info.items() if info.get("role") == "rider"]

    def get_all_driver_locations(self):

        return self.driver_locations


manager = ConnectionManager()


async def save_notification_to_db(notification_data: dict):

    try:
        from db import SessionLocal
        session = SessionLocal()

        print(f"💾 Inserting notification into database...")
        print(
            f"   - Recipient: {notification_data.get('recipient_id')} ({notification_data.get('recipient_type')})")
        print(
            f"   - Sender: {notification_data.get('sender_id')} ({notification_data.get('sender_type')})")
        print(f"   - Type: {notification_data.get('notification_type')}")
        print(f"   - Amount: ৳{notification_data.get('bid_amount')}")
        print(f"   - Trip ID: {notification_data.get('trip_id')}")

        notification = Notification(
            recipient_id=notification_data.get("recipient_id"),
            recipient_type=notification_data.get("recipient_type", "rider"),
            sender_id=notification_data.get("sender_id"),
            sender_type=notification_data.get("sender_type", "driver"),
            notification_type=notification_data.get(
                "notification_type", "bid"),
            title=notification_data.get("title"),
            message=notification_data.get("message"),
            req_id=notification_data.get("req_id"),
            trip_id=notification_data.get("trip_id"),
            bid_amount=notification_data.get("bid_amount"),
            original_amount=notification_data.get("original_amount"),
            pickup_location=notification_data.get("pickup_location"),
            destination=notification_data.get("destination"),
            driver_name=notification_data.get("driver_name"),
            driver_mobile=notification_data.get("driver_mobile"),
            rider_name=notification_data.get("rider_name"),
            status="unread"
        )

        session.add(notification)
        session.commit()
        notification_id = notification.notification_id
        session.close()

        print(
            f"✅ Notification successfully inserted into database with ID: {notification_id}")
        return notification_id
    except Exception as e:
        print(f"❌ Error saving notification to database: {str(e)}")
        if 'session' in locals():
            session.rollback()
            session.close()
        return None

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.100:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Update notification status


@app.put("/notifications/{notification_id}/status")
async def update_notification_status(
    notification_id: int,
    payload: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Update the status of a notification (e.g., accepted, declined, read)."""
    try:
        from models import Notification
        new_status = payload.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Missing status")

        notification = session.query(Notification).filter(
            Notification.notification_id == notification_id
        ).first()

        if not notification:
            raise HTTPException(
                status_code=404, detail="Notification not found")

        # Optional: authorization check (recipient can change its notifications)
        if notification.recipient_id != current_user.sub:
            # Allow driver/rider roles to update if needed; relax if cross-role flows required
            pass

        notification.status = new_status
        session.commit()
        session.refresh(notification)

        return {
            "success": True,
            "notification_id": notification.notification_id,
            "status": notification.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error updating notification status: {str(e)}")


SQLModel.metadata.create_all(engine)
# router = APIRouter()


@app.get("/")
def read_root():
    return {"message": "Rapid Rescue API is running", "status": "healthy"}


@app.post("/hospitals")
def create_hospital(
    payload: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session),
):
    try:
        rider_id = int(payload.get("rider_id"))
        name = payload.get("name") or payload.get("hospital")
        latitude = float(payload.get("latitude"))
        longitude = float(payload.get("longitude"))
        if not rider_id or not name or latitude is None or longitude is None:
            raise HTTPException(
                status_code=400, detail="Missing required fields")

        h = Hospital(rider_id=rider_id, name=name,
                     latitude=latitude, longitude=longitude)
        session.add(h)
        session.commit()
        session.refresh(h)
        return {
            "success": True,
            "hospital_id": h.id,
            "data": {
                "id": h.id,
                "rider_id": h.rider_id,
                "name": h.name,
                "latitude": h.latitude,
                "longitude": h.longitude,
                "timestamp": h.timestamp.isoformat(),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/hospitals")
def list_hospitals(rider_id: int | None = None, session: Session = Depends(get_session)):
    try:
        q = session.query(Hospital)
        if rider_id is not None:
            q = q.filter(Hospital.rider_id == rider_id)
        rows = q.order_by(Hospital.timestamp.desc()).all()
        return [
            {
                "id": r.id,
                "rider_id": r.rider_id,
                "name": r.name,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "timestamp": r.timestamp.isoformat(),
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/hospitals/{hospital_id}")
def delete_hospital(hospital_id: int, session: Session = Depends(get_session)):
    try:
        row = session.query(Hospital).filter(
            Hospital.id == hospital_id).first()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        session.delete(row)
        session.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/drivers/count")
def get_driver_count(session: Session = Depends(get_session)):
    """Get real-time count of available and total drivers."""
    try:
        from models import Driver

        # Get count of available drivers
        available_drivers = session.query(Driver).filter(
            Driver.is_available == True
        ).count()

        # Get total drivers count
        total_drivers = session.query(Driver).count()

        print(
            f"🚑 Found {available_drivers} available drivers out of {total_drivers} total drivers")

        return {
            "success": True,
            "available_count": available_drivers,
            "total_count": total_drivers,
            "timestamp": datetime.now().isoformat(),
            "message": f"Found {available_drivers} available drivers out of {total_drivers} total drivers"
        }
    except Exception as e:
        print(f"❌ Error getting driver count: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error getting driver count: {str(e)}")


@app.get("/drivers/available-count")
def get_available_drivers_count(session: Session = Depends(get_session)):
    """Get count of available drivers based on is_available column."""
    try:
        from models import Driver

        # Count available drivers (is_available = True)
        available_count = session.query(Driver).filter(
            Driver.is_available == True).count()

        # Count total drivers for comparison
        total_count = session.query(Driver).count()

        # Count unavailable drivers
        unavailable_count = total_count - available_count

        return {
            "available_drivers": available_count,
            "unavailable_drivers": unavailable_count,
            "total_drivers": total_count,
            "message": f"Found {available_count} available drivers out of {total_count} total drivers"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting available drivers count: {str(e)}")


@app.get("/drivers/available")
def get_available_drivers(session: Session = Depends(get_session)):
    """Get list of all available drivers."""
    try:
        from models import Driver

        # Get all available drivers
        available_drivers = session.query(Driver).filter(
            Driver.is_available == True).all()

        # Convert to list of dictionaries
        drivers_list = []
        for driver in available_drivers:
            drivers_list.append({
                "driver_id": driver.driver_id,
                "name": driver.name,
                "email": driver.email,
                "mobile": driver.mobile,
                "ratings": driver.ratings,
                "is_available": driver.is_available
            })

        return {
            "available_drivers": drivers_list,
            "count": len(drivers_list),
            "message": f"Found {len(drivers_list)} available drivers"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting available drivers: {str(e)}")


@app.put("/drivers/availability")
async def update_driver_availability(
    availability_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Update driver availability status."""
    try:
        if current_user.role != "driver":
            raise HTTPException(
                status_code=403, detail="Only drivers can update availability"
            )

        is_available = availability_data.get("is_available", False)

        # Update driver availability in database
        driver = session.query(Driver).filter(
            Driver.driver_id == current_user.sub
        ).first()

        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

        driver.is_available = is_available
        session.commit()

        print(
            f"✅ Driver {current_user.sub} availability updated to: {is_available}")

        return {
            "success": True,
            "message": f"Driver availability updated to {is_available}",
            "driver_id": current_user.sub,
            "is_available": is_available
        }

    except Exception as e:
        session.rollback()
        print(f"❌ Error updating driver availability: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error updating driver availability: {str(e)}"
        )


@app.post(
    "/auth/signup",
    response_model=SignupResponse,
    status_code=201
)
async def signup(user: SignupRequest, session: Session = Depends(get_session)):
    """
    Handles user signup for drivers or riders.
    """
    return create_user(session, user_data=user.dict())


@app.post(
    "/auth/login",
    response_model=LoginResponse,
    status_code=200
)
async def login(
    credentials: LoginRequest,
    response: Response,
    session: Session = Depends(get_session)
):
    """
    Handles login for drivers or riders.
    Returns JWT token on successful authentication.
    """
    return authenticate_user(
        session,
        credentials.phone_or_email,
        credentials.password,
        credentials.user_type,
        response
    )


@app.get("/auth/validate-token")
async def validate_token(current_user: TokenData = Depends(get_current_user_flexible)):
    """
    Validates a JWT token and returns user info.
    Supports both Bearer token and cookie authentication.
    """
    return {
        "valid": True,
        "id": int(current_user.sub),
        "name": current_user.name,
        "role": current_user.role,
        "email": current_user.email,
        "mobile": current_user.mobile
    }


@app.delete("/auth/logout")
async def logout(
    response: Response,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """
    Logout endpoint that clears the authentication cookie and sets driver as unavailable.
    """
    try:
        # If it's a driver, set them as unavailable when they log out
        if current_user.role == "driver":
            driver = session.query(Driver).filter(
                Driver.driver_id == current_user.sub
            ).first()

            if driver and hasattr(driver, 'is_available'):
                driver.is_available = False
                session.commit()
                print(
                    f"✅ Driver {current_user.sub} set as unavailable on logout")
    except Exception as e:
        print(f"❌ Error setting driver as unavailable: {str(e)}")
        # Don't fail the logout if this fails

    # Create a response that clears the access_token cookie
    response.delete_cookie(
        key="auth_token",
        path="/",
        secure=False,
        httponly=True,
        samesite="lax"
    )

    return {"message": "Successfully logged out"}


# Trip Request Endpoints
@app.post("/trip-requests")
async def create_trip_request(
    request_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Create a new trip request."""
    try:
        # Create trip request in database
        trip_request = TripRequest(
            rider_id=current_user.sub,
            pickup_location=request_data.get("pickup_location"),
            destination=request_data.get("destination"),
            fare=request_data.get("fare"),
            latitude=request_data.get("latitude"),
            longitude=request_data.get("longitude"),
            status="pending"
        )

        session.add(trip_request)
        session.commit()
        session.refresh(trip_request)

        # Fetch rider for display name
        rider = session.query(Rider).filter(
            Rider.rider_id == trip_request.rider_id).first()

        # Broadcast to all drivers via WebSocket
        await manager.broadcast(json.dumps({
            "type": "new-trip-request",
            "data": {
                "req_id": trip_request.req_id,
                "rider_id": trip_request.rider_id,
                "rider_name": rider.name if rider else None,
                "pickup_location": trip_request.pickup_location,
                "destination": trip_request.destination,
                "fare": trip_request.fare,
                "latitude": trip_request.latitude,
                "longitude": trip_request.longitude,
                "timestamp": trip_request.timestamp.isoformat(),
                "status": trip_request.status
            }
        }))

        return {
            "success": True,
            "req_id": trip_request.req_id,
            "message": "Trip request created successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error creating trip request: {str(e)}")


@app.get("/trip-requests")
async def get_trip_requests(
    request: Request,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Get trip requests for the current user."""
    try:
        if current_user.role == "rider":
            # Get rider's trip requests
            requests = session.query(TripRequest).filter(
                TripRequest.rider_id == int(current_user.sub)
            ).all()
        else:
            # Get all pending trip requests for drivers (exclude those already responded to by this driver)
            requests = session.query(TripRequest).filter(
                TripRequest.status == "pending"
            ).outerjoin(
                DriverResponse,
                (TripRequest.req_id == DriverResponse.req_id) &
                (DriverResponse.driver_id == int(current_user.sub))
            ).filter(
                # No response from this driver yet
                DriverResponse.response_id.is_(None)
            ).all()

        # Get rider information for each request
        requests_with_rider_info = []
        for req in requests:
            # Get rider name
            rider = session.query(Rider).filter(
                Rider.rider_id == req.rider_id).first()
            rider_name = rider.name if rider else f"Rider {req.rider_id}"

            requests_with_rider_info.append({
                "req_id": req.req_id,
                "rider_id": req.rider_id,
                "rider_name": rider_name,
                "pickup_location": req.pickup_location,
                "destination": req.destination,
                "fare": req.fare,
                "latitude": req.latitude,
                "longitude": req.longitude,
                "timestamp": req.timestamp.isoformat(),
                "status": req.status
            })

        return {
            "success": True,
            "requests": requests_with_rider_info
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting trip requests: {str(e)}")


@app.post("/trip-requests/{req_id}/decline")
async def decline_trip_request(
    req_id: int,
    request: Request,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Permanently decline a trip request."""
    try:
        # Only drivers can decline requests
        if current_user.role != "driver":
            raise HTTPException(
                status_code=403,
                detail="Only drivers can decline trip requests"
            )

        # Find the trip request
        trip_request = session.query(TripRequest).filter(
            TripRequest.req_id == req_id
        ).first()

        if not trip_request:
            raise HTTPException(
                status_code=404,
                detail="Trip request not found"
            )

        # Check if request is still pending
        if trip_request.status != "pending":
            raise HTTPException(
                status_code=400,
                detail=f"Trip request is already {trip_request.status}"
            )

        # Check if this driver has already responded to this request
        existing_response = session.query(DriverResponse).filter(
            DriverResponse.req_id == req_id,
            DriverResponse.driver_id == int(current_user.sub)
        ).first()

        if existing_response:
            raise HTTPException(
                status_code=400,
                detail="You have already responded to this trip request"
            )

        # Get driver information
        driver = session.query(Driver).filter(
            Driver.driver_id == int(current_user.sub)
        ).first()

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found"
            )

        # Create driver response record (decline)
        driver_response = DriverResponse(
            req_id=req_id,
            driver_id=int(current_user.sub),
            driver_name=driver.name,
            driver_mobile=driver.mobile,
            amount=0.0,  # No bid amount for decline
            rating=driver.ratings or 0.0,  # Use driver's rating
            vehicle="",  # No vehicle for decline
            eta="",  # No ETA for decline
            specialty="",  # No specialty for decline
            status="declined"  # Mark as declined
        )
        session.add(driver_response)
        session.commit()

        print(
            f"🚫 Driver {current_user.sub} declined trip request {req_id} (per-driver tracking)")

        return {
            "success": True,
            "message": "Trip request declined by this driver",
            "req_id": req_id,
            "status": "declined_by_driver"
        }

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"❌ Error declining trip request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error declining trip request: {str(e)}"
        )


@app.post("/driver-responses")
async def create_driver_response(
    response_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Create a driver response to a trip request."""
    try:
        if current_user.role != "driver":
            raise HTTPException(
                status_code=403, detail="Only drivers can create responses")

        # Create driver response in database
        driver_response = DriverResponse(
            req_id=response_data.get("req_id"),
            driver_id=current_user.sub,
            driver_name=response_data.get("driver_name"),
            driver_mobile=response_data.get("driver_mobile"),
            amount=response_data.get("amount"),
            rating=response_data.get("rating", 4.5),
            vehicle=response_data.get("vehicle"),
            eta=response_data.get("eta"),
            specialty=response_data.get("specialty"),
            status="pending"
        )

        session.add(driver_response)
        session.commit()
        session.refresh(driver_response)

        # Get rider ID from trip request
        trip_request = session.query(TripRequest).filter(
            TripRequest.req_id == response_data.get("req_id")
        ).first()

        if trip_request:
            # Send response to rider via WebSocket
            await manager.send_to_user(json.dumps({
                "type": "bid-from-driver",
                "data": {
                    "response_id": driver_response.response_id,
                    "req_id": driver_response.req_id,
                    "driver_id": driver_response.driver_id,
                    "driver_name": driver_response.driver_name,
                    "driver_mobile": driver_response.driver_mobile,
                    "amount": driver_response.amount,
                    "rating": driver_response.rating,
                    "vehicle": driver_response.vehicle,
                    "eta": driver_response.eta,
                    "specialty": driver_response.specialty,
                    "status": driver_response.status,
                    "timestamp": driver_response.timestamp.isoformat()
                }
            }), trip_request.rider_id)

        return {
            "success": True,
            "response_id": driver_response.response_id,
            "message": "Driver response created successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error creating driver response: {str(e)}")


@app.get("/driver-responses")
async def get_driver_responses(
    req_id: int,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Get driver responses for a specific trip request."""
    try:
        responses = session.query(DriverResponse).filter(
            DriverResponse.req_id == req_id
        ).all()

        return {
            "success": True,
            "responses": [
                {
                    "response_id": resp.response_id,
                    "req_id": resp.req_id,
                    "driver_id": resp.driver_id,
                    "driver_name": resp.driver_name,
                    "driver_mobile": resp.driver_mobile,
                    "amount": resp.amount,
                    "rating": resp.rating,
                    "vehicle": resp.vehicle,
                    "eta": resp.eta,
                    "specialty": resp.specialty,
                    "status": resp.status,
                    "timestamp": resp.timestamp.isoformat()
                }
                for resp in responses
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting driver responses: {str(e)}")


@app.post("/ongoing-trips")
async def create_ongoing_trip(
    trip_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Create an ongoing trip."""
    try:
        # Create ongoing trip in database
        ongoing_trip = OngoingTrip(
            req_id=trip_data.get("req_id"),
            rider_id=trip_data.get("rider_id"),
            driver_id=trip_data.get("driver_id"),
            pickup_location=trip_data.get("pickup_location"),
            destination=trip_data.get("destination"),
            fare=trip_data.get("fare"),
            status="ongoing"
        )

        session.add(ongoing_trip)
        session.commit()
        session.refresh(ongoing_trip)

        # Update trip request status
        trip_request = session.query(TripRequest).filter(
            TripRequest.req_id == trip_data.get("req_id")
        ).first()
        if trip_request:
            trip_request.status = "accepted"
            session.commit()

        # Notify both rider and driver
        await manager.send_to_user(json.dumps({
            "type": "trip-confirmed",
            "data": {
                "trip_id": ongoing_trip.trip_id,
                "req_id": ongoing_trip.req_id,
                "rider_id": ongoing_trip.rider_id,
                "driver_id": ongoing_trip.driver_id,
                "pickup_location": ongoing_trip.pickup_location,
                "destination": ongoing_trip.destination,
                "fare": ongoing_trip.fare,
                "status": ongoing_trip.status,
                "start_time": ongoing_trip.start_time.isoformat()
            }
        }), ongoing_trip.rider_id)

        await manager.send_to_user(json.dumps({
            "type": "trip-confirmed",
            "data": {
                "trip_id": ongoing_trip.trip_id,
                "req_id": ongoing_trip.req_id,
                "rider_id": ongoing_trip.rider_id,
                "driver_id": ongoing_trip.driver_id,
                "pickup_location": ongoing_trip.pickup_location,
                "destination": ongoing_trip.destination,
                "fare": ongoing_trip.fare,
                "status": ongoing_trip.status,
                "start_time": ongoing_trip.start_time.isoformat()
            }
        }), ongoing_trip.driver_id)

        return {
            "success": True,
            "trip_id": ongoing_trip.trip_id,
            "message": "Ongoing trip created successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error creating ongoing trip: {str(e)}")


@app.get("/ongoing-trips")
async def get_ongoing_trips(
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Get ongoing trips for the current user with latest fare."""
    try:
        if current_user.role == "rider":
            trips = session.query(OngoingTrip).filter(
                OngoingTrip.rider_id == current_user.sub,
                OngoingTrip.status.in_(["ongoing", "pending_confirmation"])
            ).order_by(OngoingTrip.start_time.desc()).all()
        else:
            trips = session.query(OngoingTrip).filter(
                OngoingTrip.driver_id == current_user.sub,
                OngoingTrip.status.in_(["ongoing", "pending_confirmation"])
            ).order_by(OngoingTrip.start_time.desc()).all()

        print(
            f"🔍 Debug: Found {len(trips)} trips for user {current_user.sub} (role: {current_user.role})")
        for trip in trips:
            print(
                f"   Trip {trip.trip_id}: rider={trip.rider_id}, driver={trip.driver_id}, status={trip.status}, fare={trip.fare}")
            print(
                f"   Rider coords: {trip.rider_latitude}, {trip.rider_longitude}")
            print(
                f"   Driver coords: {trip.driver_latitude}, {trip.driver_longitude}")

        # Get the latest trip for each unique trip_id to ensure we have the most recent fare
        latest_trips = {}
        for trip in trips:
            if trip.trip_id not in latest_trips or trip.start_time > latest_trips[trip.trip_id].start_time:
                latest_trips[trip.trip_id] = trip

        result_trips = []
        for trip in latest_trips.values():
            result_trips.append({
                "trip_id": trip.trip_id,
                "req_id": trip.req_id,
                "rider_id": trip.rider_id,
                "driver_id": trip.driver_id,
                "pickup_location": trip.pickup_location,
                "destination": trip.destination,
                "fare": trip.fare,  # This will now be the latest fare
                "status": trip.status,
                "start_time": trip.start_time.isoformat() if trip.start_time else None,
                "end_time": trip.end_time.isoformat() if trip.end_time else None,
                "rider_latitude": trip.rider_latitude,
                "rider_longitude": trip.rider_longitude,
                "driver_latitude": trip.driver_latitude,
                "driver_longitude": trip.driver_longitude
            })

        print(
            f"🔍 Debug: Returning {len(result_trips)} latest trips with updated fares")
        return result_trips
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting ongoing trips: {str(e)}")


@app.post("/update-trip-fare")
async def update_trip_fare(
    trip_id: int,
    new_fare: float,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Update fare for an ongoing trip and notify both rider and driver."""
    try:
        # Find the ongoing trip
        ongoing_trip = session.query(OngoingTrip).filter(
            OngoingTrip.trip_id == trip_id
        ).first()

        if not ongoing_trip:
            raise HTTPException(
                status_code=404, detail="Ongoing trip not found")

        # Update the fare
        old_fare = ongoing_trip.fare
        ongoing_trip.fare = new_fare
        session.commit()
        session.refresh(ongoing_trip)

        print(f"💰 Updated fare for trip {trip_id}: {old_fare} -> {new_fare}")

        # Send WebSocket notification to both rider and driver
        fare_update_message = {
            "type": "fare-update",
            "data": {
                "trip_id": ongoing_trip.trip_id,
                "fare": ongoing_trip.fare,
                "old_fare": old_fare,
                "pickup_location": ongoing_trip.pickup_location,
                "destination": ongoing_trip.destination,
                "status": ongoing_trip.status,
                "rider_id": ongoing_trip.rider_id,
                "driver_id": ongoing_trip.driver_id,
                "rider_latitude": ongoing_trip.rider_latitude,
                "rider_longitude": ongoing_trip.rider_longitude,
                "driver_latitude": ongoing_trip.driver_latitude,
                "driver_longitude": ongoing_trip.driver_longitude,
                "timestamp": datetime.utcnow().isoformat()
            }
        }

        # Send to rider
        await manager.send_to_user(json.dumps(fare_update_message), ongoing_trip.rider_id)

        # Send to driver
        await manager.send_to_user(json.dumps(fare_update_message), ongoing_trip.driver_id)

        return {
            "success": True,
            "message": "Fare updated successfully",
            "trip_id": ongoing_trip.trip_id,
            "old_fare": old_fare,
            "new_fare": ongoing_trip.fare
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error updating trip fare: {str(e)}")


@app.get("/driver-locations")
async def get_driver_locations(session: Session = Depends(get_session)):
    """Get all driver locations."""
    try:
        from models import DriverLocation
        locations = session.query(DriverLocation).all()
        print(f"🔍 Found {len(locations)} driver locations")

        return [
            {
                "driver_id": location.driver_id,
                "latitude": location.latitude,
                "longitude": location.longitude
            }
            for location in locations
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting driver locations: {str(e)}")


@app.post("/dirde")
async def create_or_update_dirde(
    dirde_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Create or update Dirde record with rider and driver coordinates."""
    try:
        from models import Dirde, TripRequest, DriverLocation

        rider_id = dirde_data.get("rider_id")
        driver_id = dirde_data.get("driver_id")
        req_id = dirde_data.get("req_id")

        print(f"🔍 Creating/updating Dirde record:")
        print(f"   Rider ID: {rider_id}")
        print(f"   Driver ID: {driver_id}")
        print(f"   Request ID: {req_id}")

        # Get rider coordinates from TripRequest
        trip_request = session.query(TripRequest).filter(
            TripRequest.req_id == req_id
        ).first()

        if not trip_request:
            raise HTTPException(
                status_code=404, detail="Trip request not found")

        rider_latitude = trip_request.latitude
        rider_longitude = trip_request.longitude

        # Get driver coordinates from DriverLocation
        driver_location = session.query(DriverLocation).filter(
            DriverLocation.driver_id == driver_id
        ).first()

        if not driver_location:
            raise HTTPException(
                status_code=404, detail="Driver location not found")

        driver_latitude = driver_location.latitude
        driver_longitude = driver_location.longitude

        print(f"📍 Coordinates:")
        print(f"   Rider: {rider_latitude}, {rider_longitude}")
        print(f"   Driver: {driver_latitude}, {driver_longitude}")

        # Check if Dirde record already exists for this rider-driver pair
        existing_dirde = session.query(Dirde).filter(
            Dirde.rider_id == rider_id,
            Dirde.driver_id == driver_id
        ).first()

        if existing_dirde:
            # Update existing record
            existing_dirde.rider_latitude = rider_latitude
            existing_dirde.rider_longitude = rider_longitude
            existing_dirde.driver_latitude = driver_latitude
            existing_dirde.driver_longitude = driver_longitude
            existing_dirde.timestamp = datetime.utcnow()
            existing_dirde.status = "active"

            session.commit()
            session.refresh(existing_dirde)

            print(
                f"✅ Updated existing Dirde record: {existing_dirde.dirde_id}")
            dirde_id = existing_dirde.dirde_id
        else:
            # Create new record
            new_dirde = Dirde(
                rider_id=rider_id,
                driver_id=driver_id,
                rider_latitude=rider_latitude,
                rider_longitude=rider_longitude,
                driver_latitude=driver_latitude,
                driver_longitude=driver_longitude,
                status="active"
            )

            session.add(new_dirde)
            session.commit()
            session.refresh(new_dirde)

            print(f"✅ Created new Dirde record: {new_dirde.dirde_id}")
            dirde_id = new_dirde.dirde_id

        return {
            "success": True,
            "dirde_id": dirde_id,
            "message": "Dirde record created/updated successfully",
            "coordinates": {
                "rider": {"latitude": rider_latitude, "longitude": rider_longitude},
                "driver": {"latitude": driver_latitude, "longitude": driver_longitude}
            }
        }

    except Exception as e:
        session.rollback()
        print(f"❌ Error creating/updating Dirde: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error creating/updating Dirde: {str(e)}")


@app.put("/dirde/{dirde_id}")
async def update_dirde_coordinates(
    dirde_id: int,
    coordinates_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Update coordinates in existing Dirde record when user moves."""
    try:
        from models import Dirde

        dirde_record = session.query(Dirde).filter(
            Dirde.dirde_id == dirde_id
        ).first()

        if not dirde_record:
            raise HTTPException(
                status_code=404, detail="Dirde record not found")

        # Update coordinates based on user role
        if current_user.role == "rider" and current_user.sub == dirde_record.rider_id:
            dirde_record.rider_latitude = coordinates_data.get("latitude")
            dirde_record.rider_longitude = coordinates_data.get("longitude")
            print(
                f"📍 Updated rider coordinates: {coordinates_data.get('latitude')}, {coordinates_data.get('longitude')}")
        elif current_user.role == "driver" and current_user.sub == dirde_record.driver_id:
            dirde_record.driver_latitude = coordinates_data.get("latitude")
            dirde_record.driver_longitude = coordinates_data.get("longitude")
            print(
                f"📍 Updated driver coordinates: {coordinates_data.get('latitude')}, {coordinates_data.get('longitude')}")
        else:
            raise HTTPException(
                status_code=403, detail="Unauthorized to update this record")

        dirde_record.timestamp = datetime.utcnow()
        session.commit()
        session.refresh(dirde_record)

        return {
            "success": True,
            "message": "Coordinates updated successfully",
            "updated_coordinates": {
                "rider": {"latitude": dirde_record.rider_latitude, "longitude": dirde_record.rider_longitude},
                "driver": {"latitude": dirde_record.driver_latitude, "longitude": dirde_record.driver_longitude}
            }
        }

    except Exception as e:
        session.rollback()
        print(f"❌ Error updating Dirde coordinates: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error updating Dirde coordinates: {str(e)}")


@app.get("/dirde/{rider_id}/{driver_id}")
async def get_dirde_coordinates(
    rider_id: int,
    driver_id: int,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Get Dirde coordinates for specific rider-driver pair."""
    try:
        from models import Dirde

        dirde_record = session.query(Dirde).filter(
            Dirde.rider_id == rider_id,
            Dirde.driver_id == driver_id,
            Dirde.status == "active"
        ).first()

        if not dirde_record:
            return {"message": "No active Dirde record found"}

        return {
            "dirde_id": dirde_record.dirde_id,
            "rider_id": dirde_record.rider_id,
            "driver_id": dirde_record.driver_id,
            "rider_coordinates": {
                "latitude": dirde_record.rider_latitude,
                "longitude": dirde_record.rider_longitude
            },
            "driver_coordinates": {
                "latitude": dirde_record.driver_latitude,
                "longitude": dirde_record.driver_longitude
            },
            "timestamp": dirde_record.timestamp.isoformat(),
            "status": dirde_record.status
        }

    except Exception as e:
        print(f"❌ Error getting Dirde coordinates: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error getting Dirde coordinates: {str(e)}")


@app.get("/dirde")
async def get_all_dirde_records(session: Session = Depends(get_session)):
    """Get all active Dirde records."""
    try:
        from models import Dirde

        dirde_records = session.query(Dirde).filter(
            Dirde.status == "active"
        ).all()

        print(f"🔍 Found {len(dirde_records)} active Dirde records")

        return [
            {
                "dirde_id": record.dirde_id,
                "rider_id": record.rider_id,
                "driver_id": record.driver_id,
                "rider_coordinates": {
                    "latitude": record.rider_latitude,
                    "longitude": record.rider_longitude
                },
                "driver_coordinates": {
                    "latitude": record.driver_latitude,
                    "longitude": record.driver_longitude
                },
                "timestamp": record.timestamp.isoformat(),
                "status": record.status
            }
            for record in dirde_records
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting Dirde records: {str(e)}")


@app.get("/debug/ongoing-trips")
async def debug_ongoing_trips(session: Session = Depends(get_session)):
    """Debug endpoint to see all OngoingTrip records."""
    try:
        all_trips = session.query(OngoingTrip).all()
        print(f"🔍 Debug: Total OngoingTrip records: {len(all_trips)}")

        return {
            "total_trips": len(all_trips),
            "trips": [
                {
                    "trip_id": trip.trip_id,
                    "req_id": trip.req_id,
                    "rider_id": trip.rider_id,
                    "driver_id": trip.driver_id,
                    "pickup_location": trip.pickup_location,
                    "destination": trip.destination,
                    "fare": trip.fare,
                    "status": trip.status,
                    "start_time": trip.start_time.isoformat() if trip.start_time else None,
                    "rider_latitude": trip.rider_latitude,
                    "rider_longitude": trip.rider_longitude,
                    "driver_latitude": trip.driver_latitude,
                    "driver_longitude": trip.driver_longitude
                }
                for trip in all_trips
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting debug ongoing trips: {str(e)}")


@app.post("/debug/create-test-trip")
async def create_test_trip_with_coordinates(session: Session = Depends(get_session)):
    """Create a test trip with coordinates for debugging."""
    try:
        from models import TripRequest, DriverLocation

        # Create a test trip request
        test_trip_request = TripRequest(
            rider_id=1,  # Assuming MD. Rahadul has ID 1
            pickup_location="Test Pickup Location",
            destination="Test Hospital",
            fare=250.0,
            latitude=23.8103,  # Dhaka coordinates
            longitude=90.4125,
            status="pending"
        )
        session.add(test_trip_request)
        session.commit()
        session.refresh(test_trip_request)

        # Create test driver location
        test_driver_location = DriverLocation(
            driver_id=1,  # Assuming driver has ID 1
            latitude=23.815,
            longitude=90.42
        )
        session.add(test_driver_location)
        session.commit()

        # Create test ongoing trip with coordinates
        test_ongoing_trip = OngoingTrip(
            req_id=test_trip_request.req_id,
            rider_id=1,
            driver_id=1,
            pickup_location="Test Pickup Location",
            destination="Test Hospital",
            fare=250.0,
            status="pending_confirmation",
            rider_latitude=23.8103,
            rider_longitude=90.4125,
            driver_latitude=23.815,
            driver_longitude=90.42
        )
        session.add(test_ongoing_trip)
        session.commit()
        session.refresh(test_ongoing_trip)

        print(f"✅ Test trip created:")
        print(f"   Trip ID: {test_ongoing_trip.trip_id}")
        print(
            f"   Rider coordinates: {test_ongoing_trip.rider_latitude}, {test_ongoing_trip.rider_longitude}")
        print(
            f"   Driver coordinates: {test_ongoing_trip.driver_latitude}, {test_ongoing_trip.driver_longitude}")

        return {
            "success": True,
            "message": "Test trip created successfully",
            "trip_id": test_ongoing_trip.trip_id,
            "rider_coords": f"{test_ongoing_trip.rider_latitude}, {test_ongoing_trip.rider_longitude}",
            "driver_coords": f"{test_ongoing_trip.driver_latitude}, {test_ongoing_trip.driver_longitude}"
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error creating test trip: {str(e)}")


@app.put("/ongoing-trips/{trip_id}/end")
async def end_ongoing_trip(
    trip_id: int,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """End an ongoing trip."""
    try:
        trip = session.query(OngoingTrip).filter(
            OngoingTrip.trip_id == trip_id
        ).first()

        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        # Update trip status
        trip.status = "completed"
        trip.end_time = datetime.utcnow()
        session.commit()

        # Notify both rider and driver
        await manager.send_to_user(json.dumps({
            "type": "trip-ended",
            "data": {
                "trip_id": trip.trip_id,
                "status": "completed",
                "end_time": trip.end_time.isoformat()
            }
        }), trip.rider_id)

        await manager.send_to_user(json.dumps({
            "type": "trip-ended",
            "data": {
                "trip_id": trip.trip_id,
                "status": "completed",
                "end_time": trip.end_time.isoformat()
            }
        }), trip.driver_id)

        return {
            "success": True,
            "message": "Trip ended successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error ending trip: {str(e)}")


"""Endpoints for driver location and finding nearby drivers."""


@app.get(
    "/nearby",
    response_model=list[DriverLocationResponse],
    status_code=200
)
def find_nearby_drivers(
    request: NearbyDriversRequest = Depends(),
    db: Session = Depends(get_session)
):
    return ambulancefinderservice.AmbulanceService.find_nearby_drivers(db, request)


# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time communication.
    Supports token authentication via query parameter.
    """
    connection_id = None
    user_id = None

    try:
        # Accept the WebSocket connection
        await websocket.accept()

        # Generate a unique connection ID
        import uuid
        connection_id = str(uuid.uuid4())

        # Get token from query parameters
        token = websocket.query_params.get("token")

        # Authenticate user if token is provided
        if token:
            try:
                from security import verify_token
                payload = verify_token(token)
                user_id = int(payload.get("sub"))
                user_role = payload.get("role", "unknown")

                # Store connection with user info
                await manager.connect(websocket, connection_id, user_id, user_role)

                # Send welcome message
                await websocket.send_text(json.dumps({
                    "type": "connection_established",
                    "message": "WebSocket connected successfully",
                    "user_id": user_id,
                    "user_role": user_role,
                    "connection_id": connection_id
                }))

                # If it's a driver, add them to the location service
                if user_role == "driver":
                    print(
                        f"🚑 Driver {user_id} connected - ready to receive location updates")
                    # Driver will start sending location updates via WebSocket messages

                # If it's a rider, send current driver locations
                if user_role == "rider":
                    # Get drivers from database
                    from sqlmodel import Session, select
                    from models import Driver, DriverLocation

                    with Session(engine) as db:
                        # Get only available drivers with their locations
                        statement = select(Driver, DriverLocation).join(
                            DriverLocation, Driver.driver_id == DriverLocation.driver_id
                        ).filter(Driver.is_available == True)
                        results = db.exec(statement).all()

                        drivers_data = []
                        for driver, location in results:
                            drivers_data.append({
                                "id": driver.driver_id,
                                "latitude": location.latitude,
                                "longitude": location.longitude,
                                "timestamp": datetime.now().isoformat(),
                                "name": driver.name,
                                "status": "available"
                            })

                        print(
                            f"🚑 Found {len(drivers_data)} available drivers from database")

                        await websocket.send_text(json.dumps({
                            "type": "nearby-drivers",
                            "data": drivers_data
                        }))

            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid authentication token"
                }))
                await websocket.close()
                return
        else:
            # Anonymous connection
            await manager.connect(websocket, connection_id)
            await websocket.send_text(json.dumps({
                "type": "connection_established",
                "message": "WebSocket connected successfully (anonymous)",
                "connection_id": connection_id
            }))

        # Listen for messages
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)

                # Handle different message types
                message_type = message_data.get("type", "unknown")

                if message_type == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": message_data.get("timestamp")
                    }))
                elif message_type == "new-client":
                    # Handle new client connection
                    client_data = message_data.get("data", {})
                    client_id = client_data.get("id")
                    client_role = client_data.get("role")
                    client_token = client_data.get("token")

                    await websocket.send_text(json.dumps({
                        "type": "client_registered",
                        "message": f"Client {client_id} ({client_role}) registered successfully",
                        "client_id": client_id,
                        "client_role": client_role
                    }))
                elif message_type == "add-location":
                    # Handle initial location update
                    location_data = message_data.get("data", {})
                    driver_id = location_data.get("driver_id")
                    latitude = location_data.get("latitude")
                    longitude = location_data.get("longitude")

                    # Update driver location using service
                    print(
                        f"🔄 Updating driver {driver_id} location: {latitude}, {longitude}")
                    success = driver_location_service.update_driver_location(
                        driver_id, latitude, longitude)
                    print(f"📊 Update result: {success}")

                    if success:
                        # Acknowledge to driver
                        await websocket.send_text(json.dumps({
                            "type": "location_updated",
                            "message": f"Location updated for driver {driver_id}",
                            "data": {
                                "driver_id": driver_id,
                                "latitude": latitude,
                                "longitude": longitude,
                                "timestamp": message_data.get("timestamp") or datetime.now().isoformat()
                            }
                        }))

                        # Broadcast to all riders
                        driver_location_message = json.dumps({
                            "type": "driver-location",
                            "data": {
                                "driver_id": driver_id,
                                "latitude": latitude,
                                "longitude": longitude,
                                "timestamp": message_data.get("timestamp") or datetime.now().isoformat()
                            }
                        })
                        await manager.broadcast_to_riders(driver_location_message)
                elif message_type == "driver-location":
                    # Handle driver location update from frontend
                    location_data = message_data.get("data", {})
                    driver_id = location_data.get(
                        "id") or location_data.get("driver_id")
                    latitude = location_data.get("latitude")
                    longitude = location_data.get("longitude")

                    if driver_id and latitude and longitude:
                        print(
                            f"🔄 Driver {driver_id} location update: {latitude}, {longitude}")
                        success = driver_location_service.update_driver_location(
                            driver_id, latitude, longitude)
                        print(f"📊 Update result: {success}")

                        if success:
                            # Broadcast to all riders
                            driver_location_message = json.dumps({
                                "type": "driver-location",
                                "data": {
                                    "driver_id": driver_id,
                                    "latitude": latitude,
                                    "longitude": longitude,
                                    "timestamp": datetime.now().isoformat()
                                }
                            })
                            await manager.broadcast_to_riders(driver_location_message)
                elif message_type == "update-location":
                    # Handle location update
                    location_data = message_data.get("data", {})
                    driver_id = location_data.get("driver_id")
                    latitude = location_data.get("latitude")
                    longitude = location_data.get("longitude")

                    # Update driver location using service
                    print(
                        f"🔄 Updating driver {driver_id} location: {latitude}, {longitude}")
                    success = driver_location_service.update_driver_location(
                        driver_id, latitude, longitude)
                    print(f"📊 Update result: {success}")

                    if success:
                        # Acknowledge to driver
                        await websocket.send_text(json.dumps({
                            "type": "location_updated",
                            "message": f"Location updated for driver {driver_id}",
                            "data": {
                                "driver_id": driver_id,
                                "latitude": latitude,
                                "longitude": longitude,
                                "timestamp": message_data.get("timestamp") or datetime.now().isoformat()
                            }
                        }))

                        # Broadcast to all riders
                        driver_location_message = json.dumps({
                            "type": "driver-location",
                            "data": {
                                "driver_id": driver_id,
                                "latitude": latitude,
                                "longitude": longitude,
                                "timestamp": message_data.get("timestamp") or datetime.now().isoformat()
                            }
                        })
                        await manager.broadcast_to_riders(driver_location_message)

                        # Broadcast updated driver list to all riders
                        driver_locations = driver_location_service.get_all_active_drivers()
                        await manager.broadcast_to_riders(json.dumps({
                            "type": "nearby-drivers",
                            "data": [
                                {
                                    "id": driver_id,
                                    "latitude": info["latitude"],
                                    "longitude": info["longitude"],
                                    "timestamp": info["timestamp"]
                                }
                                for driver_id, info in driver_locations.items()
                            ]
                        }))
                elif message_type == "new-trip-request":
                    # Handle new trip request from rider
                    trip_data = message_data.get("data", {})
                    print(
                        f"🚨 New trip request received: {trip_data.get('req_id')}")

                    # Broadcast to all drivers
                    await manager.broadcast(json.dumps({
                        "type": "new-trip-request",
                        "data": trip_data
                    }))

                elif message_type == "bid-from-driver":
                    # Handle driver bid/response
                    bid_data = message_data.get("data", {})
                    print(
                        f"🚑 Driver bid received from driver: {bid_data.get('driver_id')}")
                    print(f"🚑 Bid data: {bid_data}")
                    print(f"🚑 Target rider ID: {bid_data.get('rider_id')}")

                    # Send to specific rider
                    if bid_data.get("rider_id"):
                        message_to_send = json.dumps({
                            "type": "bid-from-driver",
                            "data": bid_data
                        })
                        print(
                            f"🚑 Sending message to rider {bid_data['rider_id']}: {message_to_send}")
                        success = await manager.send_to_user(message_to_send, bid_data["rider_id"])
                        print(f"🚑 Message sent successfully: {success}")
                    else:
                        print("❌ No rider_id in bid data, cannot send message")

                elif message_type == "driver-bid-offer":
                    # Handle driver bid offer
                    bid_data = message_data.get("data", {})
                    print(
                        f"🚑 Driver bid offer: {bid_data.get('driver_id')} -> {bid_data.get('rider_id')}")

                    # Get rider name, coordinates, and create ongoing trip with coordinates
                    rider_name = "Rider"  # Default fallback
                    rider_latitude = None
                    rider_longitude = None
                    driver_latitude = None
                    driver_longitude = None
                    ongoing_trip_id = None
                    dirde_id = None

                    try:
                        from db import SessionLocal
                        from models import TripRequest, Rider, DriverLocation, OngoingTrip, Dirde
                        session = SessionLocal()

                        # Get trip request details including rider coordinates
                        trip_request = session.query(TripRequest).filter(
                            TripRequest.req_id == bid_data.get("req_id")
                        ).first()

                        if trip_request:
                            # Get rider name from the rider_id
                            rider = session.query(Rider).filter(
                                Rider.rider_id == trip_request.rider_id
                            ).first()
                            if rider:
                                rider_name = rider.name or rider.email or "Rider"

                            # Get rider coordinates from trip request
                            rider_latitude = trip_request.latitude
                            rider_longitude = trip_request.longitude

                        # Get driver coordinates from DriverLocation table
                        driver_location = session.query(DriverLocation).filter(
                            DriverLocation.driver_id == bid_data.get(
                                "driver_id")
                        ).first()

                        if driver_location:
                            driver_latitude = driver_location.latitude
                            driver_longitude = driver_location.longitude

                        # Create OngoingTrip record with coordinates when driver sends bid
                        if trip_request:
                            ongoing_trip = OngoingTrip(
                                req_id=bid_data.get("req_id"),
                                rider_id=bid_data.get("rider_id"),
                                driver_id=bid_data.get("driver_id"),
                                pickup_location=bid_data.get(
                                    "pickup_location", trip_request.pickup_location),
                                destination=bid_data.get(
                                    "destination", trip_request.destination),
                                fare=bid_data.get("amount", trip_request.fare),
                                status="pending_confirmation",  # Status until rider accepts
                                rider_latitude=rider_latitude,
                                rider_longitude=rider_longitude,
                                driver_latitude=driver_latitude,
                                driver_longitude=driver_longitude
                            )

                            session.add(ongoing_trip)
                            session.commit()
                            session.refresh(ongoing_trip)
                            ongoing_trip_id = ongoing_trip.trip_id

                            print(f"✅ OngoingTrip created with coordinates:")
                            print(f"   Trip ID: {ongoing_trip_id}")
                            print(
                                f"   Rider coordinates: {rider_latitude}, {rider_longitude}")
                            print(
                                f"   Driver coordinates: {driver_latitude}, {driver_longitude}")

                        # Create Dirde record with coordinates when driver sends bid
                        if rider_latitude and rider_longitude and driver_latitude and driver_longitude:
                            # Check if Dirde record already exists for this rider-driver pair
                            existing_dirde = session.query(Dirde).filter(
                                Dirde.rider_id == bid_data.get("rider_id"),
                                Dirde.driver_id == bid_data.get("driver_id")
                            ).first()

                            if existing_dirde:
                                # Update existing record
                                existing_dirde.rider_latitude = rider_latitude
                                existing_dirde.rider_longitude = rider_longitude
                                existing_dirde.driver_latitude = driver_latitude
                                existing_dirde.driver_longitude = driver_longitude
                                existing_dirde.timestamp = datetime.utcnow()
                                existing_dirde.status = "active"

                                session.commit()
                                session.refresh(existing_dirde)
                                dirde_id = existing_dirde.dirde_id

                                print(
                                    f"✅ Updated existing Dirde record: {dirde_id}")
                            else:
                                # Create new Dirde record
                                new_dirde = Dirde(
                                    rider_id=bid_data.get("rider_id"),
                                    driver_id=bid_data.get("driver_id"),
                                    rider_latitude=rider_latitude,
                                    rider_longitude=rider_longitude,
                                    driver_latitude=driver_latitude,
                                    driver_longitude=driver_longitude,
                                    status="active"
                                )

                                session.add(new_dirde)
                                session.commit()
                                session.refresh(new_dirde)
                                dirde_id = new_dirde.dirde_id

                                print(
                                    f"✅ Created new Dirde record: {dirde_id}")
                                print(
                                    f"   Rider coordinates: {rider_latitude}, {rider_longitude}")
                                print(
                                    f"   Driver coordinates: {driver_latitude}, {driver_longitude}")

                        session.close()
                    except Exception as e:
                        print(
                            f"⚠️ Could not fetch coordinates or create ongoing trip: {e}")
                        rider_name = "Rider"

                    # Save notification to database
                    notification_data = {
                        "recipient_id": bid_data.get("rider_id"),
                        "recipient_type": "rider",
                        "sender_id": bid_data.get("driver_id"),
                        "sender_type": "driver",
                        "notification_type": "bid",
                        "title": "Driver Bid Received",
                        "message": f"{bid_data.get('driver_name', 'Driver')} offered ৳{bid_data.get('amount')} for your trip",
                        "req_id": bid_data.get("req_id"),
                        "bid_amount": bid_data.get("amount"),
                        "pickup_location": bid_data.get("pickup_location"),
                        "destination": bid_data.get("destination"),
                        "driver_name": bid_data.get("driver_name"),
                        "driver_mobile": bid_data.get("driver_mobile"),
                        "rider_name": rider_name,
                    }

                    # Insert into Notification database table
                    notification_id = await save_notification_to_db(notification_data)
                    if notification_id:
                        print(
                            f"✅ Notification saved to database with ID: {notification_id}")
                    else:
                        print("❌ Failed to save notification to database")

                    # Send to specific rider with trip ID and coordinates
                    if bid_data.get("rider_id"):
                        bid_data_with_trip = {
                            **bid_data,
                            "ongoing_trip_id": ongoing_trip_id,
                            "dirde_id": dirde_id,
                            "rider_latitude": rider_latitude,
                            "rider_longitude": rider_longitude,
                            "driver_latitude": driver_latitude,
                            "driver_longitude": driver_longitude
                        }

                        await manager.send_to_user(json.dumps({
                            "type": "driver-bid-offer",
                            "data": bid_data_with_trip
                        }), bid_data["rider_id"])

                elif message_type == "rider-counter-offer":
                    # Handle rider counter offer
                    bid_data = message_data.get("data", {})
                    print(
                        f"🚗 Rider counter offer: {bid_data.get('rider_id')} -> {bid_data.get('driver_id')}")

                    # Get rider name and driver name
                    rider_name = "Rider"  # Default fallback
                    driver_name = "Driver"  # Default fallback
                    try:
                        from db import SessionLocal
                        from models import Rider, Driver
                        session = SessionLocal()

                        # Get rider name
                        rider = session.query(Rider).filter(
                            Rider.rider_id == bid_data.get("rider_id")
                        ).first()
                        if rider:
                            rider_name = rider.name or rider.email or "Rider"

                        # Get driver name
                        driver = session.query(Driver).filter(
                            Driver.driver_id == bid_data.get("driver_id")
                        ).first()
                        if driver:
                            driver_name = driver.name or driver.email or "Driver"

                        session.close()
                    except Exception as e:
                        print(f"⚠️ Could not fetch names: {e}")

                    # Save notification to database
                    notification_data = {
                        "recipient_id": bid_data.get("driver_id"),
                        "recipient_type": "driver",
                        "sender_id": bid_data.get("rider_id"),
                        "sender_type": "rider",
                        "notification_type": "counter_offer",
                        "title": "Rider Counter Offer",
                        "message": f"{rider_name} offered ৳{bid_data.get('amount')} for the trip",
                        "req_id": bid_data.get("req_id"),
                        "bid_amount": bid_data.get("amount"),
                        "original_amount": bid_data.get("original_amount"),
                        "rider_name": rider_name,
                        "driver_name": driver_name,
                    }
                    await save_notification_to_db(notification_data)

                    # Send to specific driver
                    if bid_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "rider-counter-offer",
                            "data": bid_data
                        }), bid_data["driver_id"])

                elif message_type == "driver-counter-offer":
                    # Handle driver counter offer
                    bid_data = message_data.get("data", {})
                    print(
                        f"🚑 Driver counter offer: {bid_data.get('driver_id')} -> {bid_data.get('rider_id')}")

                    # Save notification to database
                    notification_data = {
                        "recipient_id": bid_data.get("rider_id"),
                        "recipient_type": "rider",
                        "sender_id": bid_data.get("driver_id"),
                        "sender_type": "driver",
                        "notification_type": "counter_offer",
                        "title": "Driver Counter Offer",
                        "message": f"Driver offered ৳{bid_data.get('amount')} for your trip",
                        "req_id": bid_data.get("req_id"),
                        "bid_amount": bid_data.get("amount"),
                        "original_amount": bid_data.get("original_amount"),
                    }
                    await save_notification_to_db(notification_data)

                    # Send to specific rider
                    if bid_data.get("rider_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "driver-counter-offer",
                            "data": bid_data
                        }), bid_data["rider_id"])

                elif message_type == "bid-accepted":
                    # Handle bid acceptance
                    bid_data = message_data.get("data", {})
                    print(
                        f"✅ Bid accepted: {bid_data.get('driver_id')} <-> {bid_data.get('rider_id')}")

                    # Send to both parties
                    if bid_data.get("rider_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "bid-accepted",
                            "data": bid_data
                        }), bid_data["rider_id"])
                    if bid_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "bid-accepted",
                            "data": bid_data
                        }), bid_data["driver_id"])

                elif message_type == "bid-accepted-for-confirmation":
                    # Handle bid acceptance requiring driver confirmation
                    bid_data = message_data.get("data", {})
                    print(
                        f"🔔 Bid accepted for confirmation: {bid_data.get('driver_id')} <-> {bid_data.get('rider_id')}")

                    # Create driver confirmation notification
                    notification_data = {
                        "recipient_id": bid_data.get("driver_id"),
                        "recipient_type": "driver",
                        "sender_id": bid_data.get("rider_id"),
                        "sender_type": "rider",
                        "notification_type": "bid_confirmation_request",
                        "title": "Trip Confirmation Request",
                        "message": f"Rider {bid_data.get('rider_name', 'Patient')} has accepted your bid of ৳{bid_data.get('amount')}. Please confirm or cancel this trip.",
                        "req_id": bid_data.get("req_id"),
                        "bid_amount": bid_data.get("amount"),
                        "pickup_location": bid_data.get("pickup_location"),
                        "destination": bid_data.get("destination"),
                        "driver_name": "Driver",  # This will be filled by the driver
                        "driver_mobile": "N/A",
                        "rider_name": bid_data.get("rider_name", "Patient"),
                    }

                    # Insert into Notification database table
                    notification_id = await save_notification_to_db(notification_data)
                    if notification_id:
                        print(
                            f"✅ Driver confirmation notification saved with ID: {notification_id}")

                    # Send confirmation request to driver
                    if bid_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "bid-confirmation-request",
                            "data": {
                                **bid_data,
                                "notification_id": notification_id,
                                "message": "A rider has accepted your bid. Please confirm or cancel this trip."
                            }
                        }), bid_data["driver_id"])

                elif message_type == "trip-confirmed-by-driver":
                    # Handle trip confirmation by driver
                    trip_data = message_data.get("data", {})
                    print(
                        f"✅ Trip confirmed by driver: {trip_data.get('driver_id')} <-> {trip_data.get('rider_id')}")

                    # Update existing ongoing trip status in database
                    from models import OngoingTrip, TripRequest
                    from db import SessionLocal
                    session = SessionLocal()

                    try:
                        # Find existing ongoing trip (created when driver sent bid)
                        ongoing_trip = session.query(OngoingTrip).filter(
                            OngoingTrip.req_id == trip_data.get("req_id"),
                            OngoingTrip.driver_id == trip_data.get(
                                "driver_id"),
                            OngoingTrip.rider_id == trip_data.get("rider_id")
                        ).first()

                        if ongoing_trip:
                            # Update status to ongoing
                            ongoing_trip.status = "ongoing"
                            session.commit()
                            session.refresh(ongoing_trip)

                            print(
                                f"✅ Ongoing trip updated with ID: {ongoing_trip.trip_id}")
                            print(f"   Status changed to: ongoing")
                        else:
                            # Create new ongoing trip if not found (fallback)
                            ongoing_trip = OngoingTrip(
                                req_id=trip_data.get("req_id"),
                                rider_id=trip_data.get("rider_id"),
                                driver_id=trip_data.get("driver_id"),
                                pickup_location=trip_data.get(
                                    "tripDetails", {}).get("pickup_location", ""),
                                destination=trip_data.get(
                                    "tripDetails", {}).get("destination", ""),
                                fare=trip_data.get("amount"),
                                status="ongoing"
                            )

                            session.add(ongoing_trip)
                            session.commit()
                            session.refresh(ongoing_trip)
                            print(
                                f"✅ New ongoing trip created with ID: {ongoing_trip.trip_id}")

                        # Update trip request status
                        trip_request = session.query(TripRequest).filter(
                            TripRequest.req_id == trip_data.get("req_id")
                        ).first()
                        if trip_request:
                            trip_request.status = "accepted"
                            session.commit()

                        # Notify both parties
                        await manager.send_to_user(json.dumps({
                            "type": "trip-confirmed",
                            "data": {
                                "trip_id": ongoing_trip.trip_id,
                                "req_id": ongoing_trip.req_id,
                                "rider_id": ongoing_trip.rider_id,
                                "driver_id": ongoing_trip.driver_id,
                                "pickup_location": ongoing_trip.pickup_location,
                                "destination": ongoing_trip.destination,
                                "fare": ongoing_trip.fare,
                                "status": ongoing_trip.status,
                                "start_time": ongoing_trip.start_time.isoformat(),
                                "rider_latitude": ongoing_trip.rider_latitude,
                                "rider_longitude": ongoing_trip.rider_longitude,
                                "driver_latitude": ongoing_trip.driver_latitude,
                                "driver_longitude": ongoing_trip.driver_longitude
                            }
                        }), ongoing_trip.rider_id)

                        await manager.send_to_user(json.dumps({
                            "type": "trip-confirmed",
                            "data": {
                                "trip_id": ongoing_trip.trip_id,
                                "req_id": ongoing_trip.req_id,
                                "rider_id": ongoing_trip.rider_id,
                                "driver_id": ongoing_trip.driver_id,
                                "pickup_location": ongoing_trip.pickup_location,
                                "destination": ongoing_trip.destination,
                                "fare": ongoing_trip.fare,
                                "status": ongoing_trip.status,
                                "start_time": ongoing_trip.start_time.isoformat(),
                                "rider_latitude": ongoing_trip.rider_latitude,
                                "rider_longitude": ongoing_trip.rider_longitude,
                                "driver_latitude": ongoing_trip.driver_latitude,
                                "driver_longitude": ongoing_trip.driver_longitude
                            }
                        }), ongoing_trip.driver_id)

                    finally:
                        session.close()

                elif message_type == "trip-cancelled-by-driver":
                    # Handle trip cancellation by driver
                    cancel_data = message_data.get("data", {})
                    print(
                        f"❌ Trip cancelled by driver: {cancel_data.get('driver_id')} <-> {cancel_data.get('rider_id')}")

                    # Send cancellation notification to rider
                    if cancel_data.get("rider_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "trip-cancelled",
                            "data": {
                                **cancel_data,
                                "message": "Driver has cancelled the trip. Please search for another driver."
                            }
                        }), cancel_data["rider_id"])

                elif message_type == "bid-rejected":
                    # Handle bid rejection
                    bid_data = message_data.get("data", {})
                    print(
                        f"❌ Bid rejected: {bid_data.get('driver_id')} <-> {bid_data.get('rider_id')}")

                    # Send to both parties
                    if bid_data.get("rider_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "bid-rejected",
                            "data": bid_data
                        }), bid_data["rider_id"])
                    if bid_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "bid-rejected",
                            "data": bid_data
                        }), bid_data["driver_id"])

                elif message_type == "trip-location-update":
                    # Handle real-time trip location updates
                    location_data = message_data.get("data", {})
                    print(
                        f"📍 Trip location update: {location_data.get('trip_id')}")

                    # Update OngoingTrip table with real-time coordinates
                    try:
                        from db import SessionLocal
                        from models import OngoingTrip, Dirde
                        session = SessionLocal()

                        # Find the ongoing trip
                        ongoing_trip = session.query(OngoingTrip).filter(
                            OngoingTrip.trip_id == location_data.get("trip_id")
                        ).first()

                        if ongoing_trip:
                            # Update coordinates based on who is sending the update
                            rider_location = location_data.get(
                                "rider_location", {})
                            driver_location = location_data.get(
                                "driver_location", {})

                            if rider_location and rider_location.get("latitude"):
                                ongoing_trip.rider_latitude = rider_location.get(
                                    "latitude")
                                ongoing_trip.rider_longitude = rider_location.get(
                                    "longitude")
                                print(
                                    f"✅ Updated rider location: {rider_location}")

                            if driver_location and driver_location.get("latitude"):
                                ongoing_trip.driver_latitude = driver_location.get(
                                    "latitude")
                                ongoing_trip.driver_longitude = driver_location.get(
                                    "longitude")
                                print(
                                    f"✅ Updated driver location: {driver_location}")

                            session.commit()
                            print(
                                f"✅ OngoingTrip coordinates updated for trip {ongoing_trip.trip_id}")

                            # Also update Dirde table if record exists
                            dirde_record = session.query(Dirde).filter(
                                Dirde.rider_id == ongoing_trip.rider_id,
                                Dirde.driver_id == ongoing_trip.driver_id,
                                Dirde.status == "active"
                            ).first()

                            if dirde_record:
                                if rider_location and rider_location.get("latitude"):
                                    dirde_record.rider_latitude = rider_location.get(
                                        "latitude")
                                    dirde_record.rider_longitude = rider_location.get(
                                        "longitude")
                                    print(f"📍 Updated rider coordinates in Dirde")

                                if driver_location and driver_location.get("latitude"):
                                    dirde_record.driver_latitude = driver_location.get(
                                        "latitude")
                                    dirde_record.driver_longitude = driver_location.get(
                                        "longitude")
                                    print(
                                        f"📍 Updated driver coordinates in Dirde")

                                dirde_record.timestamp = datetime.utcnow()
                                session.commit()
                                print(f"✅ Dirde coordinates updated successfully")

                        session.close()
                    except Exception as e:
                        print(f"❌ Error updating OngoingTrip coordinates: {e}")

                    # Broadcast to both rider and driver
                    if location_data.get("rider_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "trip-location-update",
                            "data": location_data
                        }), location_data["rider_id"])

                    if location_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "trip-location-update",
                            "data": location_data
                        }), location_data["driver_id"])

                elif message_type == "trip-ended":
                    # Handle trip end
                    trip_data = message_data.get("data", {})
                    print(f"🏁 Trip ended: {trip_data.get('trip_id')}")

                    # Notify both parties
                    if trip_data.get("rider_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "trip-ended",
                            "data": trip_data
                        }), trip_data["rider_id"])

                    if trip_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "trip-ended",
                            "data": trip_data
                        }), trip_data["driver_id"])

                elif message_type == "end-emergency-request":
                    # Handle end emergency request from driver
                    request_data = message_data.get("data", {})
                    print(
                        f"🚑 End emergency request from driver: {request_data.get('driver_id')} -> rider: {request_data.get('rider_id')}")

                    # Get req_id from OngoingTrip if trip_id is provided
                    from models import OngoingTrip
                    from db import SessionLocal
                    session = SessionLocal()

                    req_id = None
                    try:
                        if request_data.get("trip_id"):
                            ongoing_trip = session.query(OngoingTrip).filter(
                                OngoingTrip.trip_id == request_data.get(
                                    "trip_id")
                            ).first()
                            if ongoing_trip:
                                req_id = ongoing_trip.req_id
                                print(
                                    f"✅ Found req_id: {req_id} for trip_id: {request_data.get('trip_id')}")
                        session.close()
                    except Exception as e:
                        print(f"❌ Error finding req_id: {e}")
                        session.close()

                    # Create notification for rider
                    notification_data = {
                        "recipient_id": request_data.get("rider_id"),
                        "recipient_type": "rider",
                        "sender_id": request_data.get("driver_id"),
                        "sender_type": "driver",
                        "notification_type": "end_emergency_request",
                        "title": "End Emergency Request",
                        "message": f"{request_data.get('driver_name', 'Driver')} wants to end the emergency trip. Please confirm.",
                        "req_id": req_id,
                        "trip_id": request_data.get("trip_id"),
                        "pickup_location": request_data.get("pickup_location"),
                        "destination": request_data.get("destination"),
                        "driver_name": request_data.get("driver_name", "Driver"),
                        "rider_name": "Rider",
                    }

                    # Save notification to database
                    notification_id = await save_notification_to_db(notification_data)
                    if notification_id:
                        print(
                            f"✅ End emergency request notification saved with ID: {notification_id}")

                    # Send to rider
                    if request_data.get("rider_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "end-emergency-request",
                            "data": {
                                **request_data,
                                "notification_id": notification_id,
                                "req_id": req_id,
                                "message": f"{request_data.get('driver_name', 'Driver')} wants to end the emergency trip."
                            }
                        }), request_data["rider_id"])

                elif message_type == "end-emergency-confirmed":
                    # Handle end emergency confirmation from rider
                    confirm_data = message_data.get("data", {})
                    print(
                        f"✅ End emergency confirmed by rider: {confirm_data.get('rider_id')} -> driver: {confirm_data.get('driver_id')}")

                    # Update ongoing trip status to completed
                    from models import OngoingTrip
                    from db import SessionLocal
                    session = SessionLocal()

                    try:
                        ongoing_trip = session.query(OngoingTrip).filter(
                            OngoingTrip.trip_id == confirm_data.get("trip_id")
                        ).first()

                        if ongoing_trip:
                            ongoing_trip.status = "completed"
                            ongoing_trip.end_time = datetime.utcnow()
                            session.commit()
                            print(
                                f"✅ OngoingTrip {ongoing_trip.trip_id} marked as completed")

                        session.close()
                    except Exception as e:
                        print(f"❌ Error updating trip status: {e}")
                        session.close()

                    # Notify driver
                    if confirm_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "end-emergency-confirmed",
                            "data": {
                                **confirm_data,
                                "message": "Rider confirmed. Emergency trip ended successfully."
                            }
                        }), confirm_data["driver_id"])

                elif message_type == "end-emergency-cancelled":
                    # Handle end emergency cancellation from rider
                    cancel_data = message_data.get("data", {})
                    print(
                        f"❌ End emergency cancelled by rider: {cancel_data.get('rider_id')} -> driver: {cancel_data.get('driver_id')}")

                    # Notify driver
                    if cancel_data.get("driver_id"):
                        await manager.send_to_user(json.dumps({
                            "type": "end-emergency-cancelled",
                            "data": {
                                **cancel_data,
                                "message": "Rider cancelled the end emergency request. Trip continues."
                            }
                        }), cancel_data["driver_id"])

                elif message_type == "broadcast":
                    # Broadcast message to all connected clients
                    await manager.broadcast(json.dumps({
                        "type": "broadcast_message",
                        "message": message_data.get("message", ""),
                        "from_user": user_id
                    }))
                else:
                    # Echo back unknown messages
                    await websocket.send_text(json.dumps({
                        "type": "echo",
                        "original_message": message_data
                    }))

            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                }))

    except WebSocketDisconnect:
        pass
    finally:
        # Clean up connection
        if connection_id:
            manager.disconnect(connection_id, user_id)


# Profile Management Endpoints
@app.get("/profile/driver/{driver_id}")
def get_driver_profile(driver_id: int, session: Session = Depends(get_session)):
    """Get driver profile by ID."""
    try:
        from models import Driver
        driver = session.query(Driver).filter(
            Driver.driver_id == driver_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

        return {
            "driver_id": driver.driver_id,
            "name": driver.name,
            "email": driver.email,
            "mobile": driver.mobile,
            "ratings": driver.ratings,
            "is_available": driver.is_available,
            "message": "Driver profile retrieved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting driver profile: {str(e)}")


@app.put("/profile/driver/{driver_id}")
def update_driver_profile(
    driver_id: int,
    profile_data: dict,
    session: Session = Depends(get_session)
):
    """Update driver profile by ID."""
    try:
        from models import Driver
        driver = session.query(Driver).filter(
            Driver.driver_id == driver_id).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")

        # Update only provided fields
        if "name" in profile_data:
            driver.name = profile_data["name"]
        if "email" in profile_data:
            # Check if email is unique (excluding current driver)
            existing_driver = session.query(Driver).filter(
                Driver.email == profile_data["email"],
                Driver.driver_id != driver_id
            ).first()
            if existing_driver:
                raise HTTPException(
                    status_code=400, detail="Email already exists")
            driver.email = profile_data["email"]
        if "mobile" in profile_data:
            # Check if mobile is unique (excluding current driver)
            existing_driver = session.query(Driver).filter(
                Driver.mobile == profile_data["mobile"],
                Driver.driver_id != driver_id
            ).first()
            if existing_driver:
                raise HTTPException(
                    status_code=400, detail="Mobile number already exists")
            driver.mobile = profile_data["mobile"]
        if "ratings" in profile_data:
            driver.ratings = profile_data["ratings"]
        if "is_available" in profile_data:
            driver.is_available = profile_data["is_available"]

        session.commit()
        session.refresh(driver)

        return {
            "driver_id": driver.driver_id,
            "name": driver.name,
            "email": driver.email,
            "mobile": driver.mobile,
            "ratings": driver.ratings,
            "is_available": driver.is_available,
            "message": "Driver profile updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error updating driver profile: {str(e)}")


@app.get("/profile/rider/{rider_id}")
def get_rider_profile(rider_id: int, session: Session = Depends(get_session)):
    """Get rider profile by ID."""
    try:
        from models import Rider
        rider = session.query(Rider).filter(Rider.rider_id == rider_id).first()
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")

        return {
            "rider_id": rider.rider_id,
            "name": rider.name,
            "email": rider.email,
            "mobile": rider.mobile,
            "message": "Rider profile retrieved successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting rider profile: {str(e)}")


@app.put("/profile/rider/{rider_id}")
def update_rider_profile(
    rider_id: int,
    profile_data: dict,
    session: Session = Depends(get_session)
):
    """Update rider profile by ID."""
    try:
        from models import Rider
        rider = session.query(Rider).filter(Rider.rider_id == rider_id).first()
        if not rider:
            raise HTTPException(status_code=404, detail="Rider not found")

        # Update only provided fields
        if "name" in profile_data:
            rider.name = profile_data["name"]
        if "email" in profile_data:
            # Check if email is unique (excluding current rider)
            existing_rider = session.query(Rider).filter(
                Rider.email == profile_data["email"],
                Rider.rider_id != rider_id
            ).first()
            if existing_rider:
                raise HTTPException(
                    status_code=400, detail="Email already exists")
            rider.email = profile_data["email"]
        if "mobile" in profile_data:
            # Check if mobile is unique (excluding current rider)
            existing_rider = session.query(Rider).filter(
                Rider.mobile == profile_data["mobile"],
                Rider.rider_id != rider_id
            ).first()
            if existing_rider:
                raise HTTPException(
                    status_code=400, detail="Mobile number already exists")
            rider.mobile = profile_data["mobile"]

        session.commit()
        session.refresh(rider)

        return {
            "rider_id": rider.rider_id,
            "name": rider.name,
            "email": rider.email,
            "mobile": rider.mobile,
            "message": "Rider profile updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error updating rider profile: {str(e)}")


# Notification Endpoints
@app.post("/notifications")
async def create_notification(
    notification_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Create a new notification."""
    try:
        print(f"📊 Creating notification with data: {notification_data}")
        print(f"📊 Bid amount: {notification_data.get('bid_amount')}")
        print(f"📊 Recipient ID: {notification_data.get('recipient_id')}")
        print(f"📊 Recipient type: {notification_data.get('recipient_type')}")

        notification = Notification(
            recipient_id=notification_data.get("recipient_id"),
            recipient_type=notification_data.get("recipient_type", "rider"),
            sender_id=current_user.sub,
            sender_type=current_user.role,
            notification_type=notification_data.get(
                "notification_type", "bid"),
            title=notification_data.get("title"),
            message=notification_data.get("message"),
            req_id=notification_data.get("req_id"),
            bid_amount=notification_data.get("bid_amount"),
            original_amount=notification_data.get("original_amount"),
            pickup_location=notification_data.get("pickup_location"),
            destination=notification_data.get("destination"),
            driver_name=notification_data.get("driver_name"),
            driver_mobile=notification_data.get("driver_mobile"),
            rider_name=notification_data.get("rider_name"),
            status="unread"
        )

        session.add(notification)
        session.commit()
        session.refresh(notification)

        print(
            f"✅ Notification created successfully: ID={notification.notification_id}")
        print(f"✅ Bid amount in DB: {notification.bid_amount}")
        print(f"✅ Recipient ID in DB: {notification.recipient_id}")
        print(f"✅ Recipient type in DB: {notification.recipient_type}")

        return {
            "success": True,
            "notification_id": notification.notification_id,
            "message": "Notification created successfully"
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error creating notification: {str(e)}")


@app.get("/notifications")
async def get_notifications(
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Get notifications for the current user."""
    try:
        print(
            f"🔍 Getting notifications for user: {current_user.sub}, role: {current_user.role}")
        notifications = session.query(Notification).filter(
            Notification.recipient_id == current_user.sub,
            Notification.recipient_type == current_user.role,
            Notification.status.in_(["unread", "read"])
        ).order_by(Notification.timestamp.desc()).all()

        print(f"📊 Found {len(notifications)} notifications")
        for notif in notifications:
            print(
                f"📋 Notification: ID={notif.notification_id}, Type={notif.notification_type}, Bid={notif.bid_amount}, Recipient={notif.recipient_id}")

        return {
            "success": True,
            "notifications": [
                {
                    "notification_id": notif.notification_id,
                    "recipient_id": notif.recipient_id,
                    "recipient_type": notif.recipient_type,
                    "sender_id": notif.sender_id,
                    "sender_type": notif.sender_type,
                    "notification_type": notif.notification_type,
                    "title": notif.title,
                    "message": notif.message,
                    "req_id": notif.req_id,
                    "trip_id": notif.trip_id,
                    "bid_amount": notif.bid_amount,
                    "original_amount": notif.original_amount,
                    "status": notif.status,
                    "timestamp": notif.timestamp.isoformat(),
                    "pickup_location": notif.pickup_location,
                    "destination": notif.destination,
                    "driver_name": notif.driver_name,
                    "driver_mobile": notif.driver_mobile,
                    "rider_name": notif.rider_name,
                }
                for notif in notifications
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting notifications: {str(e)}")


@app.put("/notifications/{notification_id}/status")
async def update_notification_status(
    notification_id: int,
    status_data: dict,
    current_user: TokenData = Depends(get_current_user_flexible),
    session: Session = Depends(get_session)
):
    """Update notification status."""
    try:
        notification = session.query(Notification).filter(
            Notification.notification_id == notification_id,
            Notification.recipient_id == current_user.sub
        ).first()

        if not notification:
            raise HTTPException(
                status_code=404, detail="Notification not found")

        notification.status = status_data.get("status", "read")
        session.commit()

        return {
            "success": True,
            "message": "Notification status updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error updating notification status: {str(e)}")


@app.get("/notifications/count")
async def get_notification_count():
    """Get total count of notifications in database"""
    try:
        from db import SessionLocal
        session = SessionLocal()

        total_count = session.query(Notification).count()

        # Get count by status
        unread_count = session.query(Notification).filter(
            Notification.status == "unread").count()
        read_count = session.query(Notification).filter(
            Notification.status == "read").count()
        accepted_count = session.query(Notification).filter(
            Notification.status == "accepted").count()

        session.close()

        return {
            "success": True,
            "data": {
                "total": total_count,
                "unread": unread_count,
                "read": read_count,
                "accepted": accepted_count
            }
        }

    except Exception as e:
        return {"success": False, "message": str(e)}
