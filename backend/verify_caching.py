
import os
import sys
import uuid
import time
from datetime import datetime

# Redirect stdout to file
log_file = open("verify_caching_log.txt", "w", encoding="utf-8")
sys.stdout = log_file
sys.stderr = log_file

# Add parent directory
curr = os.path.dirname(os.path.abspath(__file__))
parent = os.path.dirname(curr)
sys.path.append(parent)

from backend.ai.itinerary import generate_itinerary
from backend.database.db import itineraries_collection

# Clean previous test entries to ensure fresh start
print("Cleaning test cache...")
if itineraries_collection is not None:
    itineraries_collection.delete_many({"destination": "TestCacheCity"})

# 1. First Generation (Should be slow/AI)
print("\n--- TEST 1: First Generation (Fresh) ---")
# Enable Mock AI for speed - we are testing CACHING, not the AI API itself
os.environ["MOCK_AI"] = "true" 
trip1 = {
    "trip_id": f"test-trip-1-{uuid.uuid4()}",
    "user_id": "user1",
    "destination": "TestCacheCity",
    "days": 3,
    "budget": 5000,
    "interests": ["Food", "History"],
    "budget_level": "Balanced"
}
start = time.time()
try:
    res1 = generate_itinerary(trip1)
    dur1 = time.time() - start
    print(f"Gen 1 took {dur1:.2f}s")
    print(f"Result 1 ID: {res1.get('itineraryId')}")
    print(f"Is Cached? {res1.get('isCachedResult', False)}")
except Exception as e:
    import traceback
    traceback.print_exc()

# 2. Second Generation (Should be FAST/Cached)
print("\n--- TEST 2: Second Generation (Same parameters, different user) ---")
trip2 = {
    "trip_id": f"test-trip-2-{uuid.uuid4()}",
    "user_id": "user2", # Different user!
    "destination": "TestCacheCity",
    "days": 3,
    "budget": 5000,
    "interests": ["Food"], # Different interests, but our naive cache ignores this for now
    "budget_level": "Balanced"
}
start = time.time()
try:
    res2 = generate_itinerary(trip2)
    dur2 = time.time() - start
    print(f"Gen 2 took {dur2:.2f}s")
    print(f"Result 2 ID: {res2.get('itineraryId')}")
    print(f"Is Cached? {res2.get('isCachedResult', False)}")

    if not res2.get('isCachedResult'):
        print("FAILED: Did not use cache!")
    else:
        print("PASSED: Used cache!")
        if dur2 < 1.0:
            print("PERFORMANCE: Cache is fast!")
except Exception as e:
    import traceback
    traceback.print_exc()
        
# Cleanup
print("\nCleaning up...")
# itineraries_collection.delete_many({"destination": "TestCacheCity"})
log_file.close()
