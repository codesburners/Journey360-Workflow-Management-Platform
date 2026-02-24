import os
from pymongo import MongoClient
import sys

# Base URI parts (derived from user input)
# mongodb+srv://admin:<password>@cluster1.j1rm7ox.mongodb.net/...
base_host = "cluster1.j1rm7ox.mongodb.net"
auth_source = "admin"
user = "admin"

candidate_passwords = [
    "password123",        # The one I asked for
    "password@123",       # The one they typed (as literal)
    "password%40123",     # The one they typed (encoded)
    "<password@123>",     # Literally what they pasted
]

output = []
success = False
correct_uri = ""

for pwd in candidate_passwords:
    # Construct URI manually to ensure encoding is controlled
    # Note: pymongo handles some encoding, but we'll specific formatting
    if "%" in pwd:
        # Assume already encoded
        uri = f"mongodb+srv://{user}:{pwd}@{base_host}/journey360?retryWrites=true&w=majority&appName=Cluster1"
    else:
        from urllib.parse import quote_plus
        uri = f"mongodb+srv://{user}:{quote_plus(pwd)}@{base_host}/journey360?retryWrites=true&w=majority&appName=Cluster1"
    
    output.append(f"Attempting password: '{pwd}' ...")
    
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.admin.command('ismaster')
        output.append("✅ Connection Successful!")
        output.append(f"Valid URI found.")
        success = True
        correct_uri = uri
        break
    except Exception as e:
        output.append(f"❌ Failed: {e}")

if success:
    # Write the working env file immediately
    with open("backend/.env", "r") as f:
        lines = f.readlines()
    
    with open("backend/.env", "w") as f:
        for line in lines:
            if line.startswith("MONGO_URI="):
                f.write(f"MONGO_URI={correct_uri}\n")
            else:
                f.write(line)
    output.append("✅ backend/.env automatically updated with the correct password.")

with open("backend/atlas_status.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output))
