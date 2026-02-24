import requests
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

# MOCK Authentication dependency injection in FastApi is tricky from outside.
# However, we can use a small python script that imports the router logic and runs it directly 
# bypassing HTTP for now to verify logic, OR we can try to hit the endpoint if we have a token.
# Since we don't have a token, logic verification is better.

import sys
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir.parent))

def log(msg):
    with open("trip_create_log.txt", "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")
    print(msg)

with open("trip_create_log.txt", "w") as f: f.write("Starting Trip Create Debug\n")

try:
    from backend.database.db import trips_collection, users_collection
    from backend.trips.routes import create_trip
except ImportError:
    log("Importing from local path...")
    sys.path.append(str(current_dir))
    from database.db import trips_collection, users_collection
    # We cannot import routes directly easily because it has Depends()
    # But we can try to test the DB insertion logic manually matching the router code.

log("DEBUG: Testing Trip Insert Logic manually...")

if trips_collection is None:
    log("CRITICAL: Trips Collection is NONE")
    exit(1)

# Mock Data
mock_user = {"uid": "test_debug_user_Trip", "email": "test@debug.com"}
mock_trip_data = {
    "destination": "Paris",
    "start_date": "2025-06-01",
    "end_date": "2025-06-04",
    "budget": 2000,
    "interests": ["Food", "Art"],
    "travel_pace": "Relaxed"
}

try:
    # 1. Image Service check
    log("DEBUG: Testing Image Service...")
    from backend.services.image_service import get_destination_image
    img = get_destination_image("Paris")
    log(f"DEBUG: Image Service returned: {img}")

    # 2. Logic simulation
    log("DEBUG: Simulating Route Logic...")
    import uuid
    from datetime import datetime
    
    trip_id = str(uuid.uuid4())
    days = 4 # pre-calced
    
    trip = {
        "trip_id": trip_id,
        "user_id": mock_user["uid"],
        "destination": "Paris",
        "start_date": "2025-06-01",
        "end_date": "2025-06-04",
        "days": days,
        "budget": 2000,
        "interests": ["Food", "Art"],
        "travel_pace": "Relaxed",
        "status": "CREATED",
        "image_url": img
    }
    
    log("DEBUG: Attempting DB Insert...")
    trips_collection.insert_one(trip)
    log("SUCCESS: Trip inserted into DB.")
    
    # Cleanup
    trips_collection.delete_one({"trip_id": trip_id})
    log("DEBUG: Cleanup done.")

except Exception as e:
    log(f"CRITICAL: Logic Failed: {e}")
    import traceback
    traceback.print_exc()

