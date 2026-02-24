import sys
import os
import pathlib
import time
from dotenv import load_dotenv

# Force reload of env
load_dotenv(override=True)

# Add project root to path
backend_dir = pathlib.Path(os.getcwd())
if backend_dir.name != 'backend':
    # If running from root
    sys.path.append(str(backend_dir))
else:
    # If running from backend
    sys.path.append(str(backend_dir.parent))
    
from backend.ai.itinerary import generate_itinerary

# Ensure we are NOT mocking
os.environ["MOCK_AI"] = "false"

def test_ai_generation():
    print("Testing REAL AI Generation with NEW KEY...")
    
    trip = {
        "trip_id": "test_new_key",
        "user_id": "test_user",
        "destination": "Ooty",
        "days": 1,
        "budget": 5000,
        "interests": ["Nature"],
        "start_date": "2024-12-01",
        "end_date": "2024-12-01"
    }

    try:
        start = time.time()
        result = generate_itinerary(trip)
        duration = time.time() - start
        
        print(f"\nTime taken: {duration:.2f}s")
        
        if result.get("is_mock"):
             print("FAILURE: System fell back to Mock Data.")
             print(f"Safety Advisory: {result.get('safetyAdvisory')}")
        else:
             print("SUCCESS: Received Real AI Itinerary!")
             print(f"Used Model: {result.get('aiVersion', 'Unknown')}")
             # Check specifically for Google model usage
             if "gemini" in result.get('aiVersion', '').lower():
                 print("Confirmed: Used Google Gemini successfully.")
             else:
                 print("Warning: Used fallback model, not Gemini.")

    except Exception as e:
        print(f"CRITICAL FAILURE: {e}")

if __name__ == "__main__":
    test_ai_generation()
