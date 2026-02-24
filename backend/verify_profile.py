from pymongo import MongoClient
import os
from pathlib import Path
from dotenv import load_dotenv
import datetime

# Setup
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

def log(msg):
    with open("profile_log.txt", "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")
    print(msg)

with open("profile_log.txt", "w") as f: f.write("Starting Profile Debug\n")

uri = os.getenv("MONGO_URI")
if not uri:
    log("CRITICAL: MONGO_URI missing")
    exit(1)

client = MongoClient(uri)
db = client["journey360"]
users_col = db["users"]

# Test Data
uid = "test_user_debug"
update_data = {
    "name": "Debug User",
    "bio": "I am being debugged",
    "preferences": {"currency": "INR", "language": "English"},
    "email": "debug@example.com",
    "uid": uid
}

log(f"DEBUG: Attempting to update profile for uid={uid}")

try:
    # Mimic routes.py logic
    result = users_col.update_one(
        {"uid": uid},
        {"$set": update_data},
        upsert=True
    )
    
    log(f"DEBUG: Update Result: matched={result.matched_count}, modified={result.modified_count}, upserted={result.upserted_id}")
    
    # Verify save
    saved = users_col.find_one({"uid": uid})
    if saved and saved.get("bio") == "I am being debugged":
        log("SUCCESS: Profile saved successfully in DB.")
        # Cleanup
        users_col.delete_one({"uid": uid})
        log("DEBUG: Test user cleaned up.")
    else:
        log(f"FAILURE: Data not found or mismatch. Found: {saved}")

except Exception as e:
    log(f"CRITICAL: Profile update failed: {e}")
