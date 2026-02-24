import sys
import os
import requests

# Add the parent directory to sys.path to resolve imports correctly
# Current script is in backend/verify_saved_places.py so we need to add .../backend/..
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.db import saved_places_collection, db
from backend.saved_places.models import SavedPlace
import uuid
from datetime import datetime

# Fake user ID for testing
TEST_USER_ID = "test_user_verification_script"
TEST_PLACE_ID = f"place_{uuid.uuid4()}"

def verify_saved_places_logic():
    print(f"--- Verifying Saved Places Data Layer for User: {TEST_USER_ID} ---")
    
    if saved_places_collection is None:
        print("ERROR: saved_places_collection is None. Check DB connection.")
        return

    # 1. Clean up potential old test data
    saved_places_collection.delete_many({"user_id": TEST_USER_ID})
    print("Cleaned up old test data.")

    # 2. Simulate Save
    print(f"Attempting to save place: {TEST_PLACE_ID}")
    new_place = {
        "place_id": TEST_PLACE_ID,
        "name": "Test Place Verification",
        "category": "Attraction",
        "address": "123 Test St",
        "user_id": TEST_USER_ID,
        "saved_at": datetime.utcnow()
    }
    
    try:
        # Validate with Pydantic first (mimic API behavior)
        # Note: API uses alias="userId" but internal dict keys are pythonic usually, 
        # BUT our route does `place.dict(by_alias=True)` which uses aliases.
        # Let's just insert directly to DB as the route does, ensuring we match the schema.
        
        # Route logic:
        # place_dict = place.dict(by_alias=True)
        # place_dict["user_id"] = user["uid"]
        
        # So we should insert with `user_id` field.
        result = saved_places_collection.insert_one(new_place)
        print(f"Insert successful. ID: {result.inserted_id}")
    except Exception as e:
        print(f"ERROR during insert: {e}")
        return

    # 3. Simulate Fetch
    print("Attempting to fetch saved places...")
    cursor = saved_places_collection.find({"user_id": TEST_USER_ID})
    found_places = list(cursor)
    
    if len(found_places) == 1:
        print(f"SUCCESS: Found 1 place. Name: {found_places[0].get('name')}")
        if found_places[0].get('place_id') == TEST_PLACE_ID:
            print("Place ID matches.")
        else:
            print(f"Mismatch Place ID: {found_places[0].get('place_id')}")
    else:
        print(f"FAILURE: Expected 1 place, found {len(found_places)}")

    # 4. Simulate Remove
    print("Attempting to remove saved place...")
    del_result = saved_places_collection.delete_one({"user_id": TEST_USER_ID, "place_id": TEST_PLACE_ID})
    
    if del_result.deleted_count == 1:
        print("SUCCESS: Place removed successfully.")
    else:
        print("FAILURE: Delete count was 0.")

    # Final check
    final_count = saved_places_collection.count_documents({"user_id": TEST_USER_ID})
    if final_count == 0:
        print("Final state verified: User list is empty.")
    else:
        print(f"Final state invalid: {final_count} items remaining.")

if __name__ == "__main__":
    verify_saved_places_logic()
