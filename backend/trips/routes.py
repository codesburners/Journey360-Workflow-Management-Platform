from fastapi import APIRouter, Depends, HTTPException
import uuid
from datetime import datetime
try:
    from backend.database.db import trips_collection
    from backend.auth.dependencies import get_current_user
    from backend.trips.schema import Trip
except ImportError:
    from database.db import trips_collection
    from auth.dependencies import get_current_user
    from trips.schema import Trip

router = APIRouter()

@router.post("/trip/create")
def create_trip(data: dict, user=Depends(get_current_user)):
    try:
        print(f"DEBUG: create_trip called by {user['email']}", flush=True)
        print(f"DEBUG: Trip Data: {data}", flush=True)

        if trips_collection is None:
            print("CRITICAL: trips_collection is None", flush=True)
            raise HTTPException(status_code=500, detail="Database not connected")

        trip_id = str(uuid.uuid4())
        
        # Calculate days from dates if provided
        days = 3
        if "start_date" in data and "end_date" in data:
            try:
                d1 = datetime.strptime(data["start_date"], "%Y-%m-%d")
                d2 = datetime.strptime(data["end_date"], "%Y-%m-%d")
                days = (d2 - d1).days + 1
                if days <= 0: days = 1
            except Exception:
                days = 3

        # Sanitizer: Fix common misspellings
        dest_name = data["destination"].replace("Kolkatta", "Kolkata").replace("Banglore", "Bengaluru")

        # Fetch Image
        image_url = None
        try:
            try:
                from backend.services.image_service import get_destination_image
            except ImportError:
                from services.image_service import get_destination_image
            image_url = get_destination_image(dest_name)
        except Exception as e:
            print(f"DEBUG: Failed to fetch image for {dest_name}: {e}")

        trip = {
            "trip_id": trip_id,
            "user_id": user["uid"],
            "destination": dest_name,
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "days": days,
            "budget": data["budget"],
            "interests": data["interests"],
            "travel_pace": data.get("travel_pace", "Balanced"),
            "status": "CREATED",
            "image_url": image_url
        }
        trips_collection.insert_one(trip)
        trip["_id"] = str(trip["_id"])
        return trip
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"CRITICAL UNHANDLED ERROR in create_trip: {e}\n{tb}", flush=True)
        raise HTTPException(status_code=500, detail=f"Trip creation failed: {type(e).__name__}: {str(e)}")

@router.get("/trips")
def list_trips(user=Depends(get_current_user)):
    print(f"DEBUG: Fetching trips for user {user['uid']}", flush=True)
    if trips_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    trips = list(trips_collection.find({"user_id": user["uid"]}).sort("_id", -1))
    
    # TEMPORARY FIX: Commenting out synchronous backfill to prevent timeouts
    # for trip in trips:
    #     trip["_id"] = str(trip["_id"])
    #     if "image_url" not in trip or not trip["image_url"]:
    #         try:
    #             dest = trip.get("destination", "Travel")
    #             print(f"DEBUG: Backfilling image for {dest}...")
    #             img_url = get_destination_image(dest)
    #             if img_url:
    #                 trip["image_url"] = img_url
    #                 trips_collection.update_one(
    #                     {"trip_id": trip["trip_id"]},
    #                     {"$set": {"image_url": img_url}}
    #                 )
    #         except Exception as e:
    #             print(f"DEBUG: Backfill error: {e}")
    
    # Just ensure ID is string
    for trip in trips:
        trip["_id"] = str(trip["_id"])

    return trips
