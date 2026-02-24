
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

# Write to a file directly to bypass stdout buffering issues
with open("test_output.txt", "w", encoding="utf-8") as f:
    f.write("DEBUG: Script started\n")

    # Setup path
    backend_dir = Path(__file__).resolve().parent
    sys.path.append(str(backend_dir.parent))
    sys.path.append(str(backend_dir))
    f.write(f"DEBUG: Paths added: {sys.path}\n")

    load_dotenv()
    f.write("DEBUG: Dotenv loaded\n")

    # Mock Trip Data
    mock_trip = {
        "destination": "Paris",
        "days": 3,
        "budget": 1000,
        "user_id": "test_user",
        "interests": ["Food", "Art"]
    }

    try:
        f.write("DEBUG: Attempting to import call_llm...\n")
        from backend.ai.itinerary import call_llm
        f.write("DEBUG: Import successful\n")
    except ImportError as e:
        f.write(f"DEBUG: ImportError: {e}\n")
        try:
            from ai.itinerary import call_llm
            f.write("DEBUG: Import successful (fallback)\n")
        except ImportError as e2:
            f.write(f"DEBUG: Import fallback failed: {e2}\n")
            sys.exit(1)

    f.write("Testing AI Connection...\n")
    try:
        res = call_llm("Generate a JSON: {'message': 'hello'}", mock_trip)
        f.write(f"SUCCESS: {res}\n")
    except Exception as e:
        f.write(f"FAILURE: {e}\n")
        import traceback
        traceback.print_exc(file=f)
