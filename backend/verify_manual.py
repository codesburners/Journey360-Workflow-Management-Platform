import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Setup path
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir.parent))

load_dotenv(current_dir / '.env')

# ... imports remain ...

def log(msg):
    with open("manual_log.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg) # Still print for console

# Clear log
with open("manual_log.txt", "w", encoding="utf-8") as f:
    f.write("DEBUG: Starting Verification\n")

log(f"DEBUG: Loaded Environment.")
key = os.getenv("GEMINI_API_KEY")
if key:
    log(f"DEBUG: GEMINI_API_KEY found: {key[:5]}...{key[-5:]}")
else:
    log("DEBUG: GEMINI_API_KEY NOT FOUND!")

try:
    from backend.services.places import get_places
    from backend.ai.assistant import chat_with_assistant
    from backend.ai.itinerary import generate_itinerary
except ImportError:
    log("Import error using 'backend.', trying local...")
    sys.path.append(str(current_dir))
    from ai.assistant import chat_with_assistant
    from ai.itinerary import generate_itinerary

log("\n--- Testing Chatbot ---")
try:
    response = chat_with_assistant("Hello, I need travel advice.")
    log(f"Chatbot Response: {json.dumps(response, indent=2)}")
    if response and "reply" in response:
        log("SUCCESS: Chatbot replied.")
    else:
        log("FAILURE: Chatbot response format incorrect.")
except Exception as e:
    log(f"Chatbot FAILED: {e}")

log("\n--- Testing Itinerary ---")
trip_data = {
    "destination": "London",
    "days": 3,
    "budget": 2000,
    "budget_level": "Balanced",
    "interests": ["Museums", "Food"],
    "trip_id": "test_trip",
    "user_id": "test_user"
}
try:
    itinerary = generate_itinerary(trip_data)
    days_count = len(itinerary.get('days', []))
    log(f"Itinerary Generated: {days_count} days found.")
    if itinerary.get("is_mock"):
        log("WARNING: Itinerary is MOCK data (Fallback triggered).")
    else:
        log("SUCCESS: Real AI itinerary generated.")
except Exception as e:
    log(f"Itinerary FAILED: {e}")
