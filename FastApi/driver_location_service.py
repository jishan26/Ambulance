"""
Driver Location Service for managing driver positions and nearby driver queries.
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import math
from sqlalchemy.orm import Session
from models import DriverLocation, Driver
from db import engine
from fastapi import WebSocket


class DriverLocationService:
    """Service for managing driver locations and finding nearby drivers."""
    
    def __init__(self):
        self.active_drivers: Dict[int, dict] = {}
        self.connected_riders: set = set()  # Store WebSocket connections for riders
    
    def update_driver_location(self, driver_id: int, latitude: float, longitude: float) -> bool:
        """
        Update driver location in memory and database.
        
        Args:
            driver_id: ID of the driver
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            bool: True if update was successful
        """
        try:
            # Update in-memory cache
            self.active_drivers[driver_id] = {
                "latitude": latitude,
                "longitude": longitude,
                "timestamp": datetime.now().isoformat(),
                "last_seen": datetime.now()
            }
            
            # Update database
            with Session(bind=engine) as db:
                # Check if driver location exists
                existing_location = db.query(DriverLocation).filter(
                    DriverLocation.driver_id == driver_id
                ).first()
                
                if existing_location:
                    # Update existing location
                    existing_location.latitude = latitude
                    existing_location.longitude = longitude
                else:
                    # Create new location record
                    new_location = DriverLocation(
                        driver_id=driver_id,
                        latitude=latitude,
                        longitude=longitude
                    )
                    db.add(new_location)
                
                db.commit()
                print(f"✅ Successfully updated driver {driver_id} location: {latitude}, {longitude}")
                
                # Broadcast to all riders
                for ws in self.connected_riders:
                    # Assuming ws.send_json is an async method
                    # You might need to use an async loop or similar mechanism here
                    ws.send_json({
                        "type": "location_updated",
                        "data": {
                            "driver_id": driver_id,
                            "latitude": latitude,
                            "longitude": longitude,
                        }
                    })
                
                return True
                
        except Exception as e:
            print(f"❌ Error updating driver location: {e}")
            # Still return True for in-memory update even if DB fails
            return True
    
    def get_driver_location(self, driver_id: int) -> Optional[dict]:
        """
        Get current location of a specific driver.
        
        Args:
            driver_id: ID of the driver
            
        Returns:
            dict: Driver location data or None if not found
        """
        return self.active_drivers.get(driver_id)
    
    def get_all_active_drivers(self) -> Dict[int, dict]:
        """
        Get all currently active drivers.
        
        Returns:
            dict: Dictionary of active drivers with their locations
        """
        # Filter out drivers that haven't been seen in the last 5 minutes
        cutoff_time = datetime.now() - timedelta(minutes=5)
        active_drivers = {
            driver_id: data for driver_id, data in self.active_drivers.items()
            if data.get("last_seen", datetime.min) > cutoff_time
        }
        
        # Remove inactive drivers from cache
        inactive_drivers = set(self.active_drivers.keys()) - set(active_drivers.keys())
        for driver_id in inactive_drivers:
            del self.active_drivers[driver_id]
        
        return active_drivers
    
    def find_nearby_drivers(self, latitude: float, longitude: float, radius_km: float = 5.0) -> List[dict]:
        """
        Find drivers within a specified radius of given coordinates.
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius in kilometers
            
        Returns:
            list: List of nearby drivers with their details
        """
        nearby_drivers = []
        active_drivers = self.get_all_active_drivers()
        
        for driver_id, location_data in active_drivers.items():
            distance = self._calculate_distance(
                latitude, longitude,
                location_data["latitude"], location_data["longitude"]
            )
            
            if distance <= radius_km:
                nearby_drivers.append({
                    "driver_id": driver_id,
                    "latitude": location_data["latitude"],
                    "longitude": location_data["longitude"],
                    "timestamp": location_data["timestamp"],
                    "distance_km": round(distance, 2)
                })
        
        # Sort by distance
        nearby_drivers.sort(key=lambda x: x["distance_km"])
        return nearby_drivers
    
    def remove_driver(self, driver_id: int) -> bool:
        """
        Remove driver from active drivers list.
        
        Args:
            driver_id: ID of the driver to remove
            
        Returns:
            bool: True if driver was removed
        """
        if driver_id in self.active_drivers:
            del self.active_drivers[driver_id]
            return True
        return False
    
    def get_driver_count(self) -> int:
        """
        Get total number of active drivers.
        
        Returns:
            int: Number of active drivers
        """
        return len(self.get_all_active_drivers())
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula.
        
        Args:
            lat1, lon1: First coordinate
            lat2, lon2: Second coordinate
            
        Returns:
            float: Distance in kilometers
        """
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r


# Global instance
driver_location_service = DriverLocationService()

# This is a simplified example. Adjust for your actual connection/session management.

connected_riders = set()  # Store WebSocket connections for riders

async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_role = ... # get from query or auth
    if user_role == "rider":
        connected_riders.add(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "driver-location":
                # Broadcast to all riders
                for rider_ws in connected_riders:
                    await rider_ws.send_json({
                        "type": "location_updated",
                        "data": {
                            "driver_id": data["data"]["id"],
                            "latitude": data["data"]["latitude"],
                            "longitude": data["data"]["longitude"],
                        }
                    })
    except Exception:
        connected_riders.discard(websocket)
