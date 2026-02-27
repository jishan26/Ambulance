from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Float, Text
# from database import Base
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4
from decimal import Decimal
from typing import Optional
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey, Float
from geoalchemy2 import Geography
from sqlalchemy import PrimaryKeyConstraint
Base = declarative_base()

DRIVER_ID_FK = "driver.driver_id"


class Driver(SQLModel, table=True):
    driver_id: Optional[int] = Field(
        default=None, primary_key=True, index=True)
    name: str
    mobile: str = Field(unique=True, nullable=False)
    email: str = Field(unique=True, nullable=False)  
    password: str
    ratings: Optional[float] = Field(default=None)
    is_available: bool = Field(default=False) 


class Rider(SQLModel, table=True):
    rider_id: Optional[int] = Field(default=None, primary_key=True, index=True)
    name: str
    mobile: str = Field(unique=True, nullable=False)
    email: str = Field(unique=True, nullable=False)  # Mandatory and unique
    password: str


class DriverLocation(SQLModel, table=True):
    driver_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey(DRIVER_ID_FK, ondelete="CASCADE"),
            primary_key=True,
            index=True
        )
    )
    # Modify the Field definition
    latitude: float = Field(
        sa_column=Column(Float, nullable=False)
    )

    longitude: float = Field(
        sa_column=Column(Float, nullable=False)
    )
    # location: Geography = Field(sa_column=Column(
    #     Geography(geometry_type="POINT", srid=4326), nullable=False))

    model_config = {
        "arbitrary_types_allowed": True
    }


class Trip(SQLModel, table=True):
    trip_id: Optional[int] = Field(default=None, primary_key=True, index=True)
    rider_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("rider.rider_id", ondelete="CASCADE"),
            index=True
        )
    )
    driver_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey(DRIVER_ID_FK, ondelete="CASCADE"),
            index=True
        )
    )
    pickup_location: str
    destination: str
    fare: float
    status: str  # e.g., "completed", "cancelled", etc.


class TripRequest(SQLModel, table=True):
    req_id: Optional[int] = Field(default=None, primary_key=True, index=True)
    rider_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("rider.rider_id", ondelete="CASCADE"),
            index=True
        )
    )
    pickup_location: str
    destination: str
    fare: float
    latitude: float
    longitude: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="pending")  # pending, accepted, cancelled


class DriverResponse(SQLModel, table=True):
    response_id: Optional[int] = Field(
        default=None, primary_key=True, index=True)
    req_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("triprequest.req_id", ondelete="CASCADE"),
            index=True
        )
    )
    driver_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey(DRIVER_ID_FK, ondelete="CASCADE"),
            index=True
        )
    )
    driver_name: str
    driver_mobile: str
    amount: float
    rating: float = Field(default=4.5)
    vehicle: str
    eta: str
    specialty: str
    status: str = Field(default="pending")  # pending, accepted, rejected
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class OngoingTrip(SQLModel, table=True):
    trip_id: Optional[int] = Field(default=None, primary_key=True, index=True)
    req_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("triprequest.req_id", ondelete="CASCADE"),
            index=True
        )
    )
    rider_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("rider.rider_id", ondelete="CASCADE"),
            index=True
        )
    )
    driver_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey(DRIVER_ID_FK, ondelete="CASCADE"),
            index=True
        )
    )
    pickup_location: str
    destination: str
    fare: float
    status: str = Field(default="ongoing")  # ongoing, completed, cancelled
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = Field(default=None)
    rider_latitude: Optional[float] = Field(default=None)
    rider_longitude: Optional[float] = Field(default=None)
    driver_latitude: Optional[float] = Field(default=None)
    driver_longitude: Optional[float] = Field(default=None)


class EngagedDriver(SQLModel, table=True):

    __table_args__ = (
        PrimaryKeyConstraint("req_id", "driver_id"),
    )

    req_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("triprequest.req_id", ondelete="CASCADE"),
            index=True
        )
    )
    driver_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey(DRIVER_ID_FK, ondelete="CASCADE"),
            index=True
        )
    )


class Notification(SQLModel, table=True):
    notification_id: Optional[int] = Field(
        default=None, primary_key=True, index=True)
    recipient_id: int = Field(
        sa_column=Column(
            Integer,
            nullable=False,
            index=True
        )
    )
    recipient_type: str = Field(default="rider")  # "rider" or "driver"
    sender_id: int = Field(
        sa_column=Column(
            Integer,
            nullable=False,
            index=True
        )
    )
    sender_type: str = Field(default="driver")  # "rider" or "driver"
    # "bid", "counter_offer", "acceptance", "rejection", "end_emergency_request"
    notification_type: str = Field(default="bid")
    title: str
    message: str
    req_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("triprequest.req_id", ondelete="CASCADE"),
            nullable=True,
            index=True
        )
    )
    trip_id: Optional[int] = Field(default=None)  # For ongoing trip notifications
    bid_amount: Optional[float] = Field(default=None)
    original_amount: Optional[float] = Field(default=None)
    # "unread", "read", "accepted", "rejected", "confirmed", "cancelled"
    status: str = Field(default="unread")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    pickup_location: Optional[str] = Field(default=None)
    destination: Optional[str] = Field(default=None)
    driver_name: Optional[str] = Field(default=None)
    driver_mobile: Optional[str] = Field(default=None)
    rider_name: Optional[str] = Field(default=None)


class Dirde(SQLModel, table=True):
    dirde_id: Optional[int] = Field(default=None, primary_key=True, index=True)
    rider_id: int = Field(
        sa_column=Column(
            Integer,
            nullable=False,
            index=True
        )
    )
    driver_id: int = Field(
        sa_column=Column(
            Integer,
            nullable=False,
            index=True
        )
    )
    rider_longitude: float = Field(
        sa_column=Column(Float, nullable=False)
    )
    rider_latitude: float = Field(
        sa_column=Column(Float, nullable=False)
    )
    driver_longitude: float = Field(
        sa_column=Column(Float, nullable=False)
    )
    driver_latitude: float = Field(
        sa_column=Column(Float, nullable=False)
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="active")  # active, inactive, completed


class Hospital(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    rider_id: int = Field(sa_column=Column(
        Integer, index=True, nullable=False))
    name: str
    latitude: float = Field(sa_column=Column(Float, nullable=False))
    longitude: float = Field(sa_column=Column(Float, nullable=False))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
