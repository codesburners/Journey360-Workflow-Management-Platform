import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

mongo_uri = os.getenv("MONGO_URI")
print(f"MONGO_URI loaded: {'YES' if mongo_uri else 'NO'}")
if mongo_uri:
    print(f"URI prefix: {mongo_uri[:40]}...")

from pymongo import MongoClient

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    info = client.server_info()
    print(f"Connected to MongoDB version: {info.get('version')}")
    
    db = client["journey360"]
    collections = db.list_collection_names()
    print(f"Collections: {collections}")
    
    trips = db["trips"]
    count = trips.count_documents({})
    print(f"Trip count: {count}")
    
    if count > 0:
        sample = trips.find_one()
        print(f"Sample trip: destination={sample.get('destination')}, user={sample.get('user_id')}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
