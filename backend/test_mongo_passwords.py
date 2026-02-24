from pymongo import MongoClient
from urllib.parse import quote_plus
import sys

# Try multiple password variations
passwords = [
    "password@123",
    "password123",
    "password%40123",
    "Password@123",
    "Password123",
]

for pwd in passwords:
    encoded = quote_plus(pwd)
    uri = f"mongodb+srv://admin:{encoded}@cluster1.j1rm7ox.mongodb.net/journey360?retryWrites=true&w=majority&appName=Cluster1"
    try:
        c = MongoClient(uri, serverSelectionTimeoutMS=5000)
        info = c.admin.command('ping')
        print(f"SUCCESS with password: {pwd}")
        print(f"Ping result: {info}")
        sys.exit(0)
    except Exception as e:
        print(f"FAILED with password '{pwd}': {e}")
    
print("\nAll password variants failed. The password needs to be reset in MongoDB Atlas > Database Access.")
