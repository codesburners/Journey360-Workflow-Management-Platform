from pymongo import MongoClient
import os
from pathlib import Path
from dotenv import load_dotenv

# Handle .env loading from backend directory
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

mongo_uri = os.getenv("MONGO_URI")

if mongo_uri:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    db = client["journey360"]
    try:
        client.admin.command('ping')
        print("✅ MongoDB connected successfully (local).", flush=True)
    except Exception as _ping_err:
        print(f"⚠️  WARNING: MongoDB ping failed: {_ping_err}", flush=True)
        print("   Make sure mongod is running locally on port 27017.", flush=True)
        print("   You can start it with: mongod --dbpath <your-data-path>", flush=True)
    users_collection = db["users"]
    trips_collection = db["trips"]
    itineraries_collection = db["itineraries"]
    saved_places_collection = db["saved_places"]
else:
    # Handle missing config gracefully or let it fail later
    client = None
    db = None
    users_collection = None
    trips_collection = None
    itineraries_collection = None
    saved_places_collection = None
    print("Warning: MONGO_URI not found in .env")
