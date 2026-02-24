"""Quick test: can main.py import chain resolve without errors?"""
import sys, os
from pathlib import Path

# Match what main.py does
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

# Load .env
from dotenv import load_dotenv
load_dotenv(dotenv_path=current_dir / '.env', override=True)

print("Step 1: Testing auth imports...", flush=True)
try:
    from auth.dependencies import get_current_user
    print("  ✅ auth.dependencies OK", flush=True)
except Exception as e:
    print(f"  ❌ auth.dependencies FAILED: {e}", flush=True)

print("Step 2: Testing database imports...", flush=True)
try:
    from database.db import trips_collection, itineraries_collection, users_collection
    print(f"  ✅ database.db OK (trips={trips_collection is not None}, itineraries={itineraries_collection is not None})", flush=True)
except Exception as e:
    print(f"  ❌ database.db FAILED: {e}", flush=True)

print("Step 3: Testing trips routes...", flush=True)
try:
    from trips.routes import router as trips_router
    print(f"  ✅ trips.routes OK ({len(trips_router.routes)} routes)", flush=True)
except Exception as e:
    print(f"  ❌ trips.routes FAILED: {e}", flush=True)

print("Step 4: Testing AI routes...", flush=True)
try:
    from ai.routes import router as ai_router
    print(f"  ✅ ai.routes OK ({len(ai_router.routes)} routes)", flush=True)
except Exception as e:
    print(f"  ❌ ai.routes FAILED: {e}", flush=True)

print("Step 5: Testing users routes...", flush=True)
try:
    from users.routes import router as users_router
    print(f"  ✅ users.routes OK ({len(users_router.routes)} routes)", flush=True)
except Exception as e:
    print(f"  ❌ users.routes FAILED: {e}", flush=True)

print("Step 6: Testing saved_places routes...", flush=True)
try:
    from saved_places.routes import router as saved_places_router
    print(f"  ✅ saved_places.routes OK ({len(saved_places_router.routes)} routes)", flush=True)
except Exception as e:
    print(f"  ❌ saved_places.routes FAILED: {e}", flush=True)

print("Step 7: Testing transport service...", flush=True)
try:
    from services.transport_service import router as transport_router
    print(f"  ✅ transport_service OK ({len(transport_router.routes)} routes)", flush=True)
except Exception as e:
    print(f"  ❌ transport_service FAILED: {e}", flush=True)

print("Step 8: Testing news service...", flush=True)
try:
    from services.news_service import get_safety_news
    print(f"  ✅ news_service OK", flush=True)
except Exception as e:
    print(f"  ❌ news_service FAILED: {e}", flush=True)

print("\n=== FULL APP IMPORT TEST ===", flush=True)
try:
    from main import app
    print(f"✅ App loaded! Total routes: {len(app.routes)}", flush=True)
except Exception as e:
    print(f"❌ App FAILED to load: {e}", flush=True)
    import traceback
    traceback.print_exc()
