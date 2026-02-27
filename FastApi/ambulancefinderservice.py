from sqlmodel import Session
from geoalchemy2.functions import ST_Distance, ST_GeomFromText
from schema import NearbyDriversRequest
from models import DriverLocation, Driver, EngagedDriver
from fastapi import HTTPException
from sqlalchemy.orm import aliased
from fastapi import HTTPException, status

INTERNAL_SERVER_ERROR = HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Internal Server Error"
)


class AmbulanceService:
    @staticmethod
    def find_nearby_drivers(db: Session, request: NearbyDriversRequest):
        # Create reference point
        ref_point = f'POINT({request.lon} {request.lat})'

        try:
            # Subquery to get engaged drivers
            engaged_drivers_subquery = db.query(
                EngagedDriver.driver_id).subquery()

            # Query nearby drivers with a join to the Driver table and exclude engaged drivers
            results = db.query(
                DriverLocation.driver_id,
                Driver.name,
                Driver.mobile
            ).join(
                Driver, DriverLocation.driver_id == Driver.driver_id
            ).filter(
                Driver.is_available == True,
                ~DriverLocation.driver_id.in_(engaged_drivers_subquery)
            ).all()

            # Convert results to list of dictionaries
            nearby_drivers = []
            for result in results:
                nearby_drivers.append({
                    "driver_id": result.driver_id,
                    "name": result.name,
                    "mobile": result.mobile
                })

            return nearby_drivers

        except Exception as e:
            print(f"Error finding nearby drivers: {str(e)}")
            raise INTERNAL_SERVER_ERROR
