import os, sys
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / '.env')

uri = os.getenv('MONGO_URI')
print('MONGO_URI found:', bool(uri))
if uri:
    print('URI prefix:', uri[:40] + '...')

from pymongo import MongoClient
try:
    c = MongoClient(uri, serverSelectionTimeoutMS=8000)
    c.admin.command('ping')
    print('SUCCESS: MongoDB Atlas is reachable!')
    db = c['journey360']
    print('Collections:', db.list_collection_names())
except Exception as e:
    print('FAIL - MongoDB not reachable:', type(e).__name__, str(e)[:200])
    sys.exit(1)
