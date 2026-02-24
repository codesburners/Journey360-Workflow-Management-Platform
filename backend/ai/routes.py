from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
try:
    from backend.database.db import trips_collection, itineraries_collection
    from backend.ai.itinerary import generate_itinerary
    from backend.ai.regeneration import regenerate_itinerary
    from backend.ai.assistant import chat_with_assistant
    from backend.ai.post_trip import generate_trip_summary
    from backend.ai.safety import assess_safety
    from backend.auth.dependencies import get_current_user
    from backend.utils.geo import haversine
    from backend.services.reviews import get_place_reviews
except ImportError:
    from database.db import trips_collection, itineraries_collection
    from ai.itinerary import generate_itinerary
    from ai.regeneration import regenerate_itinerary
    from ai.assistant import chat_with_assistant
    from ai.post_trip import generate_trip_summary
    from ai.safety import assess_safety
    from auth.dependencies import get_current_user
    from utils.geo import haversine
    from services.reviews import get_place_reviews
from fastapi import Query as FastQuery

router = APIRouter()

@router.get("/ai/place-reviews")
def place_reviews(place_name: str = FastQuery(...), destination: str = FastQuery(...), user=Depends(get_current_user)):
    """Fetch real rating + review count via SerpAPI (primary) or Foursquare (fallback)."""
    result = get_place_reviews(place_name, destination)
    if result is None:
        return {"rating": None, "totalReviews": None}
    return result

@router.get("/ai/itinerary/ar-nearby")
def get_ar_nearby(trip_id: str, lat: float, lng: float, radius: float = 1000, user=Depends(get_current_user)):
    # Verify trip ownership
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    itinerary = itineraries_collection.find_one({"tripId": trip_id})
    if not itinerary:
        return []

    nearby_places = []
    for day in itinerary.get("days", []):
        for place in day.get("places", []):
            # We assume place data from the LLM has lat/lng if we enrich it or 
            # we use the search service to get coordinates if missing.
            # For this MVP, we'll try to find lat/lng in the place object
            p_lat = place.get("lat")
            p_lng = place.get("lng")
            
            if p_lat and p_lng:
                dist = haversine(lat, lng, p_lat, p_lng)
                if dist <= radius:
                    nearby_places.append({
                        **place,
                        "distance": round(dist, 1)
                    })
    
    return nearby_places

@router.post("/ai/itinerary/generate")
def generate(trip_id: str, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    try:
        itinerary = generate_itinerary(trip)
        
        # Send Interactive Email via Background Task
        try:
            from backend.services.notification import notification_service
            # Check user preferences (default to True if not set)
            # In a real app, we'd query the user's preferences from the DB here.
            # For this MVP, we assume they want it if the valid email is present.
            if user.get("email"):
               background_tasks.add_task(
                   notification_service.send_trip_itinerary_email,
                   to_email=user["email"],
                   trip_title=trip.get("destination", "Your Trip"),
                   itinerary=itinerary
               )
        except Exception as notify_err:
            print(f"Failed to queue notification: {notify_err}")

        return itinerary
    except Exception as e:
        err_msg = str(e)
        if "Quota exceeded" in err_msg or "429" in err_msg:
            raise HTTPException(status_code=503, detail="AI is currently at capacity. Please try again in 30 seconds.")
        raise HTTPException(status_code=500, detail=f"Itinerary generation failed: {err_msg}")

@router.get("/trip/{trip_id}/itinerary")
def get_itinerary(trip_id: str, user=Depends(get_current_user)):
    # Check trip ownership
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found or not authorized")
    
    itinerary = itineraries_collection.find_one({"tripId": trip_id})
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not generated yet")
    
    if "_id" in itinerary: del itinerary["_id"]
    return itinerary

@router.post("/ai/itinerary/regenerate")
def regenerate(data: dict, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    trip_id = data.get("tripId")
    instruction = data.get("instruction")
    constraints = data.get("constraints", {})
    
    if not trip_id or not instruction:
        raise HTTPException(status_code=400, detail="tripId and instruction are required")
        
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    existing_itinerary = itineraries_collection.find_one({"tripId": trip_id})
    if not existing_itinerary:
        raise HTTPException(status_code=404, detail="No existing itinerary to regenerate")
        
    try:
        updated_itinerary = regenerate_itinerary(trip, existing_itinerary, instruction, constraints)
        
        # Send Interactive Email via Background Task (Regeneration Update)
        try:
            from backend.services.notification import notification_service
            if user.get("email"):
               background_tasks.add_task(
                   notification_service.send_trip_itinerary_email,
                   to_email=user["email"],
                   trip_title=trip.get("destination", "Your Trip") + " (Updated)",
                   itinerary=updated_itinerary
               )
        except Exception as notify_err:
            print(f"Failed to queue notification: {notify_err}")

        return {"message": "Itinerary updated successfully", "updatedItinerary": updated_itinerary}
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "ResourceExhausted" in err_msg:
            raise HTTPException(status_code=503, detail="AI is currently at capacity. Please try again in 30 seconds.")
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {err_msg}")

@router.post("/ai/chat")
def chat(message: str, trip_id: str = None, user=Depends(get_current_user)):
    trip_context = None
    if trip_id:
        trip_context = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    
    return chat_with_assistant(message, trip_context)

@router.post("/ai/post-trip/summary")
def summary(trip_id: str, user=Depends(get_current_user)):
    trip = trips_collection.find_one({"trip_id": trip_id, "user_id": user["uid"]})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return generate_trip_summary(trip)

@router.post("/ai/safety/assess")
def safety(location: str, user=Depends(get_current_user)):
    return assess_safety(location)

@router.get("/ai/dashboard/context")
def get_dashboard_context(user=Depends(get_current_user)):
    # 1. Find upcoming/active trip
    # Find trips that start today or in future, or ended recently
    # For now, simplistic approach: find the first trip sorted by start_date ascending (closest future)
    # or just find *any* trip for the MVP.
    # Let's try to find a trip that contains "today" or is the next upcoming one.
    
    # Check if trips_collection is valid (might be None if db connection failed)
    if trips_collection is None:
         return {"error": "Database not connected"}

    # Get all user trips
    user_trips = list(trips_collection.find({"user_id": user["uid"]}))
    
    if not user_trips:
        return None  # No context

    # Sort trips by start_date. Assuming format YYYY-MM-DD
    # TODO: Proper date parsing.
    # Sort trips by _id desc (natural creation order usually) to get latest
    user_trips.sort(key=lambda x: x.get("_id", ""), reverse=True)
    active_trip = user_trips[0] 
    
    trip_id = active_trip.get("trip_id")
    print(f"DEBUG: Active Trip: {active_trip.get('destination')} ({trip_id})", flush=True)

    # 2. Get Weather
    try:
        from backend.services.weather import get_weather
    except ImportError:
        from services.weather import get_weather
    weather = get_weather(active_trip.get("destination", "Tokyo"))
    
    # 3. Get Schedule (Itinerary)
    itinerary = itineraries_collection.find_one({"tripId": trip_id})
    
    # Fallback: Try matching by destination and user_id if ID lookup fails
    # (Sometimes dev databases get out of sync with IDs)
    if not itinerary:
         print("DEBUG: Itinerary not found by ID, trying destination...", flush=True)
         itinerary = itineraries_collection.find_one({
             "destination": active_trip.get("destination"),
             "userId": user["uid"]
         })

    print(f"DEBUG: Itinerary Found: {bool(itinerary)}", flush=True)
    
    schedule = []
    next_activity = None
    
    if itinerary:
        # Find "today" in itinerary
        # For MVP, just return Day 1 or the first few items
        days = itinerary.get("days", [])
        print(f"DEBUG: Itinerary Days: {len(days)}", flush=True)
        if days:
            first_day = days[0]
            # Use specific places from day 1
            places = first_day.get("places", [])
            print(f"DEBUG: First Day Places: {len(places)}", flush=True)
            
            # Map to simpler structure
            for p in places:
                 schedule.append({
                     "title": p.get("name"),
                     "time": p.get("time", "Anytime"),
                     "location": p.get("location", active_trip.get("destination")),
                     "description": p.get("description")
                 })
            
            if schedule:
                next_activity = schedule[0]
                print(f"DEBUG: Next Activity: {next_activity['title']}", flush=True)

    return {
        "trip_id": active_trip.get("trip_id"),
        "destination": active_trip.get("destination"),
        "startDate": active_trip.get("start_date"),
        "weather": weather,
        "next_activity": next_activity,
        "schedule": schedule[:5] # Limit to 5 items
    }
