
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

print("DEBUG: Script started", flush=True)

# Setup path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir.parent))
sys.path.append(str(backend_dir))
print(f"DEBUG: Paths added: {sys.path}", flush=True)

load_dotenv()
print("DEBUG: Dotenv loaded", flush=True)

# Mock Trip Data
mock_trip = {
    "destination": "Paris",
    "days": 3,
    "budget": 1000,
    "user_id": "test_user",
    "interests": ["Food", "Art"]
}

try:
    print("DEBUG: Attempting to import call_llm...", flush=True)
    from backend.ai.itinerary import call_llm
    print("DEBUG: Import successful", flush=True)
except ImportError as e:
    print(f"DEBUG: ImportError: {e}", flush=True)
    try:
        from ai.itinerary import call_llm
        print("DEBUG: Import successful (fallback)", flush=True)
    except ImportError as e2:
        print(f"DEBUG: Import fallback failed: {e2}", flush=True)
        sys.exit(1)

print("Testing AI Connection...", flush=True)
try:
    res = call_llm("Generate a JSON: {'message': 'hello'}", mock_trip)
    print("SUCCESS:", res, flush=True)
except Exception as e:
    print("FAILURE:", e, flush=True)
    import traceback
    traceback.print_exc()
