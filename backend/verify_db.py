from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import os
from pathlib import Path
from dotenv import load_dotenv

# Replicate logic from db.py
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

uri = os.getenv("MONGO_URI")
print(f"DEBUG: MONGO_URI present? {'YES' if uri else 'NO'}")

def log(msg):
    with open("db_manual_log.txt", "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")
    print(msg)

with open("db_manual_log.txt", "w") as f: f.write("Starting DB Log\n")

if not uri:
    log("CRITICAL: MONGO_URI is missing from .env")
    exit(1)

try:
    log("DEBUG: Attempting connection...")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    # Trigger a connection check
    client.admin.command('ping')
    log("SUCCESS: Connected to MongoDB!")
    
    db = client["journey360"]
    log(f"DEBUG: Database: {db.name}")
    log(f"DEBUG: Collections: {db.list_collection_names()}")
    
    # Check users collection
    count = db.users.count_documents({})
    log(f"DEBUG: Users count: {count}")

except ConnectionFailure:
    log("CRITICAL: Server not available (ConnectionFailure). Check if IP is whitelisted or URI is correct.")
except OperationFailure as e:
    log(f"CRITICAL: Authentication failed or permission denied: {e}")
except Exception as e:
    log(f"CRITICAL: Unexpected error: {e}")
